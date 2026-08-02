/*
  Warnings:

  - You are about to drop the `research_article_embedding` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "research_article_embedding" DROP CONSTRAINT "research_article_embedding_metadata_id_fkey";

-- DropTable
DROP TABLE "research_article_embedding";
