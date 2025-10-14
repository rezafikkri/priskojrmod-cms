/*
  Warnings:

  - You are about to alter the column `created_at` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `last_active` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `faqs` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `faqs` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `feedbacks` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `issued_at` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `voided_at` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `licenses` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `licenses` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `owners` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `owners` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `privacy_policy` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `privacy_policy` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `expired_at` on the `product_coupon` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `expired_at` on the `product_discount` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `released_at` on the `product_versions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `products` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `products` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `terms_of_service` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `terms_of_service` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `testimonials` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `testimonials` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `shared_at` on the `transaction_details` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "created_at" SET DATA TYPE INTEGER,
ALTER COLUMN "updated_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "last_active" SET DATA TYPE INTEGER,
ALTER COLUMN "created_at" SET DATA TYPE INTEGER,
ALTER COLUMN "updated_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "faqs" ALTER COLUMN "created_at" SET DATA TYPE INTEGER,
ALTER COLUMN "updated_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "feedbacks" ALTER COLUMN "created_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "issued_at" SET DATA TYPE INTEGER,
ALTER COLUMN "voided_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "licenses" ALTER COLUMN "updated_at" SET DATA TYPE INTEGER,
ALTER COLUMN "created_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "owners" ALTER COLUMN "created_at" SET DATA TYPE INTEGER,
ALTER COLUMN "updated_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "privacy_policy" ALTER COLUMN "updated_at" SET DATA TYPE INTEGER,
ALTER COLUMN "created_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "product_coupon" ALTER COLUMN "expired_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "product_discount" ALTER COLUMN "expired_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "product_versions" ALTER COLUMN "released_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DATA TYPE INTEGER,
ALTER COLUMN "created_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "terms_of_service" ALTER COLUMN "updated_at" SET DATA TYPE INTEGER,
ALTER COLUMN "created_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "testimonials" ALTER COLUMN "created_at" SET DATA TYPE INTEGER,
ALTER COLUMN "updated_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "transaction_details" ALTER COLUMN "shared_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "created_at" SET DATA TYPE INTEGER,
ALTER COLUMN "updated_at" SET DATA TYPE INTEGER;
