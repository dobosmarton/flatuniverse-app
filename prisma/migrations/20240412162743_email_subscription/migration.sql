-- CreateEnum
CREATE TYPE "email_list" AS ENUM ('WEEKLY_SUMMARY');

-- CreateTable
CREATE TABLE "email_subscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_list" "email_list" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_subscription_email_email_list_idx" ON "email_subscription"("email", "email_list");

-- CreateIndex
CREATE UNIQUE INDEX "email_subscription_email_email_list_key" ON "email_subscription"("email", "email_list");
