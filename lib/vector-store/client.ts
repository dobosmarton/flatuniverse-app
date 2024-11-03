import { Pinecone } from '@pinecone-database/pinecone';

export const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY ?? '',
});

export const researchArticleIndex = pineconeClient.index(process.env.PINECONE_INDEX_NAME ?? '');
