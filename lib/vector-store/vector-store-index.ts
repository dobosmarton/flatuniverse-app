import { PromptHelper, serviceContextFromDefaults, VectorStoreIndex } from 'llamaindex';
import { PineconeVectorStore } from 'llamaindex/vector-store/PineconeVectorStore';

export const getIndexFromStore = async (): Promise<VectorStoreIndex> => {
  const vectorStore = new PineconeVectorStore({
    indexName: process.env.PINECONE_INDEX_NAME ?? '',
  });

  const serviceContext = serviceContextFromDefaults({
    chunkSize: parseInt(process.env.PINECONE_CHUNK_SIZE ?? '1024'),
    chunkOverlap: parseInt(process.env.PINECONE_CHUNK_OVERLAP ?? '256'),
    promptHelper: new PromptHelper({
      contextWindow: 8192,
    }),
  });

  const vectorStoreIndex = await VectorStoreIndex.fromVectorStore(vectorStore, serviceContext);

  return vectorStoreIndex;
};
