import { logger, retry, task, wait } from '@trigger.dev/sdk/v3';

import { getRequestUrl, getResumptionToken } from '@/lib/oai-pmh';
import { ResearchSyncPayload } from '../schema';
import { addArticleMetadaBatch } from './add-article-metadata-batch';
import { parseMetadata } from './parse-metadata';

const batchSize = 100;
const retryDefault = 10; // wait 10 seconds by default
const retryMin = 5; // wait at least 5 seconds
const retryMax = 600; // wait at maximum 600 seconds

const getRetrySeconds = (retryAfter: string | null | undefined) => {
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

export const syncMetadata = task({
  id: 'openai-task',
  run: async (payload: ResearchSyncPayload) => {
    const responseTextData = await retry.onThrow(
      async ({ attempt }) => {
        const initialRequestUrl = getRequestUrl(payload.startDate, payload.untilDate, payload.resumptionToken);

        logger.info(`Fetch response ${initialRequestUrl}`, { time: new Date().toISOString() });

        const response = await fetch(initialRequestUrl, { cache: 'no-store' });

        if (response.status === 503) {
          const retryAfter = response.headers.get('retry-after');
          await wait.for({ seconds: getRetrySeconds(retryAfter) });
          throw new Error(`Metadata fetch failed with status code 503 on attempt ${attempt}`);
        }

        return await response.text();
      },
      { maxAttempts: 3, randomize: false }
    );

    if (!responseTextData) {
      throw new Error(`Error fetching data from OAI-PMH server for ${payload.startDate} - ${payload.untilDate}`);
    }

    const parsedData = await parseMetadata.triggerAndWait(responseTextData);

    if (!parsedData.ok) {
      throw new Error('Error parsing data');
    }

    const batchCount = Math.ceil(parsedData.output.records.length / batchSize);

    const batches = Array.from({ length: batchCount }, (_, i) => {
      return parsedData.output.records.slice(i * batchSize, (i + 1) * batchSize);
    });

    // send the batch to the add_article_metadata_batch event
    // no need to wait for the result
    await addArticleMetadaBatch.batchTrigger(
      batches.map((batch, index) => ({ payload: { batch, batchIndex: index } }))
    );

    const token = getResumptionToken(parsedData.output.resumptionToken, parsedData.output.records.length);

    logger.info(`Resumption token: ${token}`, { time: new Date().toISOString() });

    if (token) {
      // send the resumption token to the same event
      // no need to wait for the result
      await syncMetadata.trigger({
        startDate: payload.startDate,
        untilDate: payload.untilDate,
        resumptionToken: token,
      });
    }
  },
});
