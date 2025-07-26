-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "name" VARCHAR(100),
    "email" VARCHAR(100),
    "message" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" SMALLSERIAL NOT NULL,
    "picture" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "sm_username" VARCHAR(100) NOT NULL,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);
