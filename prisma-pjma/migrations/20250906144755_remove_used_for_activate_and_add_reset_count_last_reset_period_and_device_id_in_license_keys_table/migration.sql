/*
  Warnings:

  - You are about to drop the column `used_for_activate` on the `license_keys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "license_keys" DROP COLUMN "used_for_activate",
ADD COLUMN     "device_id" VARCHAR(100),
ADD COLUMN     "last_reset_period" VARCHAR(10),
ADD COLUMN     "reset_count" SMALLINT NOT NULL DEFAULT 0;
