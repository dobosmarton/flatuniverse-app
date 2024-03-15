import { randomUUID } from 'crypto';
import { client } from '@/trigger';
import { cronTrigger } from '@trigger.dev/sdk';
import { Events } from './events';

const startDate = '2024-03-12';
const untilDate = '2024-03-15';

client.defineJob({
  id: 'research-sync-scheduler',
  name: 'Research Sync Scheduler',
  version: '0.0.1',
  trigger: cronTrigger({
    cron: '0 4 * * *', //every day at 4:00
  }),
  run: async (payload, io, ctx) => {
    const jobId = randomUUID();
    await io.sendEvent(`${Events.research_sync}-${jobId}`, {
      name: Events.research_sync,
      context: {
        jobId,
      },
      payload: {
        startDate,
        untilDate,
      },
    });

    return { payload, ctx };
  },
});
