-- CreateTable
CREATE TABLE "author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "href" TEXT NOT NULL,
    "rel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_metadata" (
    "id" TEXT NOT NULL,
    "updated" TIMESTAMP(3) NOT NULL,
    "published" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_metadata_to_author" (
    "id" TEXT NOT NULL,
    "article_metadata_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_metadata_to_author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_metadata_to_category" (
    "id" TEXT NOT NULL,
    "article_metadata_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_metadata_to_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_metadata_to_link" (
    "id" TEXT NOT NULL,
    "article_metadata_id" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_metadata_to_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "author_name_key" ON "author"("name");

-- CreateIndex
CREATE UNIQUE INDEX "link_href_key" ON "link"("href");

-- CreateIndex
CREATE UNIQUE INDEX "category_short_name_key" ON "category"("short_name");

-- AddForeignKey
ALTER TABLE "article_metadata_to_author" ADD CONSTRAINT "article_metadata_to_author_article_metadata_id_fkey" FOREIGN KEY ("article_metadata_id") REFERENCES "article_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_metadata_to_author" ADD CONSTRAINT "article_metadata_to_author_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_metadata_to_category" ADD CONSTRAINT "article_metadata_to_category_article_metadata_id_fkey" FOREIGN KEY ("article_metadata_id") REFERENCES "article_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_metadata_to_category" ADD CONSTRAINT "article_metadata_to_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_metadata_to_link" ADD CONSTRAINT "article_metadata_to_link_article_metadata_id_fkey" FOREIGN KEY ("article_metadata_id") REFERENCES "article_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_metadata_to_link" ADD CONSTRAINT "article_metadata_to_link_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "link"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
