import { client } from '@/trigger';
import { cronTrigger } from '@trigger.dev/sdk';
import * as newsletterService from '@/lib/newsletter';

client.defineJob({
  id: 'weekly-email-newsletter',
  name: 'Weekly Email Newsletter Job',
  version: '0.0.1',
  trigger: cronTrigger({
    // Every Saturday at 8:00 AM
    cron: '0 8 * * 6',
  }),
  enabled: false,
  run: async (payload, io, ctx) => {
    await io.runTask(`send-weekly-newsletter`, async () => {
      await newsletterService.sendWeeklySummaryEmail();
    });

    return { payload, ctx };
  },
});
