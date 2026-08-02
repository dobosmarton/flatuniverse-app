import { Schema } from 'effect';

/**
 * `slugify` collapses runs of hyphens, so a title slug can never contain `--`.
 * That makes a double hyphen a separator the title portion cannot forge, which
 * is what lets `parseArxivId` be unambiguous even for legacy identifiers that
 * contain hyphens of their own (`hep-ph/9901001`).
 */
const SEPARATOR = '--';

/** Long enough to stay descriptive, short enough to keep URLs manageable. */
const MAX_TITLE_LENGTH = 80;

/** `/` is not safe inside a URL path segment; `_` cannot occur in a title slug. */
const encodeId = (id: string): string => id.replaceAll('/', '_');

const decodeId = (encoded: string): string => encoded.replaceAll('_', '/');

const truncateAtWordBoundary = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;

  const clipped = text.slice(0, maxLength);
  const lastHyphen = clipped.lastIndexOf('-');

  return lastHyphen > 0 ? clipped.slice(0, lastHyphen) : clipped;
};

export const slugifyTitle = (title: string): string => {
  const asciiFolded = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // combining diacritics, left behind by NFKD
    .toLowerCase();

  const hyphenated = asciiFolded
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return truncateAtWordBoundary(hyphenated, MAX_TITLE_LENGTH);
};

/**
 * Embedding the identifier in the slug means an article page is a direct
 * primary-key lookup — no secondary index, no extra round trip on the hottest
 * path. It also makes slugs unique by construction, which the old
 * `slugify(title)` scheme was not: two papers sharing a title collided, and
 * `getArticleMetadataBySlug` silently returned whichever `findFirst` found.
 */
export const toSlug = (title: string, id: string): string => {
  const titleSlug = slugifyTitle(title);
  const encodedId = encodeId(id);

  return titleSlug.length > 0 ? `${titleSlug}${SEPARATOR}${encodedId}` : encodedId;
};

export const parseArxivId = (slug: string): string => {
  const separatorAt = slug.lastIndexOf(SEPARATOR);

  return decodeId(separatorAt === -1 ? slug : slug.slice(separatorAt + SEPARATOR.length));
};

export const Slug = Schema.String.pipe(Schema.brand('Slug'));

export type Slug = typeof Slug.Type;
