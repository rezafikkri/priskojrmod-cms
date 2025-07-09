/*
  Warnings:

  - The primary key for the `customers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `password` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[oauth_id]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `id` on the `customers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "customers" DROP CONSTRAINT "customers_pkey",
DROP COLUMN "password",
ADD COLUMN     "is_banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oauth_id" VARCHAR(255),
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "last_active" DROP NOT NULL,
ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_oauth_id_key" ON "customers"("oauth_id");
