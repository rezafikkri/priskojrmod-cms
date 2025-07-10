/*
  Warnings:

  - You are about to drop the column `changelog` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `products` table. All the data in the column will be lost.
  - Added the required column `created_at` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "changelog",
DROP COLUMN "description",
ADD COLUMN     "created_at" BIGINT NOT NULL,
ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "product_translations" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "language" "language" NOT NULL,
    "description" TEXT NOT NULL,
    "changelog" TEXT,

    CONSTRAINT "product_translations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
