/*
  Warnings:

  - Changed the type of `admin_id` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "admin_id",
ADD COLUMN     "admin_id" SMALLINT NOT NULL;
