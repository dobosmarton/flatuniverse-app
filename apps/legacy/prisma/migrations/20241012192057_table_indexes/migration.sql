-- CreateIndex
CREATE INDEX "article_metadata_published_idx" ON "article_metadata"("published");

-- CreateIndex
CREATE INDEX "article_metadata_title_abstract_published_external_id_idx" ON "article_metadata"("title", "abstract", "published", "external_id");

-- CreateIndex
CREATE INDEX "article_metadata_to_author_article_metadata_id_author_id_idx" ON "article_metadata_to_author"("article_metadata_id", "author_id");

-- CreateIndex
CREATE INDEX "article_metadata_to_category_article_metadata_id_category_i_idx" ON "article_metadata_to_category"("article_metadata_id", "category_id");

-- CreateIndex
CREATE INDEX "article_metadata_to_link_article_metadata_id_link_id_idx" ON "article_metadata_to_link"("article_metadata_id", "link_id");

-- CreateIndex
CREATE INDEX "author_name_idx" ON "author"("name");

-- CreateIndex
CREATE INDEX "category_group_name_short_name_idx" ON "category"("group_name", "short_name");

-- CreateIndex
CREATE INDEX "link_href_idx" ON "link"("href");
