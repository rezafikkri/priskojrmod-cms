/*
  Warnings:

  - You are about to drop the column `content` on the `licenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "licenses" DROP COLUMN "content";

-- CreateTable
CREATE TABLE "license_translations" (
    "id" SERIAL NOT NULL,
    "license_id" INTEGER NOT NULL,
    "language" "language" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "license_translations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "license_translations" ADD CONSTRAINT "license_translations_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
