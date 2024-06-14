import { z } from 'zod';

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
    updated: z.date(),
    published: z.date(),
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
  jobId: z.string(),
  batchIndex: z.number(),
  batch: z.array(metadataBatchSchema),
});

export const metadataIdPayloadSchema = z.object({
  jobId: z.string(),
  id: z.string(),
});

export type AddArticleMetadaBatchPayload = z.input<typeof addArticleMetadaBatchPayloadSchema>;
export type MetadataIdPayload = z.input<typeof metadataIdPayloadSchema>;
