-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPPLIER', 'SHOP', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_EMAIL_VERIFICATION');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED', 'REJECTED', 'BANNED');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('INITIATED', 'PENDING_SUPPLIER_RESPONSE', 'ACTIVE', 'AWAITING_SHOP_RESPONSE', 'AWAITING_SUPPLIER_RESPONSE', 'AGREED', 'CLOSED_CANCELLED', 'CLOSED_EXPIRED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'PRICE_OFFER', 'COUNTER_OFFER', 'MOQ_INQUIRY', 'SHIPPING_INQUIRY', 'PAYMENT_TERMS', 'DELIVERY_DATE', 'SPECIFICATION_QUESTION', 'ATTACHMENT', 'SYSTEM_MESSAGE');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('SHOP', 'SUPPLIER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PurchaseIntentStatus" AS ENUM ('DRAFT', 'WAITING_SUPPLIER_RESPONSE', 'NEGOTIATING', 'AGREED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "account_status" "UserAccountStatus" NOT NULL DEFAULT 'PENDING_EMAIL_VERIFICATION',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_failed_login_at" TIMESTAMPTZ,
    "password_reset_token" VARCHAR(255),
    "password_reset_expires_at" TIMESTAMPTZ,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "legal_name" VARCHAR(255) NOT NULL,
    "business_license_number" VARCHAR(100),
    "tax_id" VARCHAR(50) NOT NULL,
    "business_type" VARCHAR(100),
    "description" TEXT,
    "year_established" INTEGER,
    "employee_count_range" VARCHAR(50),
    "annual_revenue_range" VARCHAR(50),
    "address_line_1" VARCHAR(255),
    "address_line_2" VARCHAR(255),
    "city" VARCHAR(100),
    "state_province" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "fax" VARCHAR(20),
    "website" VARCHAR(255),
    "contact_person_name" VARCHAR(255),
    "contact_person_title" VARCHAR(100),
    "contact_person_email" VARCHAR(255),
    "contact_person_phone" VARCHAR(20),
    "min_order_value" DECIMAL(12,2),
    "preferred_payment_terms" TEXT,
    "lead_time_days" INTEGER,
    "shipping_methods" JSONB,
    "export_countries" JSONB,
    "certifications" JSONB,
    "business_license_url" VARCHAR(500),
    "tax_document_url" VARCHAR(500),
    "certificate_urls" JSONB,
    "logo_url" VARCHAR(500),
    "banner_url" VARCHAR(500),
    "video_url" VARCHAR(500),
    "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "total_products" INTEGER NOT NULL DEFAULT 0,
    "total_negotiations" INTEGER NOT NULL DEFAULT 0,
    "successful_negotiations" INTEGER NOT NULL DEFAULT 0,
    "response_time_hours" DECIMAL(5,2),
    "status" "SupplierStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verified_at" TIMESTAMPTZ,
    "verified_by_admin_id" UUID,
    "rejection_reason" TEXT,
    "next_reverification_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "shop_name" VARCHAR(255) NOT NULL,
    "legal_name" VARCHAR(255),
    "business_license_number" VARCHAR(100),
    "tax_id" VARCHAR(50),
    "business_type" VARCHAR(100),
    "description" TEXT,
    "address_line_1" VARCHAR(255),
    "address_line_2" VARCHAR(255),
    "city" VARCHAR(100),
    "state_province" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "website" VARCHAR(255),
    "contact_person_name" VARCHAR(255),
    "contact_person_email" VARCHAR(255),
    "contact_person_phone" VARCHAR(20),
    "business_categories" JSONB,
    "preferred_suppliers_countries" JSONB,
    "average_order_value" DECIMAL(12,2),
    "monthly_purchase_volume" DECIMAL(12,2),
    "payment_terms_preference" VARCHAR(100),
    "logo_url" VARCHAR(500),
    "total_negotiations" INTEGER NOT NULL DEFAULT 0,
    "total_purchase_intents" INTEGER NOT NULL DEFAULT 0,
    "total_orders_value" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon_url" VARCHAR(500),
    "banner_url" VARCHAR(500),
    "level" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "seo_title" VARCHAR(255),
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "attributes_schema" JSONB,
    "product_count" INTEGER NOT NULL DEFAULT 0,
    "supplier_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "sku" VARCHAR(100),
    "manufacturer_part_number" VARCHAR(100),
    "barcode" VARCHAR(100),
    "hs_code" VARCHAR(20),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "short_description" VARCHAR(500),
    "brand" VARCHAR(100),
    "model" VARCHAR(100),
    "unit_price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "min_order_quantity" INTEGER NOT NULL DEFAULT 1,
    "price_unit" VARCHAR(50) NOT NULL DEFAULT 'piece',
    "bulk_pricing_tiers" JSONB,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER,
    "availability_status" VARCHAR(50) NOT NULL DEFAULT 'in_stock',
    "restocking_date" DATE,
    "specifications" JSONB,
    "dimensions" JSONB,
    "weight_kg" DECIMAL(10,3),
    "package_dimensions" JSONB,
    "package_weight_kg" DECIMAL(10,3),
    "units_per_package" INTEGER,
    "main_image_url" VARCHAR(500),
    "image_urls" JSONB,
    "video_url" VARCHAR(500),
    "document_urls" JSONB,
    "lead_time_days" INTEGER NOT NULL DEFAULT 7,
    "shipping_info" JSONB,
    "origin_country" VARCHAR(100),
    "production_capacity_monthly" INTEGER,
    "seo_title" VARCHAR(255),
    "seo_description" TEXT,
    "tags" JSONB,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "inquiry_count" INTEGER NOT NULL DEFAULT 0,
    "negotiation_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_until" TIMESTAMPTZ,
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_sessions" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "product_id" UUID,
    "created_by_user_id" UUID NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'INITIATED',
    "initiated_by" "ParticipantRole" NOT NULL,
    "closed_reason" VARCHAR(500),
    "closed_by_user_id" UUID,
    "requested_quantity" INTEGER,
    "requested_price" DECIMAL(10,2),
    "requested_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "shipping_requirements" TEXT,
    "payment_terms_request" TEXT,
    "initial_message" TEXT NOT NULL,
    "final_agreed_price" DECIMAL(10,2),
    "final_agreed_quantity" INTEGER,
    "final_shipping_terms" TEXT,
    "final_payment_terms" TEXT,
    "agreed_delivery_date" DATE,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMPTZ,
    "last_message_by" UUID,
    "shop_unread_count" INTEGER NOT NULL DEFAULT 0,
    "supplier_unread_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "closed_at" TIMESTAMPTZ,
    "first_response_at" TIMESTAMPTZ,
    "agreed_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "negotiation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "reply_to_message_id" UUID,
    "content" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "sender_role" "ParticipantRole" NOT NULL,
    "metadata" JSONB,
    "attachments" JSONB,
    "is_read_by_shop" BOOLEAN NOT NULL DEFAULT false,
    "is_read_by_supplier" BOOLEAN NOT NULL DEFAULT false,
    "read_by_shop_at" TIMESTAMPTZ,
    "read_by_supplier_at" TIMESTAMPTZ,
    "is_delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivered_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "negotiation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_participants" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ParticipantRole" NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ,
    "last_read_message_id" UUID,
    "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "negotiation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_events" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_intents" (
    "id" UUID NOT NULL,
    "intent_number" VARCHAR(50) NOT NULL,
    "shop_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "product_id" UUID,
    "negotiation_session_id" UUID,
    "status" "PurchaseIntentStatus" NOT NULL DEFAULT 'DRAFT',
    "product_name" VARCHAR(255) NOT NULL,
    "product_sku" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "agreed_unit_price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "total_amount" DECIMAL(14,2) NOT NULL,
    "shipping_terms" TEXT,
    "payment_terms" TEXT,
    "delivery_date" DATE,
    "shipping_address" JSONB,
    "billing_address" JSONB,
    "notes" TEXT,
    "cancellation_reason" TEXT,
    "cancelled_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "submitted_at" TIMESTAMPTZ,
    "agreed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "purchase_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_account_status_idx" ON "users"("account_status");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_user_id_key" ON "suppliers"("user_id");

-- CreateIndex
CREATE INDEX "suppliers_user_id_idx" ON "suppliers"("user_id");

-- CreateIndex
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");

-- CreateIndex
CREATE INDEX "suppliers_country_idx" ON "suppliers"("country");

-- CreateIndex
CREATE INDEX "suppliers_rating_average_idx" ON "suppliers"("rating_average");

-- CreateIndex
CREATE INDEX "suppliers_verified_at_idx" ON "suppliers"("verified_at");

-- CreateIndex
CREATE UNIQUE INDEX "shops_user_id_key" ON "shops"("user_id");

-- CreateIndex
CREATE INDEX "shops_user_id_idx" ON "shops"("user_id");

-- CreateIndex
CREATE INDEX "shops_country_idx" ON "shops"("country");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_level_idx" ON "categories"("level");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

-- CreateIndex
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "products_unit_price_idx" ON "products"("unit_price");

-- CreateIndex
CREATE INDEX "products_min_order_quantity_idx" ON "products"("min_order_quantity");

-- CreateIndex
CREATE INDEX "products_created_at_idx" ON "products"("created_at" DESC);

-- CreateIndex
CREATE INDEX "products_is_featured_featured_until_idx" ON "products"("is_featured", "featured_until");

-- CreateIndex
CREATE INDEX "negotiation_sessions_shop_id_idx" ON "negotiation_sessions"("shop_id");

-- CreateIndex
CREATE INDEX "negotiation_sessions_supplier_id_idx" ON "negotiation_sessions"("supplier_id");

-- CreateIndex
CREATE INDEX "negotiation_sessions_product_id_idx" ON "negotiation_sessions"("product_id");

-- CreateIndex
CREATE INDEX "negotiation_sessions_status_idx" ON "negotiation_sessions"("status");

-- CreateIndex
CREATE INDEX "negotiation_sessions_created_at_idx" ON "negotiation_sessions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "negotiation_sessions_expires_at_idx" ON "negotiation_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "negotiation_messages_session_id_created_at_idx" ON "negotiation_messages"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "negotiation_messages_sender_user_id_idx" ON "negotiation_messages"("sender_user_id");

-- CreateIndex
CREATE INDEX "negotiation_participants_session_id_idx" ON "negotiation_participants"("session_id");

-- CreateIndex
CREATE INDEX "negotiation_participants_user_id_idx" ON "negotiation_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "negotiation_participants_session_id_user_id_key" ON "negotiation_participants"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "negotiation_events_session_id_created_at_idx" ON "negotiation_events"("session_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_intents_intent_number_key" ON "purchase_intents"("intent_number");

-- CreateIndex
CREATE INDEX "purchase_intents_shop_id_idx" ON "purchase_intents"("shop_id");

-- CreateIndex
CREATE INDEX "purchase_intents_supplier_id_idx" ON "purchase_intents"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_intents_status_idx" ON "purchase_intents"("status");

-- CreateIndex
CREATE INDEX "purchase_intents_created_at_idx" ON "purchase_intents"("created_at" DESC);

-- CreateIndex
CREATE INDEX "purchase_intents_expires_at_idx" ON "purchase_intents"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_verified_by_admin_id_fkey" FOREIGN KEY ("verified_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_closed_by_user_id_fkey" FOREIGN KEY ("closed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_last_message_by_fkey" FOREIGN KEY ("last_message_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_messages" ADD CONSTRAINT "negotiation_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "negotiation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_messages" ADD CONSTRAINT "negotiation_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_messages" ADD CONSTRAINT "negotiation_messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "negotiation_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_participants" ADD CONSTRAINT "negotiation_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "negotiation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_participants" ADD CONSTRAINT "negotiation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_participants" ADD CONSTRAINT "negotiation_participants_last_read_message_id_fkey" FOREIGN KEY ("last_read_message_id") REFERENCES "negotiation_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_events" ADD CONSTRAINT "negotiation_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "negotiation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_events" ADD CONSTRAINT "negotiation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_intents" ADD CONSTRAINT "purchase_intents_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_intents" ADD CONSTRAINT "purchase_intents_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_intents" ADD CONSTRAINT "purchase_intents_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_intents" ADD CONSTRAINT "purchase_intents_negotiation_session_id_fkey" FOREIGN KEY ("negotiation_session_id") REFERENCES "negotiation_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
