import { Schema } from 'effect';

const ARXIV_BASE_URL = 'https://arxiv.org';

/**
 * arXiv identifiers come in two shapes:
 *   - modern (April 2007 onwards): `2402.04878`, optionally `2402.04878v3`
 *   - legacy: `math.AG/0703012`, `hep-ph/9901001`
 *
 * We store the version-less form so that a revised paper keeps one identity.
 */
const MODERN_ID = /^\d{4}\.\d{4,5}$/;
const LEGACY_ID = /^[a-z-]+(\.[A-Z]{2})?\/\d{7}$/;

const VERSION_SUFFIX = /v\d+$/;

const isArxivId = (value: string): boolean => MODERN_ID.test(value) || LEGACY_ID.test(value);

export const ArxivId = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value: string) => isArxivId(value) || 'not an arXiv identifier', { identifier: 'ArxivId' }),
  ),
  Schema.brand('ArxivId'),
);

export type ArxivId = typeof ArxivId.Type;

export const stripVersion = (rawId: string): string => rawId.trim().replace(VERSION_SUFFIX, '');

/**
 * OAI-PMH headers identify records as `oai:arXiv.org:2402.04878`.
 */
const OAI_IDENTIFIER_PREFIX = 'oai:arXiv.org:';

export const fromOaiIdentifier = (identifier: string): string =>
  stripVersion(
    identifier.startsWith(OAI_IDENTIFIER_PREFIX) ? identifier.slice(OAI_IDENTIFIER_PREFIX.length) : identifier,
  );

/**
 * Both URLs are pure functions of the identifier, which is why the old schema's
 * `link` and `article_metadata_to_link` tables (134 MB of the dump) are gone.
 */
export const abstractUrl = (id: ArxivId): string => `${ARXIV_BASE_URL}/abs/${id}`;

export const pdfUrl = (id: ArxivId): string => `${ARXIV_BASE_URL}/pdf/${id}`;
