import { generateAIContent } from '@/trigger/ai';
import { tasks } from '@trigger.dev/sdk/v3';
import { NextResponse } from 'next/server';
import * as logger from '@/lib/logger';

import { metadataChangeEventSchema } from './schema';

/**
 * Handles webhook events for metadata changes from Sequin.
 * This endpoint is called when article metadata is inserted or updated in the database.
 *
 * @param req - The incoming HTTP request
 * @returns NextResponse with success/error status
 *
 * Flow:
 * 1. Validate the webhook secret in Authorization header
 * 2. Parse and validate the payload using metadataChangeEventSchema
 * 3. For insert actions:
 *    - Trigger the generate-ai-content task to create embeddings and AI content
 *    - Return success response
 * 4. For other actions:
 *    - Return 304 Not Modified
 */
const handleMetadataChangeEvent = async (req: Request) => {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || authHeader !== `${process.env.SEQUIN_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = await req.json();

  const metadataChangeEvent = metadataChangeEventSchema.safeParse(payload);

  if (!metadataChangeEvent.success) {
    logger.error(`Error parsing metadata change event: ${JSON.stringify(metadataChangeEvent.error.format())}`, {
      time: new Date().toISOString(),
    });

    return NextResponse.json({ success: false, error: metadataChangeEvent.error }, { status: 400 });
  }

  if (metadataChangeEvent.data.action === 'insert') {
    const handle = await tasks.trigger<typeof generateAIContent>('generate-ai-content', {
      jobId: metadataChangeEvent.data.record.id,
      data: [
        {
          articleMetadataId: metadataChangeEvent.data.record.id,
          externalId: metadataChangeEvent.data.record.external_id,
        },
      ],
    });

    logger.log(`Triggered generate-ai-content for ${metadataChangeEvent.data.record.external_id}`, {
      jobId: handle.id,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: true, status: 304 });
};

export const POST = handleMetadataChangeEvent;
