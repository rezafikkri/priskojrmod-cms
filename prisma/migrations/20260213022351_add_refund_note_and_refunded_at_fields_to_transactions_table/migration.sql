-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "refund_note" TEXT,
ADD COLUMN     "refunded_at" INTEGER;
