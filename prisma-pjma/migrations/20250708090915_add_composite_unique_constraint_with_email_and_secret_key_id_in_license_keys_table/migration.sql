/*
  Warnings:

  - A unique constraint covering the columns `[email,secret_key_id]` on the table `license_keys` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "license_keys_email_secret_key_id_key" ON "license_keys"("email", "secret_key_id");
