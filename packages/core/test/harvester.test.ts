import { Effect, Layer, Ref, Stream } from 'effect';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ArxivClient, ArxivUnavailable } from '../src/arxiv/client.js';
import { articlesOf, harvest, harvestWindow } from '../src/arxiv/harvester.js';

const fixture = (name: string) => readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');

const listRecordsXml = fixture('list-records.xml');

/** The same page with its resumption token removed, i.e. the last of a window. */
const finalPageXml = listRecordsXml.replace(/<resumptionToken[\s\S]*?<\/resumptionToken>/, '');

const emptyWindowXml = `<?xml version="1.0" encoding="UTF-8"?>
  <OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
    <error code="noRecordsMatch">no matching records</error>
  </OAI-PMH>`;

/**
 * Answers each request with the next body in the list, recording the URLs it was
 * asked for so tests can assert on how the harvester paginated.
 */
const scriptedClient = (bodies: readonly string[]) =>
  Effect.gen(function*() {
    const requested = yield* Ref.make<readonly string[]>([]);

    const layer = Layer.succeed(ArxivClient)(
      ArxivClient.of({
        fetchPage: (url) =>
          Effect.gen(function*() {
            const seen = yield* Ref.getAndUpdate(requested, (urls) => [...urls, url]);
            const body = bodies[seen.length];

            if (body === undefined) {
              return yield* Effect.fail(
                new ArxivUnavailable({ url, status: undefined, retryable: false }),
              );
            }

            return body;
          }),
      }),
    );

    return { layer, requested } as const;
  });

const oneDay = { from: '2024-01-01', until: '2024-01-01' };

describe('harvestWindow', () => {
  it('follows the resumption token onto the next page', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer } = yield* scriptedClient([listRecordsXml, finalPageXml]);

        const pages = yield* Stream.runCollect(harvestWindow(oneDay)).pipe(Effect.provide(layer));

        expect(pages.length).toBe(2);
      }),
    ));

  it('stops when arXiv offers no token', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer } = yield* scriptedClient([finalPageXml]);

        const pages = yield* Stream.runCollect(harvestWindow(oneDay)).pipe(Effect.provide(layer));

        expect(pages.length).toBe(1);
      }),
    ));

  it('sends the window parameters first and the bare token afterwards', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer, requested } = yield* scriptedClient([listRecordsXml, finalPageXml]);

        yield* Stream.runDrain(harvestWindow(oneDay)).pipe(Effect.provide(layer));
        const urls = yield* Ref.get(requested);

        expect(urls).toStrictEqual([
          'https://oaipmh.arxiv.org/oai?verb=ListRecords&metadataPrefix=arXiv&from=2024-01-01&until=2024-01-01',
          'https://oaipmh.arxiv.org/oai?verb=ListRecords&resumptionToken=TOKEN-ABC',
        ]);
      }),
    ));

  it('numbers the pages within a window', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer } = yield* scriptedClient([listRecordsXml, finalPageXml]);

        const pages = yield* Stream.runCollect(harvestWindow(oneDay)).pipe(Effect.provide(layer));

        expect(pages.map((page) => page.pageNumber)).toStrictEqual([1, 2]);
      }),
    ));

  it('reports the window total arXiv advertised', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer } = yield* scriptedClient([finalPageXml]);

        const pages = yield* Stream.runCollect(harvestWindow(oneDay)).pipe(Effect.provide(layer));

        expect(pages[0]?.windowTotal).toBeUndefined();
      }),
    ));

  it('surfaces a client failure rather than ending the stream quietly', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer } = yield* scriptedClient([]);

        const outcome = yield* Effect.exit(
          Stream.runDrain(harvestWindow(oneDay)).pipe(Effect.provide(layer)),
        );

        expect(outcome._tag).toBe('Failure');
      }),
    ));
});

describe('harvest', () => {
  it('covers every day in the range', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer, requested } = yield* scriptedClient([finalPageXml, finalPageXml, finalPageXml]);

        yield* Stream.runDrain(harvest('2024-01-01', '2024-01-03')).pipe(Effect.provide(layer));
        const urls = yield* Ref.get(requested);

        expect(urls.map((url) => new URL(url).searchParams.get('from'))).toStrictEqual([
          '2024-01-01',
          '2024-01-02',
          '2024-01-03',
        ]);
      }),
    ));

  it('treats an empty day as zero articles, not an error', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer } = yield* scriptedClient([emptyWindowXml]);

        const pages = yield* Stream.runCollect(harvest('2024-01-01', '2024-01-01')).pipe(Effect.provide(layer));

        expect(pages[0]?.articles).toStrictEqual([]);
      }),
    ));

  it('fails on a malformed range before making any request', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer, requested } = yield* scriptedClient([finalPageXml]);

        yield* Effect.exit(
          Stream.runDrain(harvest('2024-02-01', '2024-01-01')).pipe(Effect.provide(layer)),
        );

        expect(yield* Ref.get(requested)).toStrictEqual([]);
      }),
    ));
});

describe('articlesOf', () => {
  it('flattens pages into their articles', () =>
    Effect.runPromise(
      Effect.gen(function*() {
        const { layer } = yield* scriptedClient([finalPageXml]);

        const articles = yield* Stream.runCollect(articlesOf(harvestWindow(oneDay))).pipe(Effect.provide(layer));

        expect(articles.map((article) => article.id)).toStrictEqual([
          'math/0609045',
          '0803.0966',
          '1503.07177',
        ]);
      }),
    ));
});
