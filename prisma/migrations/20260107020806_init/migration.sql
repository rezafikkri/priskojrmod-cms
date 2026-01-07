-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('owner', 'staff');

-- CreateEnum
CREATE TYPE "currency_code" AS ENUM ('IDR', 'USD');

-- CreateEnum
CREATE TYPE "price_type" AS ENUM ('paid', 'free');

-- CreateEnum
CREATE TYPE "language" AS ENUM ('id', 'en');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('pending', 'paid', 'cancelled', 'refund');

-- CreateEnum
CREATE TYPE "share_method" AS ENUM ('download_link', 'drive_share', 'manual_required');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('active', 'void');

-- CreateTable
CREATE TABLE "admins" (
    "id" SMALLSERIAL NOT NULL,
    "role" "admin_role" NOT NULL,
    "auth_id" VARCHAR(255),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "whatsapp_phone_number" VARCHAR(20) NOT NULL,
    "picture" VARCHAR(255) NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_links" (
    "id" SERIAL NOT NULL,
    "admin_id" SMALLINT NOT NULL,
    "currency_code" "currency_code" NOT NULL,
    "url" VARCHAR(100) NOT NULL,

    CONSTRAINT "donation_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "sm_profile_url" VARCHAR(255) NOT NULL,
    "picture" VARCHAR(255) NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" SERIAL NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_translations" (
    "id" SERIAL NOT NULL,
    "license_id" INTEGER NOT NULL,
    "language" "language" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "license_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "category_id" INTEGER NOT NULL,
    "admin_id" SMALLINT NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "license_id" INTEGER NOT NULL,
    "drive_file_id" TEXT,
    "download_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "price_type" "price_type" NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_translations" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "language" "language" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "product_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_versions" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "released_at" INTEGER NOT NULL,

    CONSTRAINT "product_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_version_translations" (
    "id" UUID NOT NULL,
    "product_version_id" UUID NOT NULL,
    "language" "language" NOT NULL,
    "changelog" TEXT,

    CONSTRAINT "product_version_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_discount" (
    "id" SMALLSERIAL NOT NULL,
    "product_id" UUID NOT NULL,
    "discount" SMALLINT NOT NULL,
    "expired_at" INTEGER NOT NULL,

    CONSTRAINT "product_discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_coupon" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "code" VARCHAR(150) NOT NULL,
    "discount" SMALLINT NOT NULL,
    "expired_at" INTEGER NOT NULL,

    CONSTRAINT "product_coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "is_thumbnail" BOOLEAN NOT NULL,
    "width" SMALLINT NOT NULL,
    "height" SMALLINT NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "download_url" TEXT,
    "file_access_password" VARCHAR(100),

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "currency_code" "currency_code" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_of_service" (
    "id" SMALLSERIAL NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "terms_of_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_of_service_translations" (
    "id" SMALLSERIAL NOT NULL,
    "terms_of_service_id" SMALLINT NOT NULL,
    "language" "language" NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "terms_of_service_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_policy" (
    "id" SMALLSERIAL NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "privacy_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_policy_translations" (
    "id" SMALLSERIAL NOT NULL,
    "privacy_policy_id" SMALLINT NOT NULL,
    "language" "language" NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "privacy_policy_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_us" (
    "id" SMALLSERIAL NOT NULL,
    "support_email" VARCHAR(254) NOT NULL,
    "support_whatsapp" VARCHAR(20) NOT NULL,

    CONSTRAINT "about_us_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_us_translations" (
    "id" SMALLSERIAL NOT NULL,
    "about_us_id" SMALLINT NOT NULL,
    "language" "language" NOT NULL,
    "content" TEXT NOT NULL,
    "office_hours" VARCHAR(255) NOT NULL,

    CONSTRAINT "about_us_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" SERIAL NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_translations" (
    "id" SERIAL NOT NULL,
    "faq_id" INTEGER NOT NULL,
    "language" "language" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "faq_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "oauth_id" VARCHAR(255),
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone_number" VARCHAR(20),
    "picture" VARCHAR(255),
    "last_active" INTEGER,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "customer_id" UUID,
    "admin_id" VARCHAR(255) NOT NULL,
    "admin_email" VARCHAR(254) NOT NULL,
    "status" "transaction_status" NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,
    "currency_code" "currency_code" NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "customer_email" VARCHAR(254) NOT NULL,
    "customer_phone_number" VARCHAR(20),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "invoice_number" VARCHAR(32) NOT NULL,
    "status" "invoice_status" NOT NULL,
    "issued_at" INTEGER NOT NULL,
    "voided_at" INTEGER,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_details" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_price_id" UUID,
    "product_coupon_id" UUID,
    "quantity" SMALLINT NOT NULL,
    "product_name" VARCHAR(150) NOT NULL,
    "product_version" VARCHAR(50) NOT NULL,
    "product_drive_file_id" TEXT,
    "product_download_url" TEXT,
    "product_variant" VARCHAR(100) NOT NULL,
    "variant_download_url" TEXT,
    "variant_file_access_password" VARCHAR(100),
    "product_currency_code" "currency_code" NOT NULL,
    "product_price" DECIMAL(10,2) NOT NULL,
    "product_discount" SMALLINT,
    "product_coupon_code" VARCHAR(150),
    "product_coupon_discount" SMALLINT,
    "drive_permission_id" VARCHAR(100),
    "share_method" "share_method",
    "shared_at" INTEGER,

    CONSTRAINT "transaction_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "name" VARCHAR(100),
    "email" VARCHAR(254),
    "message" TEXT NOT NULL,
    "created_at" INTEGER NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" SMALLSERIAL NOT NULL,
    "picture" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sm_profile_url" VARCHAR(100) NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonial_translations" (
    "id" SMALLSERIAL NOT NULL,
    "testimonial_id" SMALLINT NOT NULL,
    "language" "language" NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "testimonial_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_key_licenses" (
    "id" SERIAL NOT NULL,
    "product_id" UUID,
    "key" VARCHAR(100) NOT NULL,
    "created_at" INTEGER NOT NULL,
    "regenerated_at" INTEGER,

    CONSTRAINT "secret_key_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_keys" (
    "id" UUID NOT NULL,
    "secret_key_id" INTEGER NOT NULL,
    "customer_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "can_regenerate" BOOLEAN NOT NULL DEFAULT false,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,
    "regenerated_at" INTEGER,
    "device_id" VARCHAR(100),
    "last_reset_period" VARCHAR(10),
    "reset_count" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "license_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_auth_id_key" ON "admins"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_versions_product_id_version_key" ON "product_versions"("product_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "product_discount_product_id_key" ON "product_discount"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_coupon_product_id_key" ON "product_coupon"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_oauth_id_key" ON "customers"("oauth_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_code_key" ON "transactions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_created_at_key" ON "feedbacks"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "secret_key_licenses_product_id_key" ON "secret_key_licenses"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "license_keys_customer_id_secret_key_id_key" ON "license_keys"("customer_id", "secret_key_id");

-- AddForeignKey
ALTER TABLE "donation_links" ADD CONSTRAINT "donation_links_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_translations" ADD CONSTRAINT "license_translations_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_versions" ADD CONSTRAINT "product_versions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_version_translations" ADD CONSTRAINT "product_version_translations_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "product_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_discount" ADD CONSTRAINT "product_discount_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_coupon" ADD CONSTRAINT "product_coupon_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_of_service_translations" ADD CONSTRAINT "terms_of_service_translations_terms_of_service_id_fkey" FOREIGN KEY ("terms_of_service_id") REFERENCES "terms_of_service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_policy_translations" ADD CONSTRAINT "privacy_policy_translations_privacy_policy_id_fkey" FOREIGN KEY ("privacy_policy_id") REFERENCES "privacy_policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_us_translations" ADD CONSTRAINT "about_us_translations_about_us_id_fkey" FOREIGN KEY ("about_us_id") REFERENCES "about_us"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_translations" ADD CONSTRAINT "faq_translations_faq_id_fkey" FOREIGN KEY ("faq_id") REFERENCES "faqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_product_price_id_fkey" FOREIGN KEY ("product_price_id") REFERENCES "product_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonial_translations" ADD CONSTRAINT "testimonial_translations_testimonial_id_fkey" FOREIGN KEY ("testimonial_id") REFERENCES "testimonials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_key_licenses" ADD CONSTRAINT "secret_key_licenses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_secret_key_id_fkey" FOREIGN KEY ("secret_key_id") REFERENCES "secret_key_licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
