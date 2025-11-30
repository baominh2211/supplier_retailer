import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { supplierController } from '../controllers/supplierController.js';
import { productController } from '../controllers/productController.js';
import { negotiationController } from '../controllers/negotiationController.js';
import { purchaseIntentController } from '../controllers/purchaseIntentController.js';
import { categoryController } from '../controllers/categoryController.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { authenticate, adminOnly, supplierOnly, shopOnly, verifiedSupplierOnly } from '../middlewares/auth.js';
import { validateBody, validateQuery, validateParams } from '../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  updateSupplierSchema,
  verifySupplierSchema,
  suspendUserSchema,
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  createNegotiationSchema,
  sendMessageSchema,
  updateNegotiationStatusSchema,
  createPurchaseIntentSchema,
  cancelPurchaseIntentSchema,
  createCategorySchema,
  updateCategorySchema,
  supplierFilterSchema,
  paginationSchema,
  uuidSchema,
} from '../utils/validators.js';
import { z } from 'zod';

const router = Router();

// ========================================
// Health Check
// ========================================
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================================
// Authentication Routes
// ========================================
const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(authController.register));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(authController.login));
authRouter.post('/refresh', validateBody(refreshTokenSchema), asyncHandler(authController.refreshToken));
authRouter.post('/logout', validateBody(refreshTokenSchema), asyncHandler(authController.logout));
authRouter.post('/logout-all', authenticate, asyncHandler(authController.logoutAll));
authRouter.post('/verify-email', validateBody(verifyEmailSchema), asyncHandler(authController.verifyEmail));
authRouter.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
authRouter.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(authController.resetPassword));
authRouter.post('/change-password', authenticate, asyncHandler(authController.changePassword));
authRouter.post('/resend-verification', authenticate, asyncHandler(authController.resendVerification));
authRouter.get('/me', authenticate, asyncHandler(authController.me));

router.use('/auth', authRouter);

// ========================================
// Supplier Routes
// ========================================
const supplierRouter = Router();

// Public routes
supplierRouter.get('/', validateQuery(supplierFilterSchema), asyncHandler(supplierController.list));
supplierRouter.get('/:id', validateParams(z.object({ id: uuidSchema })), asyncHandler(supplierController.getById));
supplierRouter.get('/:id/stats', validateParams(z.object({ id: uuidSchema })), asyncHandler(supplierController.getStats));

// Authenticated supplier routes
supplierRouter.get('/me/profile', authenticate, supplierOnly, asyncHandler(supplierController.getMyProfile));
supplierRouter.put('/:id', authenticate, supplierOnly, validateParams(z.object({ id: uuidSchema })), validateBody(updateSupplierSchema), asyncHandler(supplierController.update));
supplierRouter.post('/:id/submit-verification', authenticate, supplierOnly, validateParams(z.object({ id: uuidSchema })), asyncHandler(supplierController.submitForVerification));

// Admin routes
supplierRouter.get('/admin/all', authenticate, adminOnly, validateQuery(supplierFilterSchema), asyncHandler(supplierController.listAll));
supplierRouter.post('/:id/verify', authenticate, adminOnly, validateParams(z.object({ id: uuidSchema })), validateBody(verifySupplierSchema), asyncHandler(supplierController.verify));
supplierRouter.post('/:id/suspend', authenticate, adminOnly, validateParams(z.object({ id: uuidSchema })), validateBody(suspendUserSchema), asyncHandler(supplierController.suspend));

router.use('/suppliers', supplierRouter);

// ========================================
// Product Routes
// ========================================
const productRouter = Router();

// Public routes
productRouter.get('/', validateQuery(productFilterSchema), asyncHandler(productController.list));
productRouter.get('/featured', asyncHandler(productController.getFeatured));
productRouter.get('/:id', validateParams(z.object({ id: uuidSchema })), asyncHandler(productController.getById));
productRouter.get('/supplier/:supplierId', validateParams(z.object({ supplierId: uuidSchema })), validateQuery(productFilterSchema), asyncHandler(productController.listBySupplier));

