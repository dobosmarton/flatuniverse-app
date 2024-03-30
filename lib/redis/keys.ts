export const keys = {
  metadataSimilarIds: (metadataId: string) => `metadata:${metadataId}:similar-ids`,
  metadataEmbeddingItems: (metadataId: string) => `metadata:${metadataId}:embedding-items`,
  generateEmbeddingForItem: (metadataId: string) => `metadata:${metadataId}:generate-embedding`,
  authorsByArticles: (page: number, pageSize: number, search?: string) =>
    `authors:by-articles:${page}:${pageSize}${search?.length ? `:${search}` : ''}`,
};
