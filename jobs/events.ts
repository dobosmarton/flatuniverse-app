import { z } from 'zod';

export enum Events {
  research_sync = 'research_sync',
  research_sync_retry = 'research_sync_retry',
  add_article_metadata_batch = 'add_article_metadata_batch',
  generate_embeddings = 'generate_embeddings',
  generate_ai_content = 'generate_ai_content',
}
