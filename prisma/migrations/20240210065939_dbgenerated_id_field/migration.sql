/*
  Warnings:

  - The primary key for the `research_article_embedding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `research_article_embedding` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "research_article_embedding" DROP CONSTRAINT "research_article_embedding_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "research_article_embedding_pkey" PRIMARY KEY ("id");
