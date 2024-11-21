import { task } from '@trigger.dev/sdk/v3';
import { articleMetadataSchema } from '@/lib/oai-pmh/schema';
import { xmlParser } from '@/lib/xml-parser';

const minimumDate = '2024-01-01';

/**
 * This task is used to parse the response from the OAI-PMH server.
 * It is triggered by the `parse-metadata` event.
 *
 * Input: string - The response from the OAI-PMH server - XML format
 * Output: { resumptionToken: string, records: ArticleMetadata[] }
 *
 * 1. Parse the response
 * 2. Get the records and resumption token
 * 3. Filter the records by the minimum date (2024-01-01) - only get the records that were created or updated after this date
 * 4. Return the records and resumption token
 */
export const parseMetadata = task({
  id: 'parse-metadata',
  run: async (payload: string) => {
    const parser = xmlParser();

    let jsonData = parser.parse(payload);

    if (!jsonData) {
      throw new Error('Error parsing XML!');
    }

    const parsedData = articleMetadataSchema.parse(jsonData['OAI-PMH']);

    if (parsedData.error) {
      throw new Error(`Error parsing data: ${parsedData.error.message}`);
    }

    const startDateObj = new Date(minimumDate).getTime();

    const metadata = parsedData.records
      .filter((item) => {
        const created = item.metadata.published.getTime();
        const updated = item.metadata.updated ? item.metadata.updated.getTime() : null;

        return created >= startDateObj || (updated && updated >= startDateObj);
      })
      .map((item) => item.metadata);

    return { resumptionToken: parsedData.resumptionToken, records: metadata };
  },
});
