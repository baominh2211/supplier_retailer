import { z } from 'zod';

// Common schemas
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['SUPPLIER', 'SHOP']),
  companyName: z.string().min(2).max(255).optional(),
  shopName: z.string().min(2).max(255).optional(),
  country: z.string().min(2).max(100),
}).refine(data => {
  if (data.role === 'SUPPLIER') return !!data.companyName;
  if (data.role === 'SHOP') return !!data.shopName;
  return true;
}, {
  message: 'Company name is required for suppliers, shop name is required for shops',
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

// Supplier schemas
export const createSupplierSchema = z.object({
  companyName: z.string().min(2).max(255),
  legalName: z.string().min(2).max(255),
  taxId: z.string().min(1).max(50),
  country: z.string().min(2).max(100),
  businessType: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  employeeCountRange: z.string().max(50).optional(),
  annualRevenueRange: z.string().max(50).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  stateProvince: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().max(255).optional().or(z.literal('')),
  contactPersonName: z.string().max(255).optional(),
  contactPersonEmail: emailSchema.optional().or(z.literal('')),
  contactPersonPhone: z.string().max(20).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// Shop schemas
export const createShopSchema = z.object({
  shopName: z.string().min(2).max(255),
  country: z.string().min(2).max(100),
  legalName: z.string().max(255).optional(),
  businessType: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  stateProvince: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().max(255).optional().or(z.literal('')),
  contactPersonName: z.string().max(255).optional(),
  contactPersonEmail: emailSchema.optional().or(z.literal('')),
  contactPersonPhone: z.string().max(20).optional(),
});

export const updateShopSchema = createShopSchema.partial();

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  parentId: uuidSchema.optional().nullable(),
  description: z.string().max(1000).optional(),
  iconUrl: z.string().url().max(500).optional(),
  bannerUrl: z.string().url().max(500).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().max(500).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Product schemas
export const createProductSchema = z.object({
  categoryId: uuidSchema,
  name: z.string().min(2).max(255),
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(500).optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  hsCode: z.string().max(20).optional(),
  unitPrice: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  minOrderQuantity: z.number().int().positive().default(1),
  priceUnit: z.string().max(50).default('piece'),
  bulkPricingTiers: z.array(z.object({
    minQuantity: z.number().int().positive(),
    maxQuantity: z.number().int().positive().optional(),
    price: z.number().positive(),
  })).optional(),
  stockQuantity: z.number().int().nonnegative().default(0),
  leadTimeDays: z.number().int().nonnegative().default(7),
  originCountry: z.string().max(100).optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  mainImageUrl: z.string().url().max(500).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  categoryId: uuidSchema.optional(),
  supplierId: uuidSchema.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minMoq: z.coerce.number().int().positive().optional(),
  maxMoq: z.coerce.number().int().positive().optional(),
  country: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
}).merge(paginationSchema);

// Negotiation schemas
export const createNegotiationSchema = z.object({
  supplierId: uuidSchema,
  productId: uuidSchema.optional(),
  requestedQuantity: z.number().int().positive().optional(),
  requestedPrice: z.number().positive().optional(),
  requestedCurrency: z.string().length(3).default('USD'),
  shippingRequirements: z.string().max(2000).optional(),
  paymentTermsRequest: z.string().max(1000).optional(),
  initialMessage: z.string().min(10).max(5000),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  messageType: z.enum([
    'TEXT',
    'PRICE_OFFER',
    'COUNTER_OFFER',
    'MOQ_INQUIRY',
    'SHIPPING_INQUIRY',
    'PAYMENT_TERMS',
    'DELIVERY_DATE',
    'SPECIFICATION_QUESTION',
    'ATTACHMENT',
  ]).default('TEXT'),
  metadata: z.record(z.string(), z.any()).optional(),
  replyToMessageId: uuidSchema.optional(),
});

export const updateNegotiationStatusSchema = z.object({
  status: z.enum([
    'ACTIVE',
    'AGREED',
    'CLOSED_CANCELLED',
  ]),
  closedReason: z.string().max(500).optional(),
  finalAgreedPrice: z.number().positive().optional(),
  finalAgreedQuantity: z.number().int().positive().optional(),
  finalShippingTerms: z.string().max(2000).optional(),
  finalPaymentTerms: z.string().max(1000).optional(),
  agreedDeliveryDate: z.string().datetime().optional(),
});

// Purchase Intent schemas
export const createPurchaseIntentSchema = z.object({
  supplierId: uuidSchema,
  productId: uuidSchema.optional(),
  negotiationSessionId: uuidSchema.optional(),
  productName: z.string().min(2).max(255),
  productSku: z.string().max(100).optional(),
  quantity: z.number().int().positive(),
  agreedUnitPrice: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  shippingTerms: z.string().max(2000).optional(),
  paymentTerms: z.string().max(1000).optional(),
  deliveryDate: z.string().datetime().optional(),
  shippingAddress: z.object({
    line1: z.string().max(255),
    line2: z.string().max(255).optional(),
    city: z.string().max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20),
    country: z.string().max(100),
  }).optional(),
  notes: z.string().max(2000).optional(),
});

export const updatePurchaseIntentSchema = createPurchaseIntentSchema.partial();

export const cancelPurchaseIntentSchema = z.object({
  cancellationReason: z.string().min(10).max(1000),
});

// Supplier filter schemas
export const supplierFilterSchema = z.object({
  status: z.enum(['PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED', 'REJECTED', 'BANNED']).optional(),
  country: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  search: z.string().optional(),
}).merge(paginationSchema);

// Admin schemas
export const verifySupplierSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(1000).optional(),
}).refine(data => {
  if (!data.approved && !data.rejectionReason) {
    return false;
  }
  return true;
}, {
  message: 'Rejection reason is required when rejecting a supplier',
});

export const suspendUserSchema = z.object({
  reason: z.string().min(10).max(1000),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type CreateNegotiationInput = z.infer<typeof createNegotiationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreatePurchaseIntentInput = z.infer<typeof createPurchaseIntentSchema>;
export type SupplierFilterInput = z.infer<typeof supplierFilterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
