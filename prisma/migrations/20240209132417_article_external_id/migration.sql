/*
  Warnings:

  - A unique constraint covering the columns `[external_id]` on the table `article_metadata` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `external_id` to the `article_metadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "article_metadata" ADD COLUMN     "external_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "article_metadata_external_id_key" ON "article_metadata"("external_id");
