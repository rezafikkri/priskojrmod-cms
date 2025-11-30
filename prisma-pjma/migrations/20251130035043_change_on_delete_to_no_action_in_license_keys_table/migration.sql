-- DropForeignKey
ALTER TABLE "public"."license_keys" DROP CONSTRAINT "license_keys_secret_key_id_fkey";

-- AddForeignKey
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_secret_key_id_fkey" FOREIGN KEY ("secret_key_id") REFERENCES "secret_key_licenses"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
