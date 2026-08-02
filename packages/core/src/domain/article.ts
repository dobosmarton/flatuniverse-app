import { Schema } from 'effect';
import { ArxivId } from './arxiv-id.js';
import { CategoryShortName } from './category.js';
import { Slug } from './slug.js';

export const AuthorName = Schema.NonEmptyString.pipe(Schema.brand('AuthorName'));

export type AuthorName = typeof AuthorName.Type;

/**
 * Epoch milliseconds rather than `Date`.
 *
 * Vectorize and S3 Vectors both filter on numeric metadata, and DynamoDB sort
 * keys compare as strings — a single numeric representation everywhere removes
 * the Date/number coercion that made the old `timestamp` vs `published`
 * mismatch possible in the first place.
 */
export const Timestamp = Schema.Int.pipe(Schema.brand('Timestamp'));

export type Timestamp = typeof Timestamp.Type;

/**
 * The canonical article. Every source (OAI-PMH today, a bulk snapshot later)
 * decodes into this, and every store persists it. Nothing downstream of here
 * knows which source a record came from.
 *
 * Deliberately absent: the PDF link and abstract link, both derivable from `id`
 * (see `arxiv-id.ts`), and any generated summary — the summarisation feature
 * produced 526 rows across 206k articles and is not being carried forward.
 */
export const Article = Schema.Struct({
  id: ArxivId,
  slug: Slug,
  title: Schema.NonEmptyString,
  abstract: Schema.NonEmptyString,
  authors: Schema.Array(AuthorName),

  /** The first category arXiv lists is the submitter's primary classification. */
  primaryCategory: CategoryShortName,
  categories: Schema.Array(CategoryShortName),

  /** When v1 was submitted. */
  publishedAt: Timestamp,
  /** When the most recent revision or metadata change landed. */
  updatedAt: Timestamp,

  comment: Schema.optional(Schema.NonEmptyString),
  doi: Schema.optional(Schema.NonEmptyString),
  journalRef: Schema.optional(Schema.NonEmptyString),
});

export type Article = typeof Article.Type;

export const decodeArticle = Schema.decodeUnknownEffect(Article);

/**
 * What gets embedded. Retrieval quality depends far more on this one function
 * than on any tuning downstream of it, so it lives with the domain model rather
 * than inside the embedding service.
 */
export const embeddableText = (article: Article): string => `${article.title}\n\n${article.abstract}`;
