import { z } from 'zod';

const jsonSchema = z.lazy(() => z.array(z.number()));

const json = () => jsonSchema;

export const embeddingDataSchema = z.array(
  z.object({
    id: z.string(),
    metadata_id: z.string(),
    embedding: z.string().transform((str, ctx): z.infer<ReturnType<typeof json>> => {
      try {
        const parsed = JSON.parse(str);
        return jsonSchema.parse(parsed);
      } catch (e) {
        ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
        return z.NEVER;
      }
    }),
  })
);

export type EmbeddingData = z.infer<typeof embeddingDataSchema>;
