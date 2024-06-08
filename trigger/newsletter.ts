import { schedules } from '@trigger.dev/sdk/v3';
import * as newsletterService from '@/lib/newsletter';

export const weeklyNewsletterTask = schedules.task({
  id: 'weekly-newsletter',
  run: async (payload) => {
    await newsletterService.sendWeeklySummaryEmail();

    return {
      payload,
    };
  },
});

export const weeklyNewsletterSchedule = schedules.create({
  task: weeklyNewsletterTask.id,
  // Every Saturday at 8:00 AM
  cron: '0 8 * * 6',
});
