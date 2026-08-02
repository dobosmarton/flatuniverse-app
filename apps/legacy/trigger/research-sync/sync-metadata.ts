import { logger, retry, task, wait } from '@trigger.dev/sdk/v3';

import { getRequestUrl, getResumptionToken } from '@/lib/oai-pmh';
import { ResearchSyncPayload, researchSyncPayloadSchema } from '../schema';
import { addArticleMetadaBatch } from './add-article-metadata-batch';
import { parseMetadata } from './parse-metadata';

const batchSize = 100;
const retryDefault = 10; // wait 10 seconds by default
const retryMin = 5; // wait at least 5 seconds
const retryMax = 600; // wait at maximum 600 seconds

/**
 * This function is used to get the retry seconds for a 503 error.
 * @param retryAfter - The retry after header from the OAI-PMH server
 * @returns The retry seconds
 */
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

/**
 * This task is used to sync the article metadata from the OAI-PMH server.
 * It is triggered by the `metadata-sync` event.
 *
 * Input: ResearchSyncPayload - The payload contains the start date, until date and resumption token
 * Output: void
 *
 * 1. Get the request URL from the payload - start date, until date and resumption token
 * 2. Fetch the response from the OAI-PMH server - retry 3 times
 * 3. Parse the response and get the records and resumption token by calling the `parseMetadata` task
 * 4. Split the records into batches of 100
 * 5. Add the article metadata to the database by calling the `addArticleMetadaBatch` task
 * 6. If there is a resumption token, trigger the same event with the resumption token by calling the `syncMetadata` task
 */
export const syncMetadata = task({
  id: 'metadata-sync',
  run: async (_payload: ResearchSyncPayload) => {
    const payload = researchSyncPayloadSchema.parse(_payload);

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

    const parsedData = await parseMetadata.triggerAndWait(responseTextData, {
      idempotencyKey: `parse-metadata-${payload.jobId}-${payload.startDate}-${payload.untilDate}`,
    });

    if (!parsedData.ok) {
      logger.error(`Error parsing data: ${parsedData.error}`);
      throw new Error(`Error parsing data: ${parsedData.error}`);
    }

    const batchCount = Math.ceil(parsedData.output.records.length / batchSize);

    const batches = Array.from({ length: batchCount }, (_, i) => {
      return parsedData.output.records.slice(i * batchSize, (i + 1) * batchSize);
    });

    // send the batch to the add_article_metadata_batch event
    // no need to wait for the result
    await addArticleMetadaBatch.batchTrigger(
      batches.map((batch, index) => ({ payload: { batch, batchIndex: index, jobId: payload.jobId } }))
    );

    const token = getResumptionToken(parsedData.output.resumptionToken, parsedData.output.records.length);

    logger.info(`Resumption token: ${token}`, { time: new Date().toISOString() });

    if (token) {
      // send the resumption token to the same event
      // no need to wait for the result
      await syncMetadata.trigger(
        {
          jobId: payload.jobId,
          startDate: payload.startDate,
          untilDate: payload.untilDate,
          resumptionToken: token,
        },
        {
          idempotencyKey: `sync-metadata-${payload.jobId}-${payload.startDate}-${payload.untilDate}`,
        }
      );
    }
  },
});
