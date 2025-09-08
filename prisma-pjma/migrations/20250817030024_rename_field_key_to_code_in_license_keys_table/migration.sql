/*
  Warnings:

  - You are about to drop the column `key` on the `license_keys` table. All the data in the column will be lost.
  - You are about to drop the column `used_for_download` on the `license_keys` table. All the data in the column will be lost.
  - Added the required column `code` to the `license_keys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "license_keys" DROP COLUMN "key",
DROP COLUMN "used_for_download",
ADD COLUMN     "code" TEXT NOT NULL;
