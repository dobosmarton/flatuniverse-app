import { metadataSchema } from '@/lib/oai-pmh/schema';
import { z } from 'zod';

export enum Events {
  research_sync = 'research_sync',
  research_sync_retry = 'research_sync_retry',
  add_article_metadata_batch = 'add_article_metadata_batch',
}

export const researchSyncPayloadSchema = z.object({
  startDate: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  untilDate: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
    .optional(),
  resumptionToken: z.string().optional(),
});

export const researchSyncRetryPayloadSchema = researchSyncPayloadSchema.extend({
  retryAfter: z.string().optional(),
  retryCount: z.number(),
});

const authorSchema = z.object({
  name: z.string(),
});

const linkSchema = z
  .object({
    href: z.string(),
    rel: z.string(),
    type: z.string(),
    title: z.string(),
  })
  .transform((link) => ({
    ...link,
    type: link.type,
    title: link.title,
  }));

const categorySchema = z.object({
  isPrimary: z.boolean(),
  shortName: z.string(),
  fullName: z.string(),
  groupName: z.string(),
});

const metadataBatchSchema = z
  .object({
    id: z.string(),
    doi: z.string().optional(),
    title: z.string(),
    comment: z.string().optional(),
    abstract: z.string(),
    created: z.string(),
    updated: z.string(),
    published: z.string(),
    links: z.array(linkSchema),
    authors: z.array(authorSchema),
    categories: z.array(categorySchema),
  })
  .transform((metadata) => ({
    ...metadata,
    comment: metadata.comment,
    updated: new Date(metadata.updated),
    published: new Date(metadata.published),
  }));

export const addArticleMetadaBatchPayloadSchema = z.object({
  batchIndex: z.number(),
  batch: z.array(metadataBatchSchema),
});

export type MetadataBatch = z.infer<typeof metadataBatchSchema>;
