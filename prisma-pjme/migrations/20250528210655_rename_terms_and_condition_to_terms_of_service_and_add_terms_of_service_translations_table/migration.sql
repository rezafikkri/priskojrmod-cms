/*
  Warnings:

  - You are about to drop the `terms_and_conditions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "terms_and_conditions";

-- CreateTable
CREATE TABLE "terms_of_service" (
    "id" SMALLSERIAL NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "terms_of_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_of_service_translations" (
    "id" SMALLSERIAL NOT NULL,
    "terms_of_service_id" SMALLINT NOT NULL,
    "language" "language" NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "terms_of_service_translations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "terms_of_service_translations" ADD CONSTRAINT "terms_of_service_translations_terms_of_service_id_fkey" FOREIGN KEY ("terms_of_service_id") REFERENCES "terms_of_service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
