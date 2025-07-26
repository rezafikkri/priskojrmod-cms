/*
  Warnings:

  - You are about to drop the column `message` on the `testimonials` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "testimonials" DROP COLUMN "message";

-- CreateTable
CREATE TABLE "testimonial_translations" (
    "id" SMALLSERIAL NOT NULL,
    "testimonial_id" SMALLINT NOT NULL,
    "language" "language" NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "testimonial_translations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "testimonial_translations" ADD CONSTRAINT "testimonial_translations_testimonial_id_fkey" FOREIGN KEY ("testimonial_id") REFERENCES "testimonials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
