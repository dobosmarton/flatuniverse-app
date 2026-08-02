import { Result } from 'effect';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseListRecords } from '../src/arxiv/oai-response.js';
import { toArticles } from '../src/arxiv/to-article.js';

/** Captured verbatim from https://oaipmh.arxiv.org/oai, not hand-written. */
const listRecordsXml = readFileSync(fileURLToPath(new URL('./fixtures/list-records.xml', import.meta.url)), 'utf8');

const parsePage = () => {
  const page = parseListRecords(listRecordsXml);

  if (Result.isFailure(page)) throw new Error(`fixture failed to parse: ${page.failure.message}`);

  return page.success;
};

describe('parseListRecords', () => {
  it('reads every record on the page', () => {
    expect(parsePage().records).toHaveLength(3);
  });

  it('extracts the resumption token', () => {
    expect(parsePage().resumptionToken).toBe('TOKEN-ABC');
  });

  it('extracts the complete list size', () => {
    expect(parsePage().completeListSize).toBe(1218);
  });

  it('treats an empty window as a page with no records rather than an error', () => {
    const emptyWindow = `<?xml version="1.0" encoding="UTF-8"?>
      <OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
        <error code="noRecordsMatch">no matching records</error>
      </OAI-PMH>`;

    const page = parseListRecords(emptyWindow);

    expect(page).toStrictEqual(
      Result.succeed({ records: [], resumptionToken: undefined, completeListSize: undefined }),
    );
  });

  it('surfaces a genuine protocol error', () => {
    const badVerb = `<?xml version="1.0" encoding="UTF-8"?>
      <OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
        <error code="badArgument">unknown argument</error>
      </OAI-PMH>`;

    const page = parseListRecords(badVerb);

    expect(Result.isFailure(page) && page.failure._tag).toBe('OaiProtocolError');
  });

  it('reports malformed XML rather than throwing', () => {
    const page = parseListRecords('<OAI-PMH><unclosed>');

    expect(Result.isFailure(page)).toBe(true);
  });
});

describe('toArticles', () => {
  const mapped = () => toArticles(parsePage().records);

  it('maps every fixture record', () => {
    expect(mapped().articles).toHaveLength(3);
  });

  it('skips nothing in a well-formed page', () => {
    expect(mapped().skipped).toStrictEqual([]);
  });

  it('keeps a legacy identifier intact', () => {
    const legacy = mapped().articles.find((article) => article.id === 'math/0609045');

    expect(legacy).toBeDefined();
  });

  it('derives a slug that round-trips a legacy identifier', () => {
    const legacy = mapped().articles.find((article) => article.id === 'math/0609045');

    expect(legacy?.slug).toBe('a-priori-bounds-for-some-infinitely-renormalizable-quadratics-i-bounded--math_0609045');
  });

  it('parses dates as UTC epoch milliseconds', () => {
    const article = mapped().articles.find((item) => item.id === '0803.0966');

    expect(article?.publishedAt).toBe(Date.UTC(2008, 2, 6));
  });

  it('carries the DOI through', () => {
    const article = mapped().articles.find((item) => item.id === '0803.0966');

    expect(article?.doi).toBe('10.3233/IDA-2007-11502');
  });

  it('carries the journal reference through', () => {
    const article = mapped().articles.find((item) => item.id === '0803.0966');

    expect(article?.journalRef).toBe('Intelligent Data Analysis, 11(5):437-455, 2007');
  });

  it('leaves optional fields undefined when arXiv omits them', () => {
    const article = mapped().articles.find((item) => item.id === 'math/0609045');

    expect(article?.doi).toBeUndefined();
  });

  it('takes the first listed category as primary', () => {
    const article = mapped().articles.find((item) => item.id === '0803.0966');

    expect(article?.primaryCategory).toBe('cs.DB');
  });

  it('keeps every known category', () => {
    const article = mapped().articles.find((item) => item.id === '0803.0966');

    expect(article?.categories).toStrictEqual(['cs.DB', 'stat.ML']);
  });

  it('joins author forenames and keyname', () => {
    const article = mapped().articles.find((item) => item.id === 'math/0609045');

    expect(article?.authors).toStrictEqual(['Jeremy Kahn']);
  });

  it('reads a multi-author record', () => {
    const article = mapped().articles.find((item) => item.id === '0803.0966');

    expect(article?.authors).toStrictEqual(['Michael Hahsler', 'Kurt Hornik']);
  });
});
