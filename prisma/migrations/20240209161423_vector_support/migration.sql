-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "research_article" (
    "id" TEXT NOT NULL,
    "embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata_id" TEXT NOT NULL,

    CONSTRAINT "research_article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "research_article_metadata_id_key" ON "research_article"("metadata_id");

-- AddForeignKey
ALTER TABLE "research_article" ADD CONSTRAINT "research_article_metadata_id_fkey" FOREIGN KEY ("metadata_id") REFERENCES "article_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
