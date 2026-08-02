import { Data, Result } from 'effect';

export class InvalidHarvestRange extends Data.TaggedError('InvalidHarvestRange')<{
  readonly reason: string;
}> {}

/** An OAI-PMH datestamp bound, `YYYY-MM-DD`, inclusive at both ends. */
export type OaiDate = string;

export type HarvestWindow = {
  readonly from: OaiDate;
  readonly until: OaiDate;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

const toUtcMillis = (date: OaiDate): number | undefined => {
  if (!ISO_DATE.test(date)) return undefined;

  const millis = Date.parse(`${date}T00:00:00Z`);

  return Number.isNaN(millis) ? undefined : millis;
};

const toOaiDate = (millis: number): OaiDate => new Date(millis).toISOString().slice(0, 10);

/**
 * Harvesting is split into one-day windows rather than run as a single
 * resumption-token chain, for three reasons observed against the live endpoint:
 *
 *   1. Tokens expire. Live pages carry an `expirationDate` of the next UTC
 *      midnight, and a full backfill takes longer than that — a single chain
 *      would die partway through.
 *   2. Windows are independently retryable. A failed day is re-requested on its
 *      own instead of restarting the chain.
 *   3. Progress is checkpointable as a single date, so an interrupted backfill
 *      resumes from the last completed day.
 *
 * A day still exceeds the ~1,300-record page size occasionally, so callers must
 * follow resumption tokens *within* a window as well.
 */
export const harvestWindows = (
  from: OaiDate,
  until: OaiDate,
): Result.Result<readonly HarvestWindow[], InvalidHarvestRange> => {
  const fromMillis = toUtcMillis(from);
  if (fromMillis === undefined) return Result.fail(new InvalidHarvestRange({ reason: `"${from}" is not YYYY-MM-DD` }));

  const untilMillis = toUtcMillis(until);
  if (untilMillis === undefined) {
    return Result.fail(new InvalidHarvestRange({ reason: `"${until}" is not YYYY-MM-DD` }));
  }

  if (fromMillis > untilMillis) {
    return Result.fail(new InvalidHarvestRange({ reason: `start ${from} is after end ${until}` }));
  }

  const windows: HarvestWindow[] = [];

  for (let day = fromMillis; day <= untilMillis; day += MILLIS_PER_DAY) {
    const date = toOaiDate(day);
    windows.push({ from: date, until: date });
  }

  return Result.succeed(windows);
};

const OAI_BASE_URL = 'https://oaipmh.arxiv.org/oai';

/** The arXiv-native format; richer than `oai_dc`, with separated author names. */
const METADATA_PREFIX = 'arXiv';

/**
 * A resumption token carries the original window's parameters server-side, so
 * OAI-PMH forbids sending it alongside `from`, `until` or `metadataPrefix`.
 */
export const listRecordsUrl = (window: HarvestWindow, resumptionToken?: string): string => {
  const params = new URLSearchParams({ verb: 'ListRecords' });

  if (resumptionToken === undefined) {
    params.set('metadataPrefix', METADATA_PREFIX);
    params.set('from', window.from);
    params.set('until', window.until);
  } else {
    params.set('resumptionToken', resumptionToken);
  }

  return `${OAI_BASE_URL}?${params.toString()}`;
};
