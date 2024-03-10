/*
  Warnings:

  - You are about to drop the column `summary` on the `article_metadata` table. All the data in the column will be lost.
  - Made the column `abstract` on table `article_metadata` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "article_metadata" DROP COLUMN "summary",
ALTER COLUMN "abstract" SET NOT NULL;
