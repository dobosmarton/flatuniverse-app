export const keys = {
  metadataSimilarIds: (metadataId: string) => `metadata:${metadataId}:similar-ids`,
  metadataPineconeEmbeddingItems: (metadataId: string) => `metadata:${metadataId}:pinecone-embedding-items`,
  hasEmbeddingsForArticle: (metadataId: string) => `metadata:${metadataId}:has-embeddings`,
  generateEmbeddingForItem: (metadataId: string) => `metadata:${metadataId}:generate-embedding`,
  authorsByArticles: (page: number, pageSize: number, search?: string) =>
    `authors:by-articles:${page}:${pageSize}${search?.length ? `:${search}` : ''}`,
  analyzeTemporalQuery: (promptHash: string) => `analyze-temporal-query:${promptHash}`,
  findLatestMetadataByExternalIds: (ids: string[]) => `metadata:find-latest-by-external-ids:${ids.join(':')}`,
  getArticleMetadataBySlug: (slug: string) => `metadata:get-by-slug:${slug}`,
  getArticleWithPdfLink: (id: string) => `metadata:get-with-pdf-link:${id}`,
};
