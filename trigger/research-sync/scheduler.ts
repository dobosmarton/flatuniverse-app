import { randomUUID } from 'crypto';
import { schedules } from '@trigger.dev/sdk/v3';

import { syncMetadata } from './sync-metadata';

/**
 * Schedule configuration for the research sync task.
 * This schedule runs every 8 hours to fetch and sync new research metadata.
 *
 * @remarks
 * - Uses cron expression to run at minute 0 past every 6th hour
 *
 * The schedule triggers the researchSync task which:
 * 1. Gets yesterday's date as the start date
 * 2. Triggers the syncMetadata task to fetch and process research metadata
 */
export const researchSync = schedules.task({
  id: 'research-sync-scheduler',
  cron: '0 */6 * * *', // At minute 0 past every 6th hour
  run: async (payload) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    await syncMetadata.trigger({
      jobId: payload.externalId ?? randomUUID(),
      startDate: startDate.toISOString().split('T')[0],
    });

    return {
      payload,
    };
  },
});
