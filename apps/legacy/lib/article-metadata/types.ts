import { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';

export type GetSimilarByEmbeddingParams = {
  metadataId: string;
  embedding: PineconeRecord<RecordMetadata>[];
};

export type GetSimilarIdsByEmbeddingVectorParams = {
  metadataId: string;
  embeddingVectorList: number[][];
};
