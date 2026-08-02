import { ResumptionToken } from './schema';

// Example usage
const baseUrl = 'https://export.arxiv.org/oai2';

export const getResumptionToken = (resumptionToken: ResumptionToken | undefined, listSize: number): string | null => {
  if (!resumptionToken?.token) {
    return null;
  }

  const { cursor, completeListSize, token } = resumptionToken;

  if (cursor && completeListSize && parseInt(cursor, 10) + listSize >= parseInt(completeListSize, 10)) {
    return null;
  }

  return token;
};

export const getRequestUrl = (fromDate?: string, untilDate?: string, resumptionToken?: string): string => {
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

  return `${baseUrl}?${queryString}`;
};
