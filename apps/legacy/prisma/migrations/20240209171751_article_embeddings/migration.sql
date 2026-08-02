/*
  Warnings:

  - You are about to drop the `research_article` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "research_article" DROP CONSTRAINT "research_article_metadata_id_fkey";

-- DropTable
DROP TABLE "research_article";

-- CreateTable
CREATE TABLE "research_article_embedding" (
    "id" TEXT NOT NULL,
    "embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata_id" TEXT NOT NULL,

    CONSTRAINT "research_article_embedding_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "research_article_embedding" ADD CONSTRAINT "research_article_embedding_metadata_id_fkey" FOREIGN KEY ("metadata_id") REFERENCES "article_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
