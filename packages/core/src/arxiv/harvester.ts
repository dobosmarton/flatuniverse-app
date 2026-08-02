import { Effect, Option, Stream } from 'effect';
import type { Article } from '../domain/article.js';
import { ArxivClient } from './client.js';
import type { ArxivUnavailable } from './client.js';
import type { HarvestWindow, OaiDate } from './harvest-window.js';
import { harvestWindows, listRecordsUrl } from './harvest-window.js';
import type { InvalidHarvestRange } from './harvest-window.js';
import { parseListRecords } from './oai-response.js';
import type { OaiParseError, OaiProtocolError } from './oai-response.js';
import type { UnmappableRecord } from './to-article.js';
import { toArticles } from './to-article.js';

export type HarvestedPage = {
  readonly window: HarvestWindow;
  readonly articles: readonly Article[];
  /** Records arXiv returned that could not be mapped. Never silently dropped. */
  readonly skipped: readonly UnmappableRecord[];
  /** How many pages of this window have been delivered, this one included. */
  readonly pageNumber: number;
  /** arXiv's own count for the window, when it chose to report one. */
  readonly windowTotal: number | undefined;
};

export type HarvestError = ArxivUnavailable | OaiParseError | OaiProtocolError;

/**
 * Where the next request within a window should resume from. `Option.none` on
 * the first request, because a resumption token may not accompany the
 * parameters that created it.
 */
type PageCursor = {
  readonly token: Option.Option<string>;
  readonly pageNumber: number;
};

const FIRST_PAGE: PageCursor = { token: Option.none<string>(), pageNumber: 1 };

const fetchPage = (
  window: HarvestWindow,
  cursor: PageCursor,
): Effect.Effect<readonly [readonly HarvestedPage[], Option.Option<PageCursor>], HarvestError, ArxivClient> =>
  Effect.gen(function*() {
    const client = yield* ArxivClient;
    const url = listRecordsUrl(window, Option.getOrUndefined(cursor.token));

    const body = yield* client.fetchPage(url);
    const page = yield* Effect.fromResult(parseListRecords(body));
    const { articles, skipped } = toArticles(page.records);

    const harvested: HarvestedPage = {
      window,
      articles,
      skipped,
      pageNumber: cursor.pageNumber,
      windowTotal: page.completeListSize,
    };

    const nextCursor: Option.Option<PageCursor> = Option.map(
      Option.fromUndefinedOr(page.resumptionToken),
      (token): PageCursor => ({ token: Option.some(token), pageNumber: cursor.pageNumber + 1 }),
    );

    return [[harvested], nextCursor] as const;
  });

/**
 * Every page of a single day, following resumption tokens until arXiv stops
 * offering one. A quiet day is one page; a busy one runs to two or three.
 */
export const harvestWindow = (window: HarvestWindow): Stream.Stream<HarvestedPage, HarvestError, ArxivClient> =>
  Stream.paginate(FIRST_PAGE, (cursor) => fetchPage(window, cursor));

/**
 * The whole range, one day at a time.
 *
 * Windows are processed in order and never concurrently: arXiv asks harvesters
 * to keep to roughly one request at a time, and sequential order is what makes
 * "resume from the last completed day" a single date rather than a set.
 */
export const harvest = (
  from: OaiDate,
  until: OaiDate,
): Stream.Stream<HarvestedPage, HarvestError | InvalidHarvestRange, ArxivClient> =>
  Effect.fromResult(harvestWindows(from, until)).pipe(
    Stream.fromIterableEffect,
    Stream.flatMap(harvestWindow),
  );

/** Flattens a page stream to the articles inside it. */
export const articlesOf = <E, R>(pages: Stream.Stream<HarvestedPage, E, R>): Stream.Stream<Article, E, R> =>
  Stream.flatMap(pages, (page) => Stream.fromIterable(page.articles));
