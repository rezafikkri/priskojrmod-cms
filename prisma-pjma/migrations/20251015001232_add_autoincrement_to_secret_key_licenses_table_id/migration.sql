-- AlterTable
CREATE SEQUENCE secret_key_licenses_id_seq;
ALTER TABLE "secret_key_licenses" ALTER COLUMN "id" SET DEFAULT nextval('secret_key_licenses_id_seq');
ALTER SEQUENCE secret_key_licenses_id_seq OWNED BY "secret_key_licenses"."id";
