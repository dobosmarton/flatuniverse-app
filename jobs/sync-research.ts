import { client } from '@/trigger';
import { eventTrigger } from '@trigger.dev/sdk';
import { getRequestUrl, getResumptionToken } from '@/lib/oai-pmh';
import { xmlParser } from '@/lib/xml-parser';
import { articleMetadataSchema } from '@/lib/oai-pmh/schema';
import { Events, researchSyncPayloadSchema } from './events';

const batchSize = 100;
const minimumDate = '2024-01-01';

client.defineJob({
  id: 'research-sync',
  name: 'Research Sync',
  version: '0.0.1',
  trigger: eventTrigger({
    name: Events.research_sync,
    schema: researchSyncPayloadSchema,
  }),
  run: async (payload, io, ctx) => {
    const responseTextData = await io.runTask(`fetch-research-data-${ctx.job.id}`, async (task, io) => {
      const initialRequestUrl = getRequestUrl(payload.startDate, payload.untilDate, payload.resumptionToken);

      await io.logger.info(`Fetch response ${initialRequestUrl}`, { time: new Date().toISOString() });
      const response = await fetch(initialRequestUrl, { cache: 'no-store' });

      if (response.status !== 503) {
        return await response.text();
      }

      const retryAfter = response.headers.get('retry-after');
      const retryCount = (ctx.event.context?.retryCount ?? 0) + 1;
      await io.sendEvent(`${Events.research_sync_retry}-${ctx.job.id}-${retryCount}`, {
        name: Events.research_sync_retry,
        context: {
          jobId: ctx.event.context?.jobId,
        },
        payload: {
          ...payload,
          retryAfter,
          retryCount,
        },
      });

      return null;
    });

    await io.logger.info(`Fetch response: ${responseTextData ? 'success' : 'failure'}`, {
      time: new Date().toISOString(),
    });

    if (!responseTextData) {
      return;
    }

    const parser = xmlParser();

    let jsonData = parser.parse(responseTextData);

    if (!jsonData) {
      return;
    }

    const parsedData = articleMetadataSchema.parse(jsonData['OAI-PMH']);

    if (parsedData.error) {
      await io.logger.error(`Error parsing data: ${parsedData.error.message}`, { time: new Date().toISOString() });
      return;
    }

    const startDateObj = new Date(minimumDate).getTime();

    const filteredItems = parsedData.records
      .filter((item) => {
        const created = item.metadata.published.getTime();
        const updated = item.metadata.updated ? item.metadata.updated.getTime() : null;

        return created >= startDateObj || (updated && updated >= startDateObj);
      })
      .map((item) => item.metadata);

    await io.logger.info(
      `Filtered items length: ${filteredItems.length}, parsed items length: ${parsedData.records.length}`,
      { time: new Date().toISOString() }
    );

    for (let i = 0; i < filteredItems.length; ) {
      const batch = filteredItems.slice(i, i + batchSize);

      await io.logger.info(`Adding new article metadata batch #${i} with length ${batch.length}`, {
        time: new Date().toISOString(),
      });

      // send the batch to the add_article_metadata_batch event
      // no need to wait for the result
      io.sendEvent(`${Events.add_article_metadata_batch}-${ctx.job.id}-${i}`, {
        name: Events.add_article_metadata_batch,
        context: {
          jobId: ctx.event.context?.jobId,
        },
        payload: {
          batchIndex: i,
          batch,
        },
      });

      i += batchSize;
    }

    const token = getResumptionToken(parsedData.resumptionToken, parsedData.records.length);

    await io.logger.info(`Resumption token: ${token}`, { time: new Date().toISOString() });

    if (token) {
      // send the resumption token to the same event
      // no need to wait for the result
      io.sendEvent(`${Events.research_sync}-${ctx.job.id}-${token}`, {
        name: Events.research_sync,
        context: {
          jobId: ctx.event.context?.jobId,
        },
        payload: {
          startDate: payload.startDate,
          untilDate: payload.untilDate,
          resumptionToken: token,
        },
      });
    }

    return { payload, ctx };
  },
});
