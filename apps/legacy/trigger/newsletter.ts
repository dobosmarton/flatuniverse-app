import { schedules } from '@trigger.dev/sdk/v3';
import * as newsletterService from '@/lib/newsletter';

/* export const weeklyNewsletter = schedules.task({
  id: 'weekly-newsletter',
  cron: '0 8 * * 6', // At minute 0 past every 8th hour on Saturday
  run: async (payload) => {
    await newsletterService.sendWeeklySummaryEmail();

    return {
      payload,
    };
  },
}); */
