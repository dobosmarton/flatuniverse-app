import { Data, Result, Schema } from 'effect';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export class OaiParseError extends Data.TaggedError('OaiParseError')<{
  readonly reason: string;
  readonly cause?: unknown | undefined;
}> {}

export class OaiProtocolError extends Data.TaggedError('OaiProtocolError')<{
  readonly code: string;
  readonly message: string | undefined;
}> {}

/**
 * fast-xml-parser collapses a single repeated element into an object rather
 * than a one-element array. Declaring the repeatable paths up front removes the
 * `T | T[]` branching that the previous Zod schema carried at every level.
 */
const REPEATABLE_PATHS = new Set([
  'OAI-PMH.ListRecords.record',
  'OAI-PMH.ListRecords.record.header.setSpec',
  'OAI-PMH.ListRecords.record.metadata.arXiv.authors.author',
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Without this, `<id>704.0495</id>` becomes the number 704.0495 and
  // `<doi>10.1103/...</doi>` can lose precision. Everything stays a string.
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (_name, jpath) => REPEATABLE_PATHS.has(jpath),
});

const ArxivMetadata = Schema.Struct({
  id: Schema.String,
  created: Schema.String,
  updated: Schema.optional(Schema.String),
  title: Schema.String,
  abstract: Schema.String,
  categories: Schema.String,
  authors: Schema.Struct({
    author: Schema.optional(
      Schema.Array(
        Schema.Struct({
          keyname: Schema.optional(Schema.String),
          forenames: Schema.optional(Schema.String),
          suffix: Schema.optional(Schema.String),
        }),
      ),
    ),
  }),
  comments: Schema.optional(Schema.String),
  doi: Schema.optional(Schema.String),
  'journal-ref': Schema.optional(Schema.String),
});

export type ArxivMetadata = typeof ArxivMetadata.Type;

/**
 * Withdrawn papers arrive as a header with `status="deleted"` and no metadata
 * block. The previous implementation had no case for this and would have thrown
 * on the missing `metadata` key.
 */
const OaiRecord = Schema.Struct({
  header: Schema.Struct({
    identifier: Schema.String,
    datestamp: Schema.String,
    '@_status': Schema.optional(Schema.String),
  }),
  metadata: Schema.optional(Schema.Struct({ arXiv: ArxivMetadata })),
});

export type OaiRecord = typeof OaiRecord.Type;

export const isDeleted = (record: OaiRecord): boolean => record.header['@_status'] === 'deleted';

const ResumptionToken = Schema.Struct({
  '#text': Schema.optional(Schema.String),
  '@_cursor': Schema.optional(Schema.String),
  '@_completeListSize': Schema.optional(Schema.String),
});

const OaiEnvelope = Schema.Struct({
  'OAI-PMH': Schema.Struct({
    error: Schema.optional(
      Schema.Struct({
        '@_code': Schema.String,
        '#text': Schema.optional(Schema.String),
      }),
    ),
    ListRecords: Schema.optional(
      Schema.Struct({
        record: Schema.optional(Schema.Array(OaiRecord)),
        resumptionToken: Schema.optional(ResumptionToken),
      }),
    ),
  }),
});

const decodeEnvelope = Schema.decodeUnknownResult(OaiEnvelope);

export type OaiPage = {
  readonly records: readonly OaiRecord[];
  /** Absent once the last page of a window has been delivered. */
  readonly resumptionToken: string | undefined;
  readonly completeListSize: number | undefined;
};

/**
 * `noRecordsMatch` is how OAI-PMH reports an empty window. That is an ordinary
 * outcome when harvesting a quiet day, not a failure, so it decodes to an empty
 * page rather than an error.
 */
const EMPTY_WINDOW_CODE = 'noRecordsMatch';

const toPositiveInteger = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;

  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseListRecords = (
  xml: string,
): Result.Result<OaiPage, OaiParseError | OaiProtocolError> => {
  // The parser itself is lenient and will happily return a partial object for
  // a truncated document. Validating first means a mangled response fails loudly
  // instead of looking like a window with no records in it.
  const validation = XMLValidator.validate(xml);

  if (validation !== true) {
    return Result.fail(new OaiParseError({ reason: 'XML is not well-formed', cause: validation.err }));
  }

  const parsed = Result.try({
    try: () => parser.parse(xml) as unknown,
    catch: (cause) => new OaiParseError({ reason: 'XML could not be parsed', cause }),
  });

  if (Result.isFailure(parsed)) return Result.fail(parsed.failure);

  const decoded = decodeEnvelope(parsed.success);

  if (Result.isFailure(decoded)) {
    return Result.fail(
      new OaiParseError({ reason: 'response did not match the OAI-PMH schema', cause: decoded.failure }),
    );
  }

  const envelope = decoded.success['OAI-PMH'];
  const { error } = envelope;

  // A well-formed document that is neither an error nor a record list is not a
  // ListRecords response at all — treat it as a failure, never as zero records.
  if (error === undefined && envelope.ListRecords === undefined) {
    return Result.fail(new OaiParseError({ reason: 'response contained neither ListRecords nor an error' }));
  }

  if (error !== undefined && error['@_code'] !== EMPTY_WINDOW_CODE) {
    return Result.fail(new OaiProtocolError({ code: error['@_code'], message: error['#text'] }));
  }

  const listRecords = envelope.ListRecords;

  return Result.succeed({
    records: listRecords?.record ?? [],
    resumptionToken: listRecords?.resumptionToken?.['#text'],
    completeListSize: toPositiveInteger(listRecords?.resumptionToken?.['@_completeListSize']),
  });
};
