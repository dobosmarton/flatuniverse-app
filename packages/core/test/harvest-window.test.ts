import { Result } from 'effect';
import { describe, expect, it } from 'vitest';
import { harvestWindows, listRecordsUrl } from '../src/arxiv/harvest-window.js';

const windowsOf = (from: string, until: string) => {
  const result = harvestWindows(from, until);

  if (Result.isFailure(result)) throw new Error(result.failure.reason);

  return result.success;
};

describe('harvestWindows', () => {
  it('emits one window per day, inclusive of both ends', () => {
    expect(windowsOf('2024-01-01', '2024-01-03')).toHaveLength(3);
  });

  it('emits a single window for a one-day range', () => {
    expect(windowsOf('2024-01-01', '2024-01-01')).toStrictEqual([{ from: '2024-01-01', until: '2024-01-01' }]);
  });

  it('crosses a month boundary', () => {
    const windows = windowsOf('2024-01-30', '2024-02-02');

    expect(windows.map((window) => window.from)).toStrictEqual([
      '2024-01-30',
      '2024-01-31',
      '2024-02-01',
      '2024-02-02',
    ]);
  });

  it('handles a leap day', () => {
    const windows = windowsOf('2024-02-28', '2024-03-01');

    expect(windows.map((window) => window.from)).toContain('2024-02-29');
  });

  it('rejects a range that runs backwards', () => {
    const result = harvestWindows('2024-02-01', '2024-01-01');

    expect(Result.isFailure(result)).toBe(true);
  });

  it('rejects a malformed date', () => {
    const result = harvestWindows('01/02/2024', '2024-01-01');

    expect(Result.isFailure(result)).toBe(true);
  });
});

describe('listRecordsUrl', () => {
  const window = { from: '2024-01-01', until: '2024-01-01' };

  it('requests the arXiv metadata format for a fresh window', () => {
    expect(listRecordsUrl(window)).toBe(
      'https://oaipmh.arxiv.org/oai?verb=ListRecords&metadataPrefix=arXiv&from=2024-01-01&until=2024-01-01',
    );
  });

  it('sends the resumption token alone, as the protocol requires', () => {
    expect(listRecordsUrl(window, 'TOKEN-ABC')).toBe(
      'https://oaipmh.arxiv.org/oai?verb=ListRecords&resumptionToken=TOKEN-ABC',
    );
  });
});
