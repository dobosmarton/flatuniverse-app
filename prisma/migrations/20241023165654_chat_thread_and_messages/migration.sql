-- CreateEnum
CREATE TYPE "chat_message_role" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "chat_thread" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" TEXT NOT NULL,
    "role" "chat_message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chat_thread_id" TEXT NOT NULL,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_thread_slug_key" ON "chat_thread"("slug");

-- CreateIndex
CREATE INDEX "chat_thread_slug_idx" ON "chat_thread"("slug");

-- CreateIndex
CREATE INDEX "chat_thread_created_at_idx" ON "chat_thread"("created_at");

-- CreateIndex
CREATE INDEX "chat_message_chat_thread_id_idx" ON "chat_message"("chat_thread_id");

-- CreateIndex
CREATE INDEX "chat_message_created_at_idx" ON "chat_message"("created_at");

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_chat_thread_id_fkey" FOREIGN KEY ("chat_thread_id") REFERENCES "chat_thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
