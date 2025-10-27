/*
  Warnings:

  - You are about to alter the column `secret_key_id` on the `license_keys` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `license_keys` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `updated_at` on the `license_keys` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `regenerated_at` on the `license_keys` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `secret_key_licenses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `secret_key_licenses` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `created_at` on the `secret_key_licenses` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `regenerated_at` on the `secret_key_licenses` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "public"."license_keys" DROP CONSTRAINT "license_keys_secret_key_id_fkey";

-- AlterTable
ALTER TABLE "license_keys" ALTER COLUMN "secret_key_id" SET DATA TYPE INTEGER,
ALTER COLUMN "created_at" SET DATA TYPE INTEGER,
ALTER COLUMN "updated_at" SET DATA TYPE INTEGER,
ALTER COLUMN "regenerated_at" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "secret_key_licenses" DROP CONSTRAINT "secret_key_licenses_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "created_at" SET DATA TYPE INTEGER,
ALTER COLUMN "regenerated_at" SET DATA TYPE INTEGER,
ADD CONSTRAINT "secret_key_licenses_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "secret_key_licenses_id_seq";

-- AddForeignKey
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_secret_key_id_fkey" FOREIGN KEY ("secret_key_id") REFERENCES "secret_key_licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
