/*
  Warnings:

  - A unique constraint covering the columns `[created_at]` on the table `feedbacks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_created_at_key" ON "feedbacks"("created_at");
