import { xmlParser } from '../xml-parser';
import { ArticleMetadata, ResumptionToken, articleMetadataSchema } from './schema';
import { sleep } from './utils';

// Example usage
const baseUrl = 'https://export.arxiv.org/oai2';
const metadataPrefix = 'arXiv'; // Dublin Core format
const retryMin = 5; // wait at least 5 seconds
const retryMax = 600; // wait at maximum 600 seconds
// Optionally, specify a set
// const set = 'your_set_spec';

const getResumptionToken = (resumptionToken: ResumptionToken | undefined, listSize: number): string | null => {
  if (!resumptionToken?.token) {
    return null;
  }

  const { cursor, completeListSize, token } = resumptionToken;

  if (cursor && completeListSize && parseInt(cursor, 10) + listSize >= parseInt(completeListSize, 10)) {
    return null;
  }

  return token;
};

export async function* getOaiListItems(fromDate?: string, untilDate?: string) {
  const initialResult = await getListRecords(fromDate, untilDate);

  // console.log('initialResult', initialResult.resumptionToken, initialResult.records.length);

  for (const item of initialResult.records) {
    yield item;
  }

  let result = initialResult;
  let resumptionToken;
  while ((resumptionToken = getResumptionToken(result.resumptionToken, result.records.length))) {
    // console.log('resumptionToken#result', resumptionToken);

    const response = await getListRecords(undefined, undefined, resumptionToken);

    // console.log('response', response.resumptionToken, response.records.length);

    result = response;
    for (const item of response.records) {
      yield item;
    }
  }
}

const getListRecords = async (
  fromDate?: string,
  untilDate?: string,
  resumptionToken?: string
): Promise<ArticleMetadata> => {
  const qs: {
    verb: string;
    metadataPrefix?: string;
    from?: string;
    until?: string;
    resumptionToken?: string;
  } = {
    verb: 'ListRecords',
  };

  if (!resumptionToken) {
    qs.metadataPrefix = 'arXiv';
  }
  if (!resumptionToken && fromDate) {
    qs.from = fromDate;
  }
  if (!resumptionToken && untilDate) {
    qs.until = untilDate;
  }
  if (resumptionToken) {
    qs.resumptionToken = resumptionToken;
  }
  const queryString = Object.keys(qs)
    .map((key) => `${key}=${qs[key as keyof typeof qs]}`)
    .join('&');

  // console.log('queryString', queryString);

  // Construct the request URL
  let requestUrl = `${baseUrl}?${queryString}`;

  let response: Response | null = null;

  do {
    // Send the HTTP GET request
    response = await fetch(requestUrl, { cache: 'no-store' });

    // console.log('response', response.status, response.headers.get('retry-after'));

    if (response.status === 503) {
      const retryAfter = response.headers.get('retry-after');

      if (!retryAfter) {
        throw new Error('Status code 503 without Retry-After header.');
      }

      let retrySeconds;
      if (/^\s*\d+\s*$/.test(retryAfter)) {
        // integer: seconds to wait
        retrySeconds = parseInt(retryAfter, 10);
      } else {
        // http-date: date to await
        const retryDate = new Date(retryAfter);
        if (!retryDate) {
          throw new Error('Status code 503 with invalid Retry-After header.');
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

      // wait
      await sleep(retrySeconds);
    }
  } while (response.status === 503);

  const textData = await response.text();

  // console.log('textData', textData);

  const parser = xmlParser();

  let jsonData = parser.parse(textData);

  // console.log('jsonData', jsonData['OAI-PMH'].ListRecords.record[0]);

  return articleMetadataSchema.parse(jsonData['OAI-PMH']);
};

// Function to process OAI-PMH requests
export const getMetadata = (startDate?: string) => {
  try {
    //const untilDate = '2024-02-17';

    return getOaiListItems(startDate);

    /*  // Construct the request URL
    let requestUrl = `${baseUrl}?verb=ListRecords&metadataPrefix=${metadataPrefix}&from=${fromDate}&until=${untilDate}`;

    // Send the HTTP GET request
    const response = await fetch(requestUrl, { cache: 'no-store' });

    const textData = await response.text();

    const parser = xmlParser();

    let jsonData = parser.parse(textData);

    console.log('jsonData', JSON.stringify(jsonData['OAI-PMH'].ListRecords.resumptionToken));

    const parsedData = articleMetadataSchema.parse(jsonData['OAI-PMH']);

    console.log('parsedData', parsedData.resumptionToken); */

    // Parse the XML response
    // const result = await parseStringPromise(json.data);

    /*  // Check for OAI-PMH errors
    if (result['OAI-PMH'].error) {
      throw new Error(`OAI-PMH Error: ${result['OAI-PMH'].error}`);
    }

    // Extract records
    const records = result['OAI-PMH'].ListRecords[0].record.map((r: any) => {
      const header = r.header[0];
      const metadata = r.metadata[0]; // Adjust based on your metadata format
      return {
        identifier: header.identifier[0],
        datestamp: header.datestamp[0],
        setSpec: header.setSpec ? header.setSpec[0] : undefined,
        metadata: metadata, // You might need further processing depending on the metadata format
      };
    });

    return records; */
  } catch (error) {
    console.error('Failed to fetch or process OAI-PMH records:', error);
    throw error;
  }
};
