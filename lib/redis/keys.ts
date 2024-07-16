export const keys = {
  metadataSimilarIds: (metadataId: string) => `metadata:${metadataId}:similar-ids`,
  // @deprecated - Use metadataPineconeEmbeddingItems instead
  // Used for storing the embeddings of the metadata items in Postgres
  metadataEmbeddingItems: (metadataId: string) => `metadata:${metadataId}:embedding-items`,
  metadataPineconeEmbeddingItems: (metadataId: string) => `metadata:${metadataId}:pinecone-embedding-items`,
  hasEmbeddingsForArticle: (metadataId: string) => `metadata:${metadataId}:has-embeddings`,
  generateEmbeddingForItem: (metadataId: string) => `metadata:${metadataId}:generate-embedding`,
  authorsByArticles: (page: number, pageSize: number, search?: string) =>
    `authors:by-articles:${page}:${pageSize}${search?.length ? `:${search}` : ''}`,
};
