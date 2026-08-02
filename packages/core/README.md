# @flatuniverse/core

Platform-agnostic domain model and arXiv ingest for the rebuild. Nothing in here
knows about D1, DynamoDB, Workers or Lambda — see `REFACTOR-PLAN.md` §4 for why
that boundary sits where it does.

```
src/domain/    the canonical Article and its value objects
src/arxiv/     OAI-PMH harvesting: response parsing, domain mapping, window planning
```

## Status: Phase 1, partially complete

Done:

- `Article` aggregate and value objects (`ArxivId`, `Slug`, `CategoryShortName`,
  `Timestamp`) as `effect/Schema`, on **Effect 4 beta** (pinned to `4.0.0-beta.102`;
  rationale and the v3→v4 API map are in `REFACTOR-PLAN.md` §11)
- arXiv taxonomy: 8 groups, 155 categories, ported from the legacy app
- OAI-PMH `ListRecords` parsing and mapping to `Article`
- Day-window harvest planning and URL construction
- 38 tests, strict `tsc` clean

Not yet done (rest of Phase 1):

- The harvester service that walks windows and follows resumption tokens
- NDJSON output to disk / R2
- The storage adapter, deferred until the platform is chosen

## Commands

Run these from the repository root — lint and format are repo-wide single-process
runs, not per-package turbo tasks, because oxlint and dprint are fast enough that
orchestrating them would cost more than it saves.

```bash
pnpm install
pnpm check          # format:check → lint → typecheck → test
pnpm format         # dprint fmt
pnpm lint:fix       # oxlint --fix
```

Toolchain: **TypeScript 7** (native Go compiler), **oxlint** for linting,
**dprint** for formatting. All three are Rust or Go; the whole `check` pipeline
runs in a couple of seconds.

## Findings that shaped this code

Measured against the live endpoint, not assumed. All three changed a design
decision.

**1. `from`/`until` filter on _last-modified_, not publication date.** A harvest
of `2024-01-01`–`2024-01-02` returned 1,218 records of which only 162 were
published in 2024; 1,009 were from 2023 and 47 predate it. The legacy dump shows
the same shape — 50,835 of its 206,211 articles (25%) were published before 2024.

_Consequence:_ "articles from 2024 onwards" is a claim about revision date, not
publication date. Whichever the product means, it has to filter on `publishedAt`
explicitly after harvesting.

**2. Resumption tokens expire at the next UTC midnight.** A full backfill takes
longer than that, so a single token chain cannot complete. Harvesting is split
into one-day windows: independently retryable, checkpointable as a single date,
and resumable after an interruption. Tokens are still followed _within_ a window,
since a busy day exceeds the ~1,300-record page.

**3. Page size is ~1,300 records regardless of window width**, at roughly 40s per
request. A one-month window returned the same page size as a one-day window, just
with more token pages behind it.

## Measured sizing

Parsing one full live page (1,218 records) end to end:

|                            |                           |
| -------------------------- | ------------------------- |
| Mapped / skipped           | 1,218 / 0                 |
| Slug collisions            | 0                         |
| Legacy identifiers handled | 3                         |
| Average article as JSON    | 1,571 bytes               |
| Average embeddable text    | 1,186 chars (~300 tokens) |
| Slug length, median / max  | 83 / 92                   |

Extrapolated to a 2024-01-01 → today harvest (~945 days at ~1,200 records/day,
so roughly 1.15M articles):

- ~1.8 GB of article JSON
- ~345M embedding tokens ≈ **$6.90**, or **$3.45** via the Batch API
- Harvest wall time ≈ **10 hours**, resumable by day

That is ~5.5× the legacy dump's 206k articles, because the old sync only ever ran
for part of the period. It stays inside both D1's 10 GB ceiling and DynamoDB's
25 GB free tier, but D1 is no longer roomy once the FTS index is added — worth
confirming before committing to the Cloudflare track.