// Authenticated supplier routes
productRouter.get('/me/products', authenticate, verifiedSupplierOnly, validateQuery(productFilterSchema), asyncHandler(productController.listMyProducts));
productRouter.post('/', authenticate, verifiedSupplierOnly, validateBody(createProductSchema), asyncHandler(productController.create));
productRouter.put('/:id', authenticate, verifiedSupplierOnly, validateParams(z.object({ id: uuidSchema })), validateBody(updateProductSchema), asyncHandler(productController.update));
productRouter.delete('/:id', authenticate, verifiedSupplierOnly, validateParams(z.object({ id: uuidSchema })), asyncHandler(productController.delete));
productRouter.post('/:id/toggle-active', authenticate, verifiedSupplierOnly, validateParams(z.object({ id: uuidSchema })), asyncHandler(productController.toggleActive));

router.use('/products', productRouter);

// ========================================
// Negotiation Routes
// ========================================
const negotiationRouter = Router();

negotiationRouter.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(negotiationController.list));
negotiationRouter.get('/:id', authenticate, validateParams(z.object({ id: uuidSchema })), asyncHandler(negotiationController.getById));
negotiationRouter.post('/', authenticate, shopOnly, validateBody(createNegotiationSchema), asyncHandler(negotiationController.create));
negotiationRouter.get('/:id/messages', authenticate, validateParams(z.object({ id: uuidSchema })), validateQuery(paginationSchema), asyncHandler(negotiationController.getMessages));
negotiationRouter.post('/:id/messages', authenticate, validateParams(z.object({ id: uuidSchema })), validateBody(sendMessageSchema), asyncHandler(negotiationController.sendMessage));
negotiationRouter.post('/:id/read', authenticate, validateParams(z.object({ id: uuidSchema })), asyncHandler(negotiationController.markAsRead));
negotiationRouter.put('/:id/status', authenticate, validateParams(z.object({ id: uuidSchema })), validateBody(updateNegotiationStatusSchema), asyncHandler(negotiationController.updateStatus));

router.use('/negotiations', negotiationRouter);

// ========================================
// Purchase Intent Routes
// ========================================
const purchaseIntentRouter = Router();

purchaseIntentRouter.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(purchaseIntentController.list));
purchaseIntentRouter.get('/:id', authenticate, validateParams(z.object({ id: uuidSchema })), asyncHandler(purchaseIntentController.getById));
purchaseIntentRouter.get('/number/:intentNumber', authenticate, asyncHandler(purchaseIntentController.getByIntentNumber));
purchaseIntentRouter.post('/', authenticate, shopOnly, validateBody(createPurchaseIntentSchema), asyncHandler(purchaseIntentController.create));
purchaseIntentRouter.post('/:id/submit', authenticate, shopOnly, validateParams(z.object({ id: uuidSchema })), asyncHandler(purchaseIntentController.submit));
purchaseIntentRouter.post('/:id/accept', authenticate, supplierOnly, validateParams(z.object({ id: uuidSchema })), asyncHandler(purchaseIntentController.accept));
purchaseIntentRouter.post('/:id/cancel', authenticate, validateParams(z.object({ id: uuidSchema })), validateBody(cancelPurchaseIntentSchema), asyncHandler(purchaseIntentController.cancel));

router.use('/purchase-intents', purchaseIntentRouter);

// ========================================
// Category Routes
// ========================================
const categoryRouter = Router();

// Public routes
categoryRouter.get('/', asyncHandler(categoryController.getTree));
categoryRouter.get('/:id', validateParams(z.object({ id: uuidSchema })), asyncHandler(categoryController.getById));
categoryRouter.get('/slug/:slug', asyncHandler(categoryController.getBySlug));

// Admin routes
categoryRouter.post('/', authenticate, adminOnly, validateBody(createCategorySchema), asyncHandler(categoryController.create));
categoryRouter.put('/:id', authenticate, adminOnly, validateParams(z.object({ id: uuidSchema })), validateBody(updateCategorySchema), asyncHandler(categoryController.update));
categoryRouter.delete('/:id', authenticate, adminOnly, validateParams(z.object({ id: uuidSchema })), asyncHandler(categoryController.delete));

router.use('/categories', categoryRouter);

export default router;
