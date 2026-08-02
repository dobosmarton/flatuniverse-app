import 'dotenv/config';

import { pineconeClient } from '../client';

export const createResearchArticleIndex = async () => {
  await pineconeClient.createIndex({
    name: 'research-article-us',
    dimension: 1536,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
      },
    },
  });
};

createResearchArticleIndex();
