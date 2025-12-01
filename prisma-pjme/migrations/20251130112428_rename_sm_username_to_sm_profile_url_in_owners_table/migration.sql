/*
  Warnings:

  - You are about to drop the column `sm_username` on the `owners` table. All the data in the column will be lost.
  - Added the required column `sm_profile_link` to the `owners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "owners" DROP COLUMN "sm_username",
ADD COLUMN     "sm_profile_url" VARCHAR(255) NOT NULL;
