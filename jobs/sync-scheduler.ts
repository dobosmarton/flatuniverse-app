import { randomUUID } from 'crypto';
import { client } from '@/trigger';
import { cronTrigger } from '@trigger.dev/sdk';
import { Events } from './events';

client.defineJob({
  id: 'research-sync-scheduler',
  name: 'Research Sync Scheduler',
  version: '0.0.1',
  trigger: cronTrigger({
    cron: '0 */3 * * *', // At minute 0 past every 3rd hour
  }),
  run: async (payload, io, ctx) => {
    const startDate = new Date().toISOString().split('T')[0];

    const jobId = randomUUID();
    await io.sendEvent(`${Events.research_sync}-${jobId}`, {
      name: Events.research_sync,
      context: {
        jobId,
      },
      payload: {
        startDate,
      },
    });

    return { payload, ctx };
  },
});
