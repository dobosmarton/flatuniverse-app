import { EventSpecification, Trigger, invokeTrigger } from '@trigger.dev/sdk';
import { client } from '@/trigger';

import { generateMetadataEmbeddingPayloadSchema, GenerateMetadataEmbeddingPayload } from '../event-schema';
import * as tasks from './tasks';

export const generateEmbedding = client.defineJob<Trigger<EventSpecification<GenerateMetadataEmbeddingPayload>>>({
  id: 'generate-metadata-embedding',
  name: 'Generate metadata embedding',
  version: '0.0.1',
  // the given zod schema throws "Type instantiation is excessively deep and possibly infinite." error,
  // so will will parse the payload in the run function
  trigger: invokeTrigger(),
  onFailure: async () => {},
  run: async (payload, io, ctx) => {
    const parsedPayload = generateMetadataEmbeddingPayloadSchema.parse(payload);
    const pdfJson = await tasks.loadPdf(`generate-embedding-${payload.itemId}`, io, parsedPayload.itemId);

    if (!pdfJson) {
      throw new Error(`PDF not found for metadata id: ${parsedPayload.itemId}`);
    }

    await tasks.generateEmbedding(
      `generate-embedding-${ctx.event.context.jobId}-${parsedPayload.itemId}`,
      io,
      parsedPayload.itemId,
      pdfJson
    );

    return { payload, ctx };
  },
});
