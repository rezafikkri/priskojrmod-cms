-- AlterTable
ALTER TABLE "license_keys" ADD COLUMN     "is_revoked" BOOLEAN NOT NULL DEFAULT false;
