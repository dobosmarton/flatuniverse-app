import { XMLParser } from 'fast-xml-parser';

export const xmlParser = () => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  return parser;
};
