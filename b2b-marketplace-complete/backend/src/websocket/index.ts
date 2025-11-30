import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface JoinRoomData {
  sessionId: string;
}

interface SendMessageData {
  sessionId: string;
  content: string;
  messageType?: string;
  metadata?: Record<string, any>;
}

interface TypingData {
  sessionId: string;
  isTyping: boolean;
}

export function setupWebSocket(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: config.security.corsOrigin,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true, accountStatus: true },
      });

      if (!user || user.accountStatus !== 'ACTIVE') {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      logger.warn({ error }, 'WebSocket authentication failed');
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info({ userId: socket.userId, socketId: socket.id }, 'Client connected');

    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Join negotiation room
    socket.on('join:negotiation', async (data: JoinRoomData) => {
      try {
        const { sessionId } = data;

        // Verify user is a participant
        const session = await prisma.negotiationSession.findUnique({
          where: { id: sessionId },
          include: {
            shop: { select: { userId: true } },
            supplier: { select: { userId: true } },
          },
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const isParticipant =
          session.shop.userId === socket.userId ||
          session.supplier.userId === socket.userId;

        if (!isParticipant) {
          socket.emit('error', { message: 'Not a participant' });
          return;
        }

        socket.join(`negotiation:${sessionId}`);
        socket.emit('joined:negotiation', { sessionId });

        logger.debug({ userId: socket.userId, sessionId }, 'Joined negotiation room');
      } catch (error) {
        logger.error({ error }, 'Error joining negotiation room');
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave negotiation room
    socket.on('leave:negotiation', (data: JoinRoomData) => {
      socket.leave(`negotiation:${data.sessionId}`);
      logger.debug({ userId: socket.userId, sessionId: data.sessionId }, 'Left negotiation room');
    });

    // Send message (real-time broadcast)
    socket.on('send:message', async (data: SendMessageData) => {
      try {
        const { sessionId, content, messageType = 'TEXT', metadata } = data;

        // Verify participation and create message in database
        const session = await prisma.negotiationSession.findUnique({
          where: { id: sessionId },
          include: {
            shop: { select: { userId: true } },
            supplier: { select: { userId: true } },
          },
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const isShop = session.shop.userId === socket.userId;
        const isSupplier = session.supplier.userId === socket.userId;

        if (!isShop && !isSupplier) {
          socket.emit('error', { message: 'Not a participant' });
          return;
        }

        const senderRole = isShop ? 'SHOP' : 'SUPPLIER';

        // Create message in database
        const message = await prisma.$transaction(async (tx) => {
          const msg = await tx.negotiationMessage.create({
            data: {
              sessionId,
              senderUserId: socket.userId!,
              content,
              messageType: messageType as any,
              senderRole: senderRole as any,
              metadata: metadata || {},
            },
            include: {
              sender: {
                select: { id: true, email: true },
              },
            },
          });

          // Update session
          await tx.negotiationSession.update({
            where: { id: sessionId },
            data: {
              totalMessages: { increment: 1 },
              lastMessageAt: new Date(),
              lastMessageById: socket.userId,
              ...(senderRole === 'SHOP'
                ? { supplierUnreadCount: { increment: 1 } }
                : { shopUnreadCount: { increment: 1 } }),
            },
          });

          return msg;
        });

        // Broadcast to room
        io.to(`negotiation:${sessionId}`).emit('new:message', {
          sessionId,
          message: {
            id: message.id,
            content: message.content,
            messageType: message.messageType,
            senderRole: message.senderRole,
            senderId: message.sender.id,
            senderEmail: message.sender.email,
            metadata: message.metadata,
            createdAt: message.createdAt,
          },
        });

        logger.debug({ messageId: message.id, sessionId }, 'Message sent via WebSocket');
      } catch (error) {
        logger.error({ error }, 'Error sending message');
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data: TypingData) => {
      socket.to(`negotiation:${data.sessionId}`).emit('user:typing', {
        sessionId: data.sessionId,
        userId: socket.userId,
        isTyping: data.isTyping,
      });
    });

    // Mark messages as read
    socket.on('mark:read', async (data: JoinRoomData) => {
      try {
        const { sessionId } = data;

        const session = await prisma.negotiationSession.findUnique({
          where: { id: sessionId },
          include: {
            shop: { select: { userId: true } },
            supplier: { select: { userId: true } },
          },
        });

        if (!session) return;

        const isShop = session.shop.userId === socket.userId;
        const isSupplier = session.supplier.userId === socket.userId;

        if (!isShop && !isSupplier) return;

        // Update messages and session
        await prisma.$transaction([
          prisma.negotiationMessage.updateMany({
            where: {
              sessionId,
              ...(isShop ? { isReadByShop: false } : { isReadBySupplier: false }),
            },
            data: {
              ...(isShop
                ? { isReadByShop: true, readByShopAt: new Date() }
                : { isReadBySupplier: true, readBySupplierAt: new Date() }),
            },
          }),
          prisma.negotiationSession.update({
            where: { id: sessionId },
            data: {
              ...(isShop ? { shopUnreadCount: 0 } : { supplierUnreadCount: 0 }),
            },
          }),
        ]);

        // Notify other participants
        socket.to(`negotiation:${sessionId}`).emit('messages:read', {
          sessionId,
          readBy: socket.userId,
        });
      } catch (error) {
        logger.error({ error }, 'Error marking messages as read');
      }
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      logger.info({ userId: socket.userId, socketId: socket.id, reason }, 'Client disconnected');
    });
  });

  logger.info('WebSocket server initialized');

  return io;
}

// Utility to emit to specific users
export function emitToUser(io: Server, userId: string, event: string, data: any): void {
  io.to(`user:${userId}`).emit(event, data);
}

// Utility to emit to negotiation room
export function emitToNegotiation(io: Server, sessionId: string, event: string, data: any): void {
  io.to(`negotiation:${sessionId}`).emit(event, data);
}
