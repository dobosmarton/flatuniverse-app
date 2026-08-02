/*
  Warnings:

  - You are about to drop the column `content` on the `research_article_embedding` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "research_article_embedding" DROP COLUMN "content",
ADD COLUMN     "doucment_metadata" JSONB NOT NULL DEFAULT '{}';
