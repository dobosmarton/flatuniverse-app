import { randomUUID } from 'crypto';
import { schedules } from '@trigger.dev/sdk/v3';

import { syncMetadata } from './sync-metadata';

export const researchSync = schedules.task({
  id: 'research-sync-scheduler',
  run: async (payload) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    const jobId = randomUUID();

    await syncMetadata.trigger({
      startDate: startDate.toISOString().split('T')[0],
    });

    return {
      payload,
    };
  },
});

export const researchSyncSchedule = schedules.create({
  task: researchSync.id,
  deduplicationKey: 'research-sync-scheduler',
  // At minute 0 past every 6th hour
  cron: '0 */8 * * *',
});
