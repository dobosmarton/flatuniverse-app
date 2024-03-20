export const keys = {
  metadataSimilarItems: (metadataId: string) => `metadata:${metadataId}:similar-items`,
  metadataEmbeddingItems: (metadataId: string) => `metadata:${metadataId}:embedding-items`,
  generateEmbeddingForItem: (metadataId: string) => `metadata:${metadataId}:generate-embedding`,
};
