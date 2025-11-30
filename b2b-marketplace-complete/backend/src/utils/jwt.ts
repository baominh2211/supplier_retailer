import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { UnauthorizedError, TokenExpiredError } from './errors.js';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'tokenId'>): string {
  const tokenId = uuidv4();
  return jwt.sign(
    { ...payload, tokenId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(): string {
  return uuidv4() + '-' + uuidv4();
}

/**
 * Generate token pair (access + refresh)
 */
export async function generateTokenPair(
  user: { id: string; email: string; role: string },
  userAgent?: string,
  ipAddress?: string
): Promise<TokenPair> {
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + parseDuration(config.jwt.refreshExpiresIn));

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(parseDuration(config.jwt.expiresIn) / 1000),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError();
    }
    throw new UnauthorizedError('Invalid token');
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: string }> {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!refreshToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (refreshToken.revokedAt) {
    throw new UnauthorizedError('Refresh token has been revoked');
  }

  if (refreshToken.expiresAt < new Date()) {
    throw new TokenExpiredError();
  }

  return { userId: refreshToken.userId };
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.update({
    where: { token },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Clean up expired tokens (for cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });
  return result.count;
}
