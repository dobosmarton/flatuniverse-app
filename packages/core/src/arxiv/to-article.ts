import { Data, Result, Schema } from 'effect';
import { Article } from '../domain/article.js';
import { fromOaiIdentifier, stripVersion } from '../domain/arxiv-id.js';
import { keepKnownCategories } from '../domain/category.js';
import { toSlug } from '../domain/slug.js';
import type { ArxivMetadata, OaiRecord } from './oai-response.js';
import { isDeleted } from './oai-response.js';

export class UnmappableRecord extends Data.TaggedError('UnmappableRecord')<{
  readonly identifier: string;
  readonly reason: string;
}> {}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * arXiv emits `YYYY-MM-DD`. Anchoring to UTC keeps the value independent of
 * wherever the harvester happens to run.
 */
const toEpochMillis = (isoDate: string): number | undefined => {
  const match = ISO_DATE.exec(isoDate);
  if (match === null) return undefined;

  const [, year, month, day] = match;
  if (year === undefined || month === undefined || day === undefined) return undefined;

  return Date.UTC(Number(year), Number(month) - 1, Number(day));
};

/** Titles and abstracts arrive hard-wrapped with two-space continuation indents. */
const unwrap = (text: string): string => text.replace(/\s+/g, ' ').trim();

type OaiAuthor = {
  readonly keyname?: string | undefined;
  readonly forenames?: string | undefined;
  readonly suffix?: string | undefined;
};

const isPresent = (part: string | undefined): part is string => part !== undefined && part.trim().length > 0;

const toAuthorName = ({ keyname, forenames, suffix }: OaiAuthor): string =>
  [forenames, keyname, suffix].filter(isPresent).map((part) => part.trim()).join(' ');

const toAuthorNames = (metadata: ArxivMetadata): readonly string[] =>
  (metadata.authors.author ?? []).map(toAuthorName).filter((name) => name.length > 0);

const splitCategories = (raw: string): readonly string[] => raw.split(/\s+/).filter((part) => part.length > 0);

const optionalText = (raw: string | undefined): string | undefined => {
  if (raw === undefined) return undefined;

  const trimmed = unwrap(raw);

  return trimmed.length > 0 ? trimmed : undefined;
};

const decode = Schema.decodeUnknownResult(Article);

/**
 * Maps one harvested record onto the domain model, or explains why it cannot be
 * mapped. Records are skipped rather than failing the batch: a single
 * malformed entry in a 1,300-record page must not cost the whole page.
 */
export const toArticle = (record: OaiRecord): Result.Result<Article, UnmappableRecord> => {
  const identifier = fromOaiIdentifier(record.header.identifier);

  const reject = (reason: string) => Result.fail(new UnmappableRecord({ identifier, reason }));

  if (isDeleted(record)) return reject('record is marked deleted');

  const metadata = record.metadata?.arXiv;
  if (metadata === undefined) return reject('record has no arXiv metadata block');

  const categories = keepKnownCategories(splitCategories(metadata.categories));
  const [primaryCategory] = categories;
  if (primaryCategory === undefined) return reject(`no known category in "${metadata.categories}"`);

  const publishedAt = toEpochMillis(metadata.created);
  if (publishedAt === undefined) return reject(`unparseable created date "${metadata.created}"`);

  // A paper that has never been revised carries no `updated` element.
  const updatedAt = metadata.updated === undefined ? publishedAt : toEpochMillis(metadata.updated);
  if (updatedAt === undefined) return reject(`unparseable updated date "${metadata.updated ?? ''}"`);

  const id = stripVersion(metadata.id);
  const title = unwrap(metadata.title);

  const comment = optionalText(metadata.comments);
  const doi = optionalText(metadata.doi);
  const journalRef = optionalText(metadata['journal-ref']);

  const candidate = {
    id,
    slug: toSlug(title, id),
    title,
    abstract: unwrap(metadata.abstract),
    authors: toAuthorNames(metadata),
    primaryCategory,
    categories,
    publishedAt,
    updatedAt,
    ...(comment !== undefined && { comment }),
    ...(doi !== undefined && { doi }),
    ...(journalRef !== undefined && { journalRef }),
  };

  return Result.mapError(
    decode(candidate),
    (parseError) => new UnmappableRecord({ identifier, reason: parseError.message }),
  );
};

export type MappedPage = {
  readonly articles: readonly Article[];
  readonly skipped: readonly UnmappableRecord[];
};

export const toArticles = (records: readonly OaiRecord[]): MappedPage => {
  const articles: Article[] = [];
  const skipped: UnmappableRecord[] = [];

  for (const record of records) {
    const mapped = toArticle(record);

    if (Result.isSuccess(mapped)) articles.push(mapped.success);
    else skipped.push(mapped.failure);
  }

  return { articles, skipped };
};
