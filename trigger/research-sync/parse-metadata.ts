import { task } from '@trigger.dev/sdk/v3';
import { articleMetadataSchema } from '@/lib/oai-pmh/schema';
import { xmlParser } from '@/lib/xml-parser';

const minimumDate = '2024-01-01';

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
