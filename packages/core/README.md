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
- `ArxivClient` service: `fetch` with `Retry-After` handling, exponential jittered
  retry, timeout, and a three-second spacing between requests
- `harvest(from, until)`: a `Stream` of pages that walks day windows in order and
  follows resumption tokens within each
- 48 tests, strict `tsc` clean, verified against the live endpoint

Not yet done (rest of Phase 1):

- NDJSON output to disk / R2, with a per-day checkpoint for resume
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

**3. A page caps at ~1,300 records regardless of window width.** A one-month
window returned the same page size as a two-day one, just with more token pages
behind it. Widening the window buys nothing; it only moves work behind more
tokens. Most single days fall under the cap and need no token at all.

**4. arXiv announces nothing at the weekend.** A live harvest of 2024-01-01 →
2024-01-07 returned 466, 752, 484, 544 and 602 articles on the weekdays and
**zero** on both Saturday and Sunday. Weekend windows still cost a request, and
are still worth making — metadata revisions could in principle land then — but
they contribute nothing to the corpus.

## Measured sizing

A live seven-day harvest, end to end through `harvest()`:

|                                |                           |
| ------------------------------ | ------------------------- |
| Days / articles                | 7 / 2,848                 |
| Mapped / skipped               | 2,848 / 0                 |
| Duplicate ids or slugs         | 0                         |
| Mean articles per calendar day | 407                       |
| Average article as JSON        | 1,582 bytes               |
| Average embeddable text        | 1,192 chars (~300 tokens) |

**This corrects an earlier estimate.** A first probe suggested ~1,200 articles a
day, giving ~1.15M for the full range. That probe used a _two-day_ window and
ignored empty weekends. The real figure is **407 a day averaged across the week**.

Extrapolated to a 2024-01-01 → today harvest (~945 days):

- **~385,000 articles** — not 1.15M
- **~610 MB** of article JSON — not 1.8 GB
- ~115M embedding tokens ≈ **$2.31**, or **$1.16** via the Batch API
- Harvest wall time **12–16 hours**, resumable by day (per-request latency varied
  between 4s and 60s across the sample, so treat this as a range)

The practical consequence: **D1's hard 10 GB ceiling is no longer a concern.**
At ~610 MB of source JSON the Cloudflare track has comfortable headroom even
after an FTS index, which removes the main technical argument that was pushing
this toward AWS.
