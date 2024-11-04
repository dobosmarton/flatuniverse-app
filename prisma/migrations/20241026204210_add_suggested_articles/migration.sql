-- CreateTable
CREATE TABLE "chat_thread_to_article_metadata" (
    "id" TEXT NOT NULL,
    "chat_thread_id" TEXT NOT NULL,
    "article_metadata_id" TEXT NOT NULL,

    CONSTRAINT "chat_thread_to_article_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_thread_to_article_metadata_chat_thread_id_article_meta_idx" ON "chat_thread_to_article_metadata"("chat_thread_id", "article_metadata_id");

-- AddForeignKey
ALTER TABLE "chat_thread_to_article_metadata" ADD CONSTRAINT "chat_thread_to_article_metadata_chat_thread_id_fkey" FOREIGN KEY ("chat_thread_id") REFERENCES "chat_thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_to_article_metadata" ADD CONSTRAINT "chat_thread_to_article_metadata_article_metadata_id_fkey" FOREIGN KEY ("article_metadata_id") REFERENCES "article_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
