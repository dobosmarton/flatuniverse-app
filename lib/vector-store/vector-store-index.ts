import { serviceContextFromDefaults, VectorStoreIndex } from 'llamaindex';
import { PineconeVectorStore } from 'llamaindex/vector-store/PineconeVectorStore';

export const getIndexFromStore = async (): Promise<VectorStoreIndex> => {
  const vectorStore = new PineconeVectorStore();

  const serviceContext = serviceContextFromDefaults({
    chunkSize: parseInt(process.env.PINECONE_CHUNK_SIZE ?? '1000'),
    chunkOverlap: parseInt(process.env.PINECONE_CHUNK_OVERLAP ?? '200'),
  });

  const vectorStoreIndex = await VectorStoreIndex.fromVectorStore(vectorStore, serviceContext);

  return vectorStoreIndex;
};
