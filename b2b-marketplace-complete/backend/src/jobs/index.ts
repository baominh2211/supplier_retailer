import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { purchaseIntentService } from '../services/purchaseIntentService.js';
import { cleanupExpiredTokens } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

/**
 * Expire stale purchase intents
 * Runs every 5 minutes
 */
async function expirePurchaseIntents(): Promise<void> {
  try {
    const count = await purchaseIntentService.expireIntents();
    if (count > 0) {
      logger.info({ count }, 'Expired purchase intents');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to expire purchase intents');
  }
}

/**
 * Expire stale negotiations
 * Runs every 5 minutes
 */
async function expireNegotiations(): Promise<void> {
  try {
    const now = new Date();

    const expiredSessions = await prisma.negotiationSession.findMany({
      where: {
        status: {
          in: ['INITIATED', 'PENDING_SUPPLIER_RESPONSE', 'ACTIVE', 'AWAITING_SHOP_RESPONSE', 'AWAITING_SUPPLIER_RESPONSE'],
        },
        expiresAt: { lt: now },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (expiredSessions.length > 0) {
      await prisma.negotiationSession.updateMany({
        where: {
          id: { in: expiredSessions.map(s => s.id) },
        },
        data: {
          status: 'CLOSED_EXPIRED',
          closedAt: now,
          closedReason: 'Session expired due to inactivity',
        },
      });

      logger.info({ count: expiredSessions.length }, 'Expired negotiations');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to expire negotiations');
  }
}

/**
 * Clean up expired refresh tokens
 * Runs every hour
 */
async function cleanupTokens(): Promise<void> {
  try {
    const count = await cleanupExpiredTokens();
    if (count > 0) {
      logger.info({ count }, 'Cleaned up expired tokens');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup tokens');
  }
}

/**
 * Update supplier statistics
 * Runs every hour
 */
async function updateSupplierStats(): Promise<void> {
  try {
    // Update total products count
    await prisma.$executeRaw`
      UPDATE suppliers s
      SET total_products = (
        SELECT COUNT(*) FROM products p 
        WHERE p.supplier_id = s.id AND p.deleted_at IS NULL AND p.is_active = TRUE
      )
      WHERE s.deleted_at IS NULL
    `;

    // Update total negotiations count
    await prisma.$executeRaw`
      UPDATE suppliers s
      SET total_negotiations = (
        SELECT COUNT(*) FROM negotiation_sessions n 
        WHERE n.supplier_id = s.id AND n.deleted_at IS NULL
      )
      WHERE s.deleted_at IS NULL
    `;

    // Update successful negotiations count
    await prisma.$executeRaw`
      UPDATE suppliers s
      SET successful_negotiations = (
        SELECT COUNT(*) FROM negotiation_sessions n 
        WHERE n.supplier_id = s.id AND n.status = 'AGREED' AND n.deleted_at IS NULL
      )
      WHERE s.deleted_at IS NULL
    `;

    logger.debug('Updated supplier statistics');
  } catch (error) {
    logger.error({ error }, 'Failed to update supplier stats');
  }
}

/**
 * Update category product counts
 * Runs every hour
 */
async function updateCategoryCounts(): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE categories c
      SET product_count = (
        SELECT COUNT(*) FROM products p 
        WHERE p.category_id = c.id AND p.deleted_at IS NULL AND p.is_active = TRUE
      )
    `;

    logger.debug('Updated category product counts');
  } catch (error) {
    logger.error({ error }, 'Failed to update category counts');
  }
}

/**
 * Clean up soft-deleted records older than 90 days
 * Runs daily at 3 AM
 */
async function cleanupSoftDeletedRecords(): Promise<void> {
  try {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 90);

    // Note: In production, you might want to archive these first
    const results = await Promise.all([
      prisma.negotiationMessage.deleteMany({
        where: { deletedAt: { lt: threshold } },
      }),
      prisma.negotiationSession.deleteMany({
        where: { deletedAt: { lt: threshold } },
      }),
      prisma.purchaseIntent.deleteMany({
        where: { deletedAt: { lt: threshold } },
      }),
    ]);

    const totalDeleted = results.reduce((sum, r) => sum + r.count, 0);

    if (totalDeleted > 0) {
      logger.info({ count: totalDeleted }, 'Cleaned up soft-deleted records');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup soft-deleted records');
  }
}

/**
 * Check suppliers needing re-verification
 * Runs daily at 9 AM
 */
async function checkReverification(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const suppliersNeedingReverification = await prisma.supplier.findMany({
      where: {
        status: 'VERIFIED',
        nextReverificationDate: { lte: today },
        deletedAt: null,
      },
      include: {
        user: { select: { email: true } },
      },
    });

    if (suppliersNeedingReverification.length > 0) {
      // Mark as pending re-verification
      await prisma.supplier.updateMany({
        where: {
          id: { in: suppliersNeedingReverification.map(s => s.id) },
        },
        data: {
          status: 'PENDING_VERIFICATION',
        },
      });

      logger.info(
        { count: suppliersNeedingReverification.length },
        'Suppliers marked for re-verification'
      );

      // TODO: Send notification emails
    }
  } catch (error) {
    logger.error({ error }, 'Failed to check re-verification');
  }
}

/**
 * Initialize all cron jobs
 */
export function initializeJobs(): void {
  // Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await expirePurchaseIntents();
    await expireNegotiations();
  });

  // Every hour
  cron.schedule('0 * * * *', async () => {
    await cleanupTokens();
    await updateSupplierStats();
    await updateCategoryCounts();
  });

  // Daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    await cleanupSoftDeletedRecords();
  });

  // Daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    await checkReverification();
  });

  logger.info('Background jobs initialized');
}

/**
 * Run all jobs immediately (for testing)
 */
export async function runAllJobs(): Promise<void> {
  await Promise.all([
    expirePurchaseIntents(),
    expireNegotiations(),
    cleanupTokens(),
    updateSupplierStats(),
    updateCategoryCounts(),
  ]);
}
