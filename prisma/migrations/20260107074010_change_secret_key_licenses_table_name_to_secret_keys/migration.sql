/*
  Warnings:

  - You are about to drop the `secret_key_licenses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "license_keys" DROP CONSTRAINT "license_keys_secret_key_id_fkey";

-- DropForeignKey
ALTER TABLE "secret_key_licenses" DROP CONSTRAINT "secret_key_licenses_product_id_fkey";

-- DropTable
DROP TABLE "secret_key_licenses";

-- CreateTable
CREATE TABLE "secret_keys" (
    "id" SERIAL NOT NULL,
    "product_id" UUID,
    "key" VARCHAR(100) NOT NULL,
    "created_at" INTEGER NOT NULL,
    "regenerated_at" INTEGER,

    CONSTRAINT "secret_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "secret_keys_product_id_key" ON "secret_keys"("product_id");

-- AddForeignKey
ALTER TABLE "secret_keys" ADD CONSTRAINT "secret_keys_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_secret_key_id_fkey" FOREIGN KEY ("secret_key_id") REFERENCES "secret_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
