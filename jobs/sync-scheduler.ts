import { randomUUID } from 'crypto';
import { client } from '@/trigger';
import { invokeTrigger } from '@trigger.dev/sdk';
import { Events } from './events';

client.defineJob({
  id: 'research-sync-scheduler',
  name: 'Research Sync Scheduler',
  version: '0.0.1',
  trigger: invokeTrigger(),
  //trigger: cronTrigger({
  // cron: '0 6 * * 1', // At minute 0 past every 6th hour
  //  cron: '0 */6 * * *', // At minute 0 past every 6th hour
  //}),
  run: async (payload, io, ctx) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    const jobId = randomUUID();
    await io.sendEvent(`${Events.research_sync}-${jobId}`, {
      name: Events.research_sync,
      context: {
        jobId,
      },
      payload: {
        startDate: startDate.toISOString().split('T')[0],
      },
    });

    return { payload, ctx };
  },
});
