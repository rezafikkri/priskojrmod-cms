/*
  Warnings:

  - You are about to drop the column `is_published` on the `products` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('published', 'unpublished', 'inactive');

-- AlterTable
ALTER TABLE "products" DROP COLUMN "is_published",
ADD COLUMN     "status" "product_status" NOT NULL DEFAULT 'unpublished';
