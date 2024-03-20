import { EmbeddingData } from './schema';

export type GetSimilarByEmbeddingParams = {
  metadataId: string;
  embedding: EmbeddingData;
};

export type GetSimilarIdsByEmbeddingVectorParams = {
  metadataId: string;
  embeddingVectorList: number[][];
};
