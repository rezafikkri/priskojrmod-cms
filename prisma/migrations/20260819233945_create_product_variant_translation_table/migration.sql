-- CreateTable
CREATE TABLE "product_variant_translations" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "language" "language" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "product_variant_translations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "product_variant_translations" ADD CONSTRAINT "product_variant_translations_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
