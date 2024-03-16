import { client } from '@/trigger';
import { IOLogger, eventTrigger } from '@trigger.dev/sdk';
import { Events, researchSyncRetryPayloadSchema } from '../events';

const retryDefault = 10; // wait 10 seconds by default
const retryMin = 5; // wait at least 5 seconds
const retryMax = 600; // wait at maximum 600 seconds

const getRetrySeconds = (logger: IOLogger, retryAfter: string | null | undefined) => {
  if (!retryAfter) {
    return retryDefault;
  }

  let retrySeconds;
  if (/^\s*\d+\s*$/.test(retryAfter)) {
    // integer: seconds to wait
    retrySeconds = parseInt(retryAfter, 10);
  } else {
    // http-date: date to await
    const retryDate = new Date(retryAfter);
    if (!retryDate) {
      logger.warn('Status code 503 with invalid Retry-After header.');
      return retryDefault;
    }
    retrySeconds = Math.floor((retryDate.getTime() - new Date().getTime()) / 1000);
  }

  // sanitize
  if (retrySeconds < retryMin) {
    retrySeconds = retryMin;
  }
  if (retrySeconds > retryMax) {
    retrySeconds = retryMax;
  }

  return retrySeconds;
};

client.defineJob({
  id: 'research-sync-retry',
  name: 'Research Sync Retry',
  version: '0.0.1',
  trigger: eventTrigger({
    name: Events.research_sync_retry,
    schema: researchSyncRetryPayloadSchema,
  }),
  run: async (payload, io, ctx) => {
    await io.wait(
      `research-sync-retry-wait-${ctx.event.context.jobId}`,
      getRetrySeconds(io.logger, payload.retryAfter)
    );

    await io.sendEvent(`${Events.research_sync}-${ctx.event.context.jobId}-${payload.retryCount}`, {
      name: Events.research_sync,
      context: {
        jobId: ctx.event.context?.jobId,
        retryCount: payload.retryCount,
      },
      payload: {
        startDate: payload.startDate,
        untilDate: payload.untilDate,
        resumptionToken: payload.resumptionToken,
      },
    });

    return { payload, ctx };
  },
});
