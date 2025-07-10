-- AlterTable
ALTER TABLE "license_keys" ADD COLUMN     "can_regenerate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regenerated_at" BIGINT;
