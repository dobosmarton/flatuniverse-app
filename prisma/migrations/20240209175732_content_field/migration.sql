/*
  Warnings:

  - Added the required column `content` to the `research_article_embedding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "research_article_embedding" ADD COLUMN     "content" TEXT NOT NULL;
