# Flat Universe — Cloudflare Refactor Roadmap

Target: move off the ~$50/mo multi-vendor stack onto Cloudflare, rebuild the service
layer on Effect, replace Next.js with TanStack Start, and fix the functional bugs found
in the review along the way.

**Cost target: $5/month** (Workers Paid) + ~$0.50/month OpenAI + one-time ~$1 backfill.

---

## 1. Target stack

| Concern          | Today                            | Target                                                                                  | Why                                                                                         |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Host / runtime   | Vercel + Next 14                 | **Cloudflare Workers** (Paid, $5/mo)                                                    | One bill, one runtime, no per-service tiers                                                 |
| Frontend         | Next.js App Router (SSR)         | **TanStack Router + TanStack Query** SPA, Vite-built, served from Workers Static Assets | No framework runtime, no `use client`/`use server` split, typed routes + typed cache        |
| API              | Next route handlers              | **`effect/unstable/httpapi`** on the Worker `fetch` handler                             | Schema-native type-safe endpoints + derived client + OpenAPI, no second router (see §5)     |
| SEO / meta       | Next `metadata` + RSC            | **`run_worker_first` + HTMLRewriter** shell injection                                   | Recovers what dropping SSR costs (see §6)                                                   |
| IaC              | none (dashboard + `vercel.json`) | **Alchemy** (`alchemy.run.ts`)                                                          | "Infrastructure as Effects" — pure TS, built on Effect, so it shares the app's idiom        |
| Effects / DI     | ad-hoc `async/await`             | **Effect 4 (beta)**                                                                     | Typed errors, `Schedule` retries, `Layer` DI, `Schema` (replaces Zod). See §11 for why beta |
| Database         | Neon Postgres + Prisma           | **D1 + Drizzle**                                                                        | 10 GB on Paid, FTS5 built in, zero idle cost                                                |
| Full-text search | `ILIKE contains` (seq scan)      | **SQLite FTS5 + bm25**                                                                  | Fixes the single biggest Neon compute cost                                                  |
| Vectors          | Pinecone (~10M vectors)          | **Vectorize** (206k vectors)                                                            | ~$0.05/mo at abstract-level granularity                                                     |
| Background jobs  | Trigger.dev                      | **Cloudflare Workflows + Cron Triggers**                                                | Durable steps/retries/sleep, included in Workers Paid                                       |
| Cache            | Upstash Redis                    | **Workers KV** + Cache API                                                              | Free tier covers this workload                                                              |
| Object storage   | —                                | **R2**                                                                                  | Holds the bulk snapshot + NDJSON staging; no egress fees                                    |
| CDC              | Sequin + `sequin_events` table   | **deleted**                                                                             | The ingest step already knows the new IDs                                                   |
| LLM / embeddings | LlamaIndex + OpenAI direct       | **AI SDK v6** via **Cloudflare AI Gateway**                                             | Gateway gives caching, fallback, spend caps, observability                                  |
| Email            | Postmark                         | **Resend** (3k/mo free)                                                                 | Free at this volume                                                                         |
| PDF pipeline     | `unpdf` + per-paper crawl        | **deleted**                                                                             | See §3                                                                                      |

### Dropped outright

Trigger.dev · Sequin · Pinecone · Upstash · Neon · Postmark · Prisma · LlamaIndex ·
`@llamaindex/edge` · `unpdf` · Next.js · Vercel · the `link` + `article_metadata_to_link`

- `sequin_events` tables · `POST /api/embeddings/[id]` · the on-demand summary route ·
  `scripts/pinecone-*-migration.ts`.

### On Mastra — recommend _against_, for now

Mastra is a genuinely good TypeScript agent framework (agents, memory, graph workflows,
RAG, evals, a Cloudflare deployer) and Mastra v1 landed in January 2026. It is the wrong
fit here:

- **The app needs one retrieval + one streaming completion.** Mastra's value is agents,
  memory and evals — none of which this product has.
- **It duplicates Cloudflare Workflows.** Running Mastra's workflow engine next to CF
  Workflows means two durable-execution models in one Worker.
- **Deployment conflict.** `CloudflareDeployer` generates and owns `wrangler.jsonc`,
  which fights TanStack Start's Vite plugin and Alchemy both wanting to own the same
  Worker config.
- **It reverses the goal.** This refactor is about deleting dependencies, not swapping
  LlamaIndex for a bigger framework.

Use **AI SDK v6** (`embedMany`, `streamText`) directly through AI Gateway. Revisit Mastra
only if the roadmap grows a multi-step research agent — at that point memory + evals start
earning their keep, and it can be added as an isolated Worker without touching the rest.

### Risk notes on the chosen pieces

- **Alchemy is beta.** Mitigation: it drives the plain Cloudflare APIs, so a `wrangler.jsonc`
  escape hatch always exists. If beta is unacceptable, the fallback is the OpenTofu/Terraform
  Cloudflare provider — but you lose the Effect alignment, which is most of the point.
- **Dropping SSR is the one real regression in this plan.** This is a 206k-page content site
  whose entire value is being findable. §6 is not optional polish — treat it as load-bearing.
- **D1 caps at 10 GB, hard.** The 2024+ slice is ~620 MB, fine. The _full_ 2.6M-paper arXiv
  corpus lands around 5–7 GB with FTS — feasible but close. If you ever go full-corpus, shard
  by year across databases or move to Hyperdrive + external Postgres. Decide the scope in
  Phase 0 and don't drift.
- **D1 export doesn't support virtual tables.** Drop `article_fts`, export, recreate.
- **Vectorize:** max 1536 dims, 10M vectors/index, topK ≤ 50 with metadata, max 10 metadata
  indexes. All comfortably within budget at one vector per paper.

---

## 2. Data model (Cloudflare / D1 track)

> On the AWS track this section is replaced by the DynamoDB model in **A.1**. Everything
> else in the plan is shared.

The current schema is Postgres-shaped for a workload that is read-only, derived, public
data. Everything below is a rewrite, not a migration.

```sql
-- arXiv id IS the natural key. Delete the uuid PKs entirely.
CREATE TABLE article (
  id               TEXT PRIMARY KEY,        -- '2402.04878'
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  abstract         TEXT NOT NULL,
  comment          TEXT,
  doi              TEXT,
  journal_ref      TEXT,
  published_ts     INTEGER NOT NULL,        -- epoch ms
  updated_ts       INTEGER NOT NULL,
  primary_category TEXT NOT NULL,
  categories       TEXT NOT NULL,           -- JSON array, denormalised for the read path
  authors          TEXT NOT NULL,           -- JSON array, denormalised for the read path
  embedded_at      INTEGER                  -- NULL = not yet in Vectorize
);
CREATE INDEX article_published_idx ON article(published_ts DESC);
CREATE UNIQUE INDEX article_slug_idx ON article(slug);

-- normalised only for the faceted filters
CREATE TABLE author         (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE article_author (article_id TEXT, author_id INTEGER, PRIMARY KEY (article_id, author_id));
CREATE TABLE category       (short_name TEXT PRIMARY KEY, full_name TEXT, group_name TEXT);
CREATE TABLE article_category (article_id TEXT, short_name TEXT, is_primary INTEGER,
                               PRIMARY KEY (article_id, short_name));
CREATE INDEX article_category_cat_idx ON article_category(short_name, article_id);

CREATE VIRTUAL TABLE article_fts USING fts5(
  title, abstract, content='article', content_rowid='rowid', tokenize='porter unicode61'
);
```

Key deletions and why:

- **`link` + `article_metadata_to_link` gone** (134 MB of the dump). Both URLs are pure
  functions of the id: `arxiv.org/abs/{id}`, `arxiv.org/pdf/{id}`. Derive in a helper.
- **UUID-as-`text` PKs gone.** They cost 37 bytes each across ~4M join rows.
- **Join-table surrogate `id` + `created_at` + `updated_at` gone.** Nothing read them.
- **`sequin_events` gone.**
- **Dates as epoch-ms integers** — matches the Vectorize metadata type, kills the
  `Date`/number coercion bugs.

Vectorize records: **one vector per paper**, id = arXiv id, metadata
`{ publishedTs: number, primaryCategory: string }` with metadata indexes on both.

Estimated D1 size for the 206k-paper 2024+ slice: **~620 MB** (320 MB rows + ~250 MB FTS +
indexes). Down from ~2.5 GB on Neon.

---

## 3. Ingest: no more per-paper PDF crawling

Three facts settle this:

1. arXiv states _"do not attempt to download the complete corpus programmatically"_ and the
   default arXiv licence grants no redistribution rights.
2. The S3 requester-pays corpus is **9.2 TB** (PDFs + source) — roughly **$830** in egress
   to pull once. Not a hobby-project number.
3. **The PDF text was never used.** Chunk text was never stored in Pinecone; the chat prompt
   is built from title + abstract out of Postgres. Full-PDF embedding bought nothing.

So the new pipeline never touches a PDF.

**One source, not two.** The earlier draft of this plan used the Kaggle snapshot for bulk
backfill plus OAI-PMH to fill the gap after its cutoff. Measured against the live endpoint,
that split isn't worth it for a 2024+ window: OAI-PMH delivers ~1,200 records per day-window
and the whole backfill runs in ~10 hours, resumable. One parser serves both backfill and
nightly delta instead of two code paths with a cutoff seam between them. Revisit the snapshot
only if the corpus widens to the full 2.6M papers.

**Backfill and delta (same code).** OAI-PMH `ListRecords` against
`https://oaipmh.arxiv.org/oai` — **note the base URL change**; `lib/oai-pmh/index.ts:4`
still points at the deprecated `export.arxiv.org/oai2` (currently 302s, don't rely on it).
`metadataPrefix=arXiv`, one-day windows, resumption tokens followed within a window.

**Three measured facts drove the design** (details and numbers in
`packages/core/README.md`):

1. **`from`/`until` filter on last-modified, not publication date.** A 2024-01-01 window
   returned 1,218 records of which only 162 were _published_ in 2024. The legacy dump agrees:
   25% of its articles predate 2024. Filtering on `publishedAt` after harvest is mandatory,
   not optional.
2. **Resumption tokens expire at the next UTC midnight** — shorter than a full backfill, so a
   single token chain cannot finish. Day windows are independently retryable and checkpoint as
   one date.
3. **Page size is ~1,300 records regardless of window width.** Widening the window buys
   nothing; it just moves work behind more tokens.

**Embedding.** `title + "\n\n" + abstract` → `text-embedding-3-small` (1536 dims) via
`embedMany`, batched 512 at a time, through AI Gateway.

Measured over a live seven-day harvest: **407 articles per calendar day** (weekdays run
466–752; arXiv announces nothing at the weekend), averaging 1,582 bytes of JSON and 1,192
chars ≈ 300 tokens of embeddable text. A 2024-01-01 → today harvest is therefore
**~385,000 articles / ~610 MB**.

|                                 | Tokens    | Cost                               |
| ------------------------------- | --------- | ---------------------------------- |
| Backfill, ~385k abstracts       | ~115M     | **$2.31** ($1.16 on the Batch API) |
| Ongoing, ~400/day               | ~120k/day | **~$0.07/month**                   |
| _(old: full PDFs, 206k papers)_ | _~8.2B_   | _~$165 + 10M vectors_              |

An earlier draft of this plan said 1.15M articles and 1.8 GB. That came from a probe using a
_two-day_ window, which double-counted, and it ignored empty weekends. **D1's 10 GB ceiling is
consequently not a concern** — at ~610 MB there is comfortable headroom even with an FTS
index, which removes the main technical argument that was pushing this toward AWS.

If full text is ever genuinely needed, do it **on demand for an allow-listed handful**,
cache the extraction in R2, and never for the whole corpus.

---

## 4. Effect service layer

Every I/O boundary becomes a service with typed errors and a `Layer`. Sketch:

```ts
// src/services/arxiv.ts
export class ArxivError extends Data.TaggedError('ArxivError')<{ cause: unknown; }> {}

export class Arxiv extends Effect.Service<Arxiv>()('Arxiv', {
  effect: Effect.gen(function*() {
    const http = yield* HttpClient.HttpClient;

    const listRecords = (from: string, token?: Option.Option<string>) =>
      http.get(buildOaiUrl(from, token)).pipe(
        Effect.flatMap((r) => r.text),
        Effect.flatMap(Schema.decodeUnknown(OaiListRecords)), // replaces the Zod schema
        Effect.retry(
          Schedule.exponential('1 seconds', 2).pipe(
            Schedule.jittered,
            Schedule.compose(Schedule.recurs(5)),
            Schedule.whileInput((e: ArxivError) => isRetryable(e)), // replaces getRetrySeconds()
          ),
        ),
        Effect.mapError((cause) => new ArxivError({ cause })),
      );

    return { listRecords } as const;
  }),
}) {}
```

What this replaces:

- `lib/oai-pmh/schema.ts` Zod chain → `Schema` with the same `transform` shape.
- `getRetrySeconds()` + `retry.onThrow` in `sync-metadata.ts` → `Schedule` combinators.
- Every silent `catch { throw }` → tagged errors in the type signature.
- `Promise.all` fan-outs → `Effect.forEach(..., { concurrency: n })` with real backpressure.

Services to build: `Arxiv`, `ArticleRepo` (D1/Drizzle), `VectorRepo` (Vectorize), `Embedder`
(AI SDK), `Cache` (KV), `Mailer` (Resend). Drizzle handles schema + migrations
(`drizzle-kit`); wrap its promises in `Effect.tryPromise` inside `ArticleRepo` so the rest of
the app never sees a raw promise. (`@effect/sql-d1` exists if you want the purist route —
it's less mature and gives up drizzle-kit migrations.)

**This service boundary is what keeps the platform decision reversible.** Callers depend on
`ArticleRepo`, never on Drizzle. On the AWS/DynamoDB track the internals become ElectroDB +
`effect/Schema` and nothing else in the codebase changes — see **A.2**.

Workflow steps stay thin: each `step.do()` runs `Effect.runPromise(program)`. Keep Effect
_inside_ steps, not across them — CF Workflows owns durability.

---

## 5. API layer — type-safe endpoints

You asked for tRPC "or similar." Given Effect is already the service layer, **HttpApi is the
better fit than bolting tRPC on top**, and it delivers exactly the same guarantee: define once,
get a type-safe client for free.

In Effect 4 this lives at `effect/unstable/httpapi` **inside the core package** — `HttpApi`,
`HttpApiGroup`, `HttpApiEndpoint`, `HttpApiBuilder`, `HttpApiClient`, `OpenApi`, plus
`HttpApiSwagger` / `HttpApiScalar` for the docs UI. No separate `@effect/platform` dependency,
and therefore none of the cross-package version-alignment friction that Effect 3 has (`effect`
3.22 alongside `@effect/platform` 0.97).

### Why HttpApi over tRPC / oRPC / Hono RPC

|                   | HttpApi                          | tRPC v11                      | oRPC                       | Hono RPC     |
| ----------------- | -------------------------------- | ----------------------------- | -------------------------- | ------------ |
| Schema language   | `effect/Schema` — already in use | needs Zod / Standard Schema   | Standard Schema            | Zod/Valibot  |
| Client derivation | `HttpApiClient.make`             | `createTRPCClient`            | `createORPCClient`         | `hc<App>`    |
| OpenAPI + docs UI | built in                         | no                            | built in (its whole pitch) | via plugin   |
| Error model       | Effect tagged errors, end to end | `TRPCError` (separate model)  | separate model             | manual       |
| DI / context      | the `Layer`s you already have    | tRPC context (second model)   | second model               | Hono context |
| Cacheable GETs    | real REST semantics              | GET for queries, batched keys | yes in OpenAPI mode        | yes          |

Three concrete reasons:

1. **One schema language.** `effect/Schema` already parses OAI-PMH (§4). tRPC would make you
   carry a second validator and define request/response shapes twice.
2. **One error model.** HttpApi endpoints declare their failures as Schema-encoded tagged
   errors, so an `ArticleNotFound` from `ArticleRepo` surfaces as a typed 404 on the client
   with no translation layer. tRPC needs a `TRPCError` mapping shim at every boundary.
3. **Edge caching is a first-class concern here.** In a SPA every page view is an API call, so
   the CDN is doing the work SSR used to. Plain `GET /api/articles/:slug` with a long
   `s-maxage` is cached by Cloudflare for free and never wakes a Worker. RPC-over-POST throws
   that away; batched RPC URLs make cache keys nearly useless.

**Fallback:** if HttpApi's type-level ergonomics prove too heavy, **oRPC** is the pick — not
tRPC. It's OpenAPI-first, keeps real REST GETs, accepts `effect/Schema` via Standard Schema,
and runs on Workers. tRPC's advantage is its ecosystem and TanStack Query integration, and the
latter is ~30 lines you write yourself (below).

**Skip Hono.** With HttpApi producing a web handler and Static Assets handling the SPA, the
Worker entry is about 30 lines of `fetch` routing. Hono would add a dependency to solve a
problem you don't have.

### Shape

```ts
// api/articles.ts — the contract, shared by server and client
export class ArticleNotFound extends Schema.TaggedError<ArticleNotFound>()(
  'ArticleNotFound',
  { slug: Schema.String },
) {}

export const ArticlesGroup = HttpApiGroup
  .make('articles')
  .add(
    HttpApiEndpoint
      .get('bySlug', '/articles/:slug')
      .setPath(Schema.Struct({ slug: Schema.String }))
      .addSuccess(Article)
      .addError(ArticleNotFound, { status: 404 }),
  )
  .add(
    HttpApiEndpoint
      .get('search', '/articles')
      .setUrlParams(ArticleSearchParams) // categories, authors, from, to, q, cursor
      .addSuccess(
        Schema.Struct({ items: Schema.Array(Article), nextCursor: Schema.NullOr(Schema.String) }),
      ),
  )
  .add(
    HttpApiEndpoint.get('similar', '/articles/:slug/similar').addSuccess(
      Schema.Array(ScoredArticle),
    ),
  );

export const Api = HttpApi.make('flatuniverse').add(ArticlesGroup).add(ChatGroup);
```

```ts
// worker.ts
const apiHandler = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, ArticleRepo.Default, VectorRepo.Default, Embedder.Default),
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return apiHandler(request);
    return renderShell(request, env, ctx); // §6
  },
} satisfies ExportedHandler<Env>;
```

```ts
// client/queries.ts — the ~30 lines that replace tRPC's TanStack Query integration
const client = await HttpApiClient.make(Api, { baseUrl: '/api' });

export const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ['article', slug],
    queryFn: () => Effect.runPromise(client.articles.bySlug({ path: { slug } })),
  });
```

The client is derived from the same `Api` value the server implements, so a renamed field or a
changed param is a compile error on both sides. OpenAPI + a `/api/docs` UI come free, which is
also how you'd expose a public API later.

**Streaming chat** does not go through HttpApi — keep `POST /api/chat/:slug/completion` as a
raw handler returning the AI SDK v6 stream response.

---

## 6. Frontend + the SEO problem

### What dropping SSR costs

A SPA ships an empty shell. For a site whose entire product is 206k indexable article pages
plus social unfurls, that is a real regression — Google renders JS but slowly and unreliably at
that scale, and Slack/X/LinkedIn unfurlers don't render JS at all. The current app has
`app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` and per-page metadata (your most
recent commit is literally `feat: page metadata`). Don't throw that away.

### The fix: worker-first shell injection

Cloudflare's documented SPA pattern covers this exactly — no SSR framework required.

```jsonc
// assets config
{
  "assets": {
    "directory": "./dist/",
    "not_found_handling": "single-page-application",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*", "/articles/*", "/sitemap*.xml", "/robots.txt", "/og/*"]
  }
}
```

`not_found_handling: "single-page-application"` serves `index.html` for client-side routes.
`run_worker_first` forces article URLs through the Worker — necessary, because with compat date
2025-04-01+ navigation requests otherwise bypass the Worker to save billable invocations. Every
other route keeps that optimisation.

`renderShell` then fetches the article from D1 (KV-cached), streams `index.html` out of
`ASSETS`, and uses **HTMLRewriter** to inject, at constant memory:

- `<title>`, `<meta name="description">`, `<link rel="canonical">`
- Open Graph + Twitter card tags → correct unfurls
- JSON-LD `ScholarlyArticle` (title, authors, abstract, `datePublished`, DOI, arXiv URL)
- `<script type="application/json" id="__BOOTSTRAP__">` holding the dehydrated TanStack Query
  state, so the SPA hydrates the article without a second round-trip

Net effect: crawlers and unfurlers get complete HTML metadata, users get a SPA that paints
immediately with data already inlined. The response is CDN-cacheable per URL.

**Sitemaps:** 206k URLs exceeds the 50k-per-file limit — generate a sitemap index plus
paginated children from D1 on a cron, store in R2, serve from the Worker.
**OG images:** `workers-og` at `/og/:slug`, rendered once and cached in R2.

### Frontend build

- Vite + React 19 + **TanStack Router** (file-based routes, typed params/search) + **TanStack
  Query** (server cache, `queryOptions` factories from §5).
- Router `loader`s call `queryClient.ensureQueryData(...)` so navigation prefetches through the
  same cache the shell bootstraps.
- Search/filter state lives in **typed search params** via TanStack Router's `validateSearch` —
  a direct upgrade on the current hand-rolled `lib/query-params.ts` + `useDebounce` toolbar.
- shadcn/Radix/Tailwind components port over largely untouched; swap `next/link`,
  `next/image`, `next/navigation` for TanStack equivalents.
- Zustand stores can likely go — TanStack Query owns server state, Router owns URL state.

---

## 7. Functional bugs — scheduled

From the review. Each is assigned to the phase that naturally covers it.

| #  | Bug                                                                                                                                 | Location                                                                     | Phase | Resolution                                                                                            |
| -- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| 1  | Temporal filter keys on `timestamp`, ingest writes `published` → newly-ingested vectors are invisible to chat retrieval             | `lib/chat/suggestion.server.ts:59`                                           | 5     | One canonical `publishedTs` written at ingest, with a Vectorize metadata index. Schema-enforced.      |
| 2  | Node is re-split, all sub-chunk embeddings but `[0]` discarded → stored vector covers a fraction of the chunk                       | `lib/file-handlers/pdf.ts:94-105`                                            | 3     | Dead — one embedding per paper, no chunking.                                                          |
| 3  | "Similar articles" flattens and `.slice(0,3)`, throwing away all scores; fans out 50–100 Pinecone reads per page                    | `lib/article-metadata/similarity.server.ts:17,70`                            | 4     | `getByIds([id])` → one `query(topK: 4)` → drop self → 3 scored results. One query.                    |
| 4  | `POST /api/embeddings/[id]` and `GET /api/articles/[id]/summary` are unauthenticated and each spends OpenAI money per call          | `app/api/embeddings/[id]/route.ts`, `app/api/articles/[id]/summary/route.ts` | 6     | Both routes deleted. Nothing user-triggered spends on embeddings any more.                            |
| 5  | `metadata_id` vs `metadataId` drift; the similarity filter only knows `metadataId`, so a paper can be returned as similar to itself | `similarity.server.ts`, `ranking.server.ts:6`, `chat.server.ts:84`           | 4     | Vector id _is_ the arXiv id; self-exclusion is `id !== self`. Drift impossible.                       |
| 6  | Hand-rolled Pinecone upserts vs LlamaIndex `PineconeVectorStore` reads — retrieved nodes carry no text                              | `lib/vector-store/actions.ts:40`, `suggestion.server.ts:95`                  | 5     | One `VectorRepo`. Retrieval returns ids + scores; text comes from D1 by id. Explicit, not accidental. |
| 7  | Search is `ILIKE contains` on title **and** abstract plus a `count()` on the same predicate — double seq scan over 206k rows        | `lib/article-metadata/metadata.server.ts:352-355`                            | 4     | FTS5 + bm25, single query with a windowed count.                                                      |
| 8  | Deprecated OAI base URL                                                                                                             | `lib/oai-pmh/index.ts:4`                                                     | 3     | `https://oaipmh.arxiv.org/oai`.                                                                       |
| 9  | Hardcoded `minimumDate = '2024-01-01'`                                                                                              | `trigger/research-sync/parse-metadata.ts:5`                                  | 3     | Config binding.                                                                                       |
| 10 | Multi-MB XML passed as a job payload between tasks                                                                                  | `trigger/research-sync/sync-metadata.ts:88`                                  | 3     | Parse inline inside one `step.do()`; only ids cross step boundaries.                                  |
| 11 | Everything is commented out (scheduler, newsletter, AI fan-out, summary panel)                                                      | 4 files                                                                      | 7     | Re-enabled as cron-triggered Workflows.                                                               |
| 12 | One spec file against a 6.6 KB jest config                                                                                          | `lib/redis/cacheable.spec.ts`                                                | all   | Vitest + `@effect/vitest`; every service gets a test layer.                                           |

---

## 8. Package targets

Pin exact versions with `npm view <pkg> version` at the time you start — these are the
target majors, not gospel minors.

| Package                             | From    | To                                                                                                       |
| ----------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `next`                              | 14.2.15 | **removed**                                                                                              |
| `@tanstack/react-router`            | —       | v1                                                                                                       |
| `@tanstack/react-query`             | —       | v5                                                                                                       |
| `react` / `react-dom`               | 18      | **19**                                                                                                   |
| `vite` + `@cloudflare/vite-plugin`  | —       | latest                                                                                                   |
| `effect`                            | —       | **4.0.0-beta.102**, pinned exactly (see §11)                                                             |
| `@effect/platform`                  | —       | **not needed** — HttpApi is in core at `effect/unstable/httpapi`                                         |
| `workers-og`                        | —       | latest (OG images)                                                                                       |
| _(fallback if HttpApi is rejected)_ | —       | `@orpc/server` + `@orpc/client` + `@orpc/tanstack-query`                                                 |
| `alchemy`                           | —       | latest beta                                                                                              |
| `wrangler`                          | —       | v4                                                                                                       |
| `drizzle-orm` + `drizzle-kit`       | —       | latest                                                                                                   |
| `ai`                                | ^3.4.31 | **v6** (`LlamaIndexAdapter`/`StreamData` are v3-only and gone in v5+ — forced rewrite of the chat route) |
| `@ai-sdk/openai`                    | —       | v6-compatible                                                                                            |
| `zod`                               | ^3.23.8 | **removed** → `effect/Schema`                                                                            |
| `prisma` / `@prisma/client`         | 5.20    | **removed**                                                                                              |
| `llamaindex` / `@llamaindex/*`      | 0.8.x   | **removed**                                                                                              |
| `@pinecone-database/pinecone`       | ^4      | **removed**                                                                                              |
| `@trigger.dev/*`                    | 3.2.1   | **removed**                                                                                              |
| `@upstash/redis`                    | ^1.31   | **removed**                                                                                              |
| `postmark`                          | ^4      | **removed** → `resend`                                                                                   |
| `unpdf`                             | ^0.12   | **removed**                                                                                              |
| `tiktoken`                          | ^1.0.17 | **removed**                                                                                              |
| `@neondatabase/serverless`          | ^0.9    | **removed**                                                                                              |
| `jest` + `ts-node`                  | 29      | **removed** → `vitest`, `@effect/vitest`                                                                 |
| `typescript`                        | 5.6     | **7.x** — the native Go compiler; typechecks `core` in 0.14s against 1.8s on 5.x                         |
| `eslint` + `eslint-config-next`     | 8.57    | **removed** → `oxlint` (Rust; lints the whole repo in milliseconds)                                      |
| Prettier                            | —       | **`dprint`** (Rust, wasm plugins for TypeScript / JSON / Markdown)                                       |
| shadcn/Radix/Tailwind               | v3      | keep; Tailwind v4 migration optional, do it separately                                                   |

---

## 9. Phases

Estimates assume evenings-and-weekends pace.

### Phase 0 — Decide and spike · ~3 days

- Lock the **corpus window**: 2024+ (~620 MB, comfortable) or full 2.6M (~5–7 GB, near the
  D1 ceiling). This decision constrains everything downstream.
- **Spike HttpApi end to end** — one endpoint, one derived client call, deployed. This is the
  single highest-risk choice in the plan; if the ergonomics don't land, fall back to oRPC now,
  not in Phase 5.
- Verify Alchemy beta covers Workers + Static Assets + D1 + R2 + KV + Vectorize + Workflows +
  Cron + AI Gateway bindings. Anything it misses stays in `wrangler.jsonc`.
- **Exit:** a Worker deployed by `alchemy.run.ts` serving a Vite SPA shell plus one typed
  endpoint reading a row from D1.

### Phase 1 — Data model + backfill artifacts · ~1 week

- Drizzle schema per §2 + `drizzle-kit` migrations + FTS5 triggers.
- Seed `category` from the existing `lib/article-metadata/categories.ts` (~150 rows — keep it,
  it's good work).
- Local script: Kaggle snapshot → filtered NDJSON → R2. Also handles the existing
  `flatuniverse_data/*.csv` as a cross-check on row counts.
- **Exit:** D1 populated locally, FTS5 query returns bm25-ranked results, size measured
  against the 10 GB ceiling.

### Phase 2 — Infrastructure as code · ~3 days

- `alchemy.run.ts`: Worker + Static Assets binding, D1, Vectorize index (1536 dims, cosine,
  metadata indexes on `publishedTs` + `primaryCategory`), R2 bucket, KV namespace, Workflow
  bindings, cron triggers, AI Gateway, secrets.
- Assets routing: `not_found_handling: "single-page-application"` +
  `run_worker_first` for `/api/*`, `/articles/*`, sitemaps, `/og/*`.
- Two stages: `dev` and `prod`.
- **Exit:** `alchemy deploy --stage prod` stands up the whole account from scratch.

### Phase 3 — Effect services + ingest Workflow · ~1.5 weeks

**Fixes bugs 2, 8, 9, 10.**

- `Arxiv`, `ArticleRepo`, `VectorRepo`, `Embedder`, `Cache` services + `Layer`s + test layers.
- `BackfillWorkflow`: R2 NDJSON → batched D1 insert → batched Vectorize upsert.
- `DeltaWorkflow`: nightly cron → OAI-PMH pages → upsert → embed only rows with
  `embedded_at IS NULL`.
- **Exit:** 206k rows in D1, 206k vectors in Vectorize, nightly cron green, PDF code deleted.

### Phase 4 — API contract + search + similarity · ~1.5 weeks

**Fixes bugs 3, 5, 7.**

- Define the `HttpApi` contract (`articles`, `categories`, `authors`, `newsletter` groups) with
  `Schema` request/response/error types. This is the artifact both sides compile against.
- FTS5 + bm25 search with category/author/date facets and **keyset pagination** (drop
  `skip`/`take` offset paging while you're here — it's also a nicer cache key).
- Similar-papers: single Vectorize query, real scores, self-excluded by id.
- KV cache + `Cache-Control` / `s-maxage` per endpoint, so the CDN absorbs repeat reads. This
  matters more now than it did with SSR — in a SPA every page view is an API call.
- Port `redis.cacheableFunction` to Effect + KV (the wrapper is a good pattern, keep it).
- **Exit:** typed client calls a deployed endpoint; search p95 well under the old seq-scan;
  similar-papers is 1 vector query; `/api/docs` renders the OpenAPI UI.

### Phase 5 — RAG + chat · ~1 week

**Fixes bugs 1, 6.**

- Rewrite the chat route on AI SDK v6 `streamText` through AI Gateway, as a raw handler
  outside HttpApi (streaming responses don't belong in a Schema-typed endpoint). LlamaIndex out.
- Retrieval: `VectorRepo.query` (topK, optional `publishedTs` range filter) → hydrate from D1
  → prompt.
- **Port the temporal query analysis** — `lib/chat/query.server.ts` + `ranking.server.ts` are
  the most differentiated code in the repo. Rebuild them on `generateObject` +
  `effect/Schema`, and make sure the date filter keys on the field that ingest actually
  writes this time.
- Keep Turnstile on thread creation; add a KV-backed per-IP rate limit on completion.
- **Exit:** chat streams, temporal queries measurably filter, spend cap set in AI Gateway.

### Phase 6 — SPA frontend · ~1.5 weeks

**Fixes bug 4** (the two money-burning routes simply don't get ported).

- Vite + React 19 + TanStack Router routes: `/`, `/articles`, `/articles/$slug`, `/chat/$slug`,
  legal pages. Typed `validateSearch` for the filter toolbar.
- TanStack Query `queryOptions` factories over the derived HttpApi client; router `loader`s
  call `ensureQueryData`.
- Port shadcn/Radix components; swap `next/link`, `next/image`, `next/navigation`. Retire the
  Zustand stores where Query/Router now own the state.
- **Exit:** feature parity with the live-as-of-2024 site on a `*.workers.dev` URL.

### Phase 6b — SEO recovery · ~4 days · **do not skip**

- `renderShell` + HTMLRewriter: title, description, canonical, OG/Twitter, JSON-LD
  `ScholarlyArticle`, and the `__BOOTSTRAP__` dehydrated-Query payload.
- Sitemap index + paginated sitemaps generated on cron into R2; `robots.txt`.
- `/og/:slug` via `workers-og`, cached in R2.
- **Exit:** `curl` of an article URL returns full metadata with JS disabled; Google Rich
  Results test and a Slack unfurl both pass.

### Phase 7 — Newsletter + cutover · ~3 days

**Fixes bug 11.**

- Weekly digest as a cron Workflow → Resend batch send. Port `lib/newsletter/templates.ts`.
- Migrate `email_subscription` rows from the dump.
- Point `flatuniverse.app` at the Worker, verify, and delete the Neon / Pinecone / Trigger.dev
  / Upstash / Postmark / Sequin / Vercel accounts.
- **Exit:** one $5 invoice.

**Total: ~7–8 weeks of evenings.**

---

## 10. Sequencing advice

Phases 1 and 4 are the ones that actually pay the bills — schema slimming and killing the
seq-scan search. If you want a fast partial win before committing to the full rewrite, they
also work standing up against the current Neon database.

Everything in Phase 1 can be done offline against `flatuniverse_data/` before you spend a
cent, and the Phase 3 embedding backfill costs about $1.

Do **not** interleave the Tailwind v4 migration with this. It's unrelated churn and it will
make Phase 6 diffs unreadable.

---

## 11. Why Effect 4 beta

Decided in Phase 1 and already applied to `packages/core`. Pinned to
`4.0.0-beta.102` — exactly, not with a range.

**The ecosystem forced it, and it happens to be the right call anyway.** The two
Effect-native packages this plan depends on are v4-only:

| Package                                         | Effect peer range               |
| ----------------------------------------------- | ------------------------------- |
| `alchemy@next` (2.0.0-beta)                     | `>=4.0.0-beta.100 \|\| >=4.0.0` |
| `@effect-aws/client-dynamodb@beta` (2.0.0-beta) | `>=4.0.0 <5.0.0`                |
| `@effect-aws/client-dynamodb@latest` (1.x)      | `>=3.0.4 <4.0.0`                |

Note `alchemy@latest` (0.94) declares **no** `effect` peer at all — the "Infrastructure as
Effects" Alchemy from §1 _is_ the 2.0 line, and that line is Effect 4 only. Staying on Effect 3
would mean giving up the single biggest reason Alchemy was chosen over Terraform or SST.

Three further reasons:

1. **The consolidation suits this stack.** v4 folds the ecosystem into core under `unstable/` —
   `httpapi`, `http`, `sql`, `cli`, `ai`, `workflow`, `rpc`. Phase 5's API layer needs no
   `@effect/platform`, and the chronic v3 annoyance of aligning `effect@3.22` with
   `@effect/platform@0.97` disappears.
2. **Migration cost is lowest now.** Porting Phase 1 was **22 errors across ~350 lines**. The
   same migration after Phases 3–6 would span the whole codebase.
3. **beta.102** is deep into stabilisation, not an early preview.

### What changed, for reference

| Effect 3                           | Effect 4                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `Either`                           | `Result` — `isFailure`/`isSuccess`, `.failure`/`.success`, `fail`/`succeed` |
| `Either.mapLeft`                   | `Result.mapError`                                                           |
| `Schema.filter(pred, ann)`         | `Schema.check(Schema.makeFilter(pred, ann))`                                |
| `Schema.decodeUnknownEither`       | `Schema.decodeUnknownResult`                                                |
| `Schema.decodeUnknown`             | `Schema.decodeUnknownEffect`                                                |
| `Schema.NonEmptyTrimmedString`     | `Schema.NonEmptyString` (trim separately)                                   |
| `Schema.Number.pipe(Schema.int())` | `Schema.Int`                                                                |
| `Data.TaggedError`                 | unchanged                                                                   |

A filter now returns `true` to pass or a `string` message to fail, rather than a bare boolean.

### Risks, stated plainly

- **`unstable/` means what it says.** HttpApi's API may still move, and Phase 5 leans on it
  heavily. Re-verify against installed `.d.ts` files at the start of that phase.
- **Docs, community examples and model training data are overwhelmingly v3.** Expect to check
  the shipped type definitions rather than trusting recall or a search result — that is how
  every API in the table above was confirmed.
- **Pin exactly.** 102 betas means the surface has moved a lot and may move again. Upgrade
  deliberately, never via a range.
- **Escape hatch:** the v3 equivalents are a mechanical reverse of the table above, and
  `packages/core` is small. If v4 stalls, reverting is roughly a day — but it would also mean
  dropping to Alchemy 0.94 and re-opening the IaC decision.

---

## Appendix A — The same thing on AWS

Priced because the goal here is partly _learning AWS_, including the AI half. The PDF-free
ingest (§3), Effect services (§4), HttpApi contract (§5), SPA + SEO shell (§6) and the bug list
(§7) all carry over unchanged. **§2's data model does not** — see A.1.

**Traffic model used throughout:** 30k page views/mo, ~150k API requests/mo (a SPA makes
~5 calls per view), 500 chat completions/mo, 2,500 papers/day ingested, 206k vectors
(1536 dims × 4 bytes = 1.27 GB), 2k newsletter emails/mo. `us-east-1`, on-demand.

### Design A — DynamoDB + S3 Vectors (recommended)

| Service                                   | Usage                                        | Cost/mo                                 |
| ----------------------------------------- | -------------------------------------------- | --------------------------------------- |
| CloudFront                                | well under 1 TB / 10M req                    | **$0** (always-free)                    |
| S3                                        | ~2.5 GB (SPA, snapshots, sitemaps, OG cache) | $0.06                                   |
| Lambda (Function URL, no API Gateway)     | 150k req, ~15k GB-s                          | **$0** (1M req + 400k GB-s always-free) |
| DynamoDB on-demand                        | 350 MB, 450k RRU, 75k WRU                    | $0.15 (25 GB storage always-free)       |
| S3 Vectors                                | 1.27 GB stored, 150k queries                 | $0.90                                   |
| Step Functions                            | ~3k transitions                              | $0 (4k free)                            |
| EventBridge Scheduler                     | 30 invocations                               | $0                                      |
| SES                                       | 2k emails                                    | $0.20                                   |
| Bedrock — Titan Embed v2                  | 22M tokens @ $0.02/M                         | $0.44                                   |
| Bedrock — Claude Haiku 4.5                | 2M in / 0.3M out @ $1/$5                     | $3.50                                   |
| CloudWatch Logs                           | 1 GB, 7-day retention                        | $0.60                                   |
| Route 53                                  | 1 hosted zone                                | $0.60                                   |
| SSM Parameter Store (not Secrets Manager) | 2 params                                     | $0                                      |
| **Total**                                 |                                              | **≈ $6.50/mo**                          |

Essentially the same as Cloudflare, because CloudFront's 1 TB and Lambda's 1M requests are
permanently free and **S3 Vectors is astonishingly cheap** — $0.06/GB-month storage,
$2.50/M queries, GA since January 2026.

**The catch: no bm25 keyword search.** DynamoDB can't do `title CONTAINS x`. Three ways out:

1. **Accept it — and this may be the better product.** Faceted browse maps perfectly onto
   GSIs (`PK=category, SK=publishedTs` gives category + date-sorted listing for free), and
   _semantic_ search over abstracts is arguably a better fit for research papers than keyword
   matching. This is the option I'd take.
2. **SQLite FTS5 file in S3**, read by Lambda over HTTP range requests (the `sql.js-httpvfs`
   pattern) so you fetch a few KB of index pages per query instead of the whole file. ~$0/mo,
   genuinely interesting, bespoke. The corpus is read-only and rebuilt nightly, which is
   exactly the shape this trick wants.
3. **A small RDS instance just for FTS** — +$14/mo. Defeats the point.

**Do not reach for OpenSearch Serverless here.** NextGen (GA May 2026) finally removed the
2-OCU / ~$350-a-month idle floor and scales to zero — but the idle timeout is **10 minutes**.
A hobby site with a thin trickle of traffic spread across the day keeps it awake ~10 h/day,
which at $0.24/OCU-hour lands around **$70–150/mo**. Scale-to-zero rewards rare bursts, not
steady drizzle. This is a genuinely counterintuitive trap.

### A.1 — DynamoDB data model

If you take Design A, **§2 is void**. DynamoDB is designed from access patterns backwards, not
from entities forwards, so this is a genuine redesign rather than a port.

#### Access patterns (derived from the existing code)

| #  | Pattern                                     | Source                           |
| -- | ------------------------------------------- | -------------------------------- |
| 1  | Article by slug                             | `/articles/[slug]`, SEO shell    |
| 2  | Articles by category + date desc, paginated | toolbar, `searchArticleMetadata` |
| 3  | Articles by author + date desc              | toolbar                          |
| 4  | Latest articles, date desc                  | homepage feed                    |
| 5  | Batch fetch articles by id                  | similar-papers + chat hydration  |
| 6  | Author name prefix autocomplete             | `/api/authors/search`            |
| 7  | Top authors by article count                | `authors.server.ts:13` `groupBy` |
| 8  | Thread + all messages + suggestions by slug | `thread.server.ts:61`            |
| 9  | Thread history, recent first                | `getThreads`                     |
| 10 | Subscribers by list                         | newsletter send                  |
| 11 | Upsert article if newer                     | ingest                           |
| 12 | Find articles missing embeddings            | ingest                           |

#### Three tables, not one

Single-table orthodoxy is cargo cult when applied blindly. It earns its keep when one query
must return heterogeneous items — which here is true of **chat only**. Articles need
article-shaped GSIs, and overloading them with chat items just inflates index projections.
DynamoDB bills per request, not per table, so extra tables are free.

**Table `articles`** — PK `pk`, SK `sk`.

| Item                | pk            | sk                 | Notes                                                                |
| ------------------- | ------------- | ------------------ | -------------------------------------------------------------------- |
| Article             | `A#{arxivId}` | `META`             | title, abstract, authors[], categories[], `publishedTs`, `updatedTs` |
| Category membership | `A#{arxivId}` | `CAT#{shortName}`  | ~2.5 per article                                                     |
| Author membership   | `A#{arxivId}` | `AUT#{authorSlug}` | ~5 per article                                                       |

| Index             | PK                 | SK                          | Projection                       | Serves |
| ----------------- | ------------------ | --------------------------- | -------------------------------- | ------ |
| `GSI1`            | `CAT#{shortName}`  | `{publishedTs13}#{arxivId}` | title, slug, authors, categories | 2      |
| `GSI2`            | `AUT#{authorSlug}` | `{publishedTs13}#{arxivId}` | same                             | 3      |
| `GSI3`            | `FEED#{YYYY-MM}`   | `{publishedTs13}#{arxivId}` | same                             | 4      |
| `GSI4` _(sparse)_ | `PENDING_EMBED`    | `{arxivId}`                 | keys only                        | 12     |

**Table `chat`** — this is where single-table pays.

| Item       | pk         | sk              |
| ---------- | ---------- | --------------- |
| Thread     | `T#{slug}` | `META`          |
| Message    | `T#{slug}` | `MSG#{ulid}`    |
| Suggestion | `T#{slug}` | `SUG#{arxivId}` |

One `Query` on `pk = T#{slug}` returns the thread, every message in chronological order, and
its suggested articles — replacing the three-way Prisma join in `thread.server.ts:61` with a
single request. `GSI1: THREADS / {createdTs}` serves history.

**Table `subscriptions`** — `pk = LIST#{emailList}`, `sk = {email}`. Query for the send,
`GetItem` for the dedupe check. Trivially small.

#### Seven decisions worth understanding

1. **Put the arXiv id in the slug** — `shape-biased-texture-agnostic…-2402.04878`. The route
   parses the id off the end, so pattern 1 becomes a direct `GetItem` with **no slug GSI and no
   extra round-trip on the hottest path**. It also fixes a latent bug: today `slug` is a bare
   `slugify(title)` with no uniqueness constraint, and `_getArticleMetadataBySlug` uses
   `findFirst` — two papers sharing a title silently collide.
2. **Conditional writes replace the whole dedupe layer.** Pattern 11 is one
   `PutItem` with `ConditionExpression: attribute_not_exists(pk) OR updatedTs < :ts`. That
   deletes `findLatestMetadataByExternalIds`, its Redis cache, and the read-before-write
   round-trip in `addNewArticleMetadata` outright.
3. **The sparse GSI is a free work queue.** Write `gsi4pk = "PENDING_EMBED"` on insert, remove
   the attribute after embedding, and the item vanishes from `GSI4`. Pattern 12 becomes a
   `Query`. This is the idiomatic DynamoDB queue and a genuinely useful thing to have learned.
4. **Zero-pad `publishedTs` to 13 digits** in composite sort keys. Sort keys compare as
   strings, so unpadded epoch millis sort wrong the moment digit count changes. Classic gotcha.
5. **Project listing fields into GSI1–3.** Listing pages then need no `BatchGetItem`
   hydration at all — one `Query` renders the page. Costs ~200 MB of index storage, well worth
   it on a read-heavy site.
6. **Drop total counts; use cursor pagination.** DynamoDB has no cheap `COUNT`, and the current
   code runs a `count()` alongside every search — roughly half the search cost today. "Next
   page" instead of "page 7 of 412" is also just better for a feed. Pattern 7 (top authors)
   becomes an atomic `ADD` counter maintained at write time, recomputed nightly.
7. **Categories never go in DynamoDB.** ~150 static rows already exist in
   `lib/article-metadata/categories.ts` — ship them in the bundle. Zero requests, zero latency.
8. **TTL on anonymous chat threads.** A `ttl` attribute auto-deletes them after 30 days at no
   charge, which bounds the one table that would otherwise grow forever.

#### The real constraint: no index intersection

DynamoDB cannot intersect two indexes. "cs.LG **and** author Hinton **and** 2025" can't be one
query. The strategy is **query the most selective dimension, filter the rest in Lambda**:
author → `GSI2`, else category → `GSI1`, else `GSI3`; apply the remainder as a filter
expression, over-fetching a little.

Better: **push combined filtering to S3 Vectors**, which supports filterable metadata. Put
`primaryCategory` and `publishedTs` in the vector metadata and let semantic search handle
multi-dimensional queries, while DynamoDB handles clean single-axis browse. That division of
labour is cleaner than trying to make either one do both.

Be honest that this is a **downgrade in query flexibility**. On Postgres or D1, a new filter is
a new `WHERE` clause. On DynamoDB it's often a new GSI plus a backfill. That's an acceptable
trade for a product whose access patterns are known and stable — but it should be a decision,
not a discovery.

#### Sizing

|                         | Items | Size        |
| ----------------------- | ----- | ----------- |
| Articles (~1.7 KB each) | 206k  | 350 MB      |
| Category memberships    | 515k  | 77 MB       |
| Author memberships      | 1.03M | 155 MB      |
| GSI1–3 projections      | 1.75M | ~206 MB     |
| **Total**               |       | **~790 MB** |

Comfortably inside the **25 GB always-free** storage tier. Backfill writes ≈ 4M WRU ≈ **$2.50
one-time**; ongoing ≈ 750k WRU/month ≈ **$0.47**.

#### Should you actually use DynamoDB?

Straight answer: this workload — read-heavy, low-write, richly filtered — is textbook
relational, and DynamoDB is not the natural fit on technical merit alone. It wins here on two
other axes: **cost** (25 GB free, no idle charge, no VPC, no NAT Gateway) and **learning**
(single-table design, sparse GSIs, conditional writes and capacity modelling are among the more
valuable AWS skills you can pick up). Given both of your stated goals, that's a good trade —
just make it with open eyes.

If query flexibility later turns out to matter more than you expect, the fallback is Design B's
Postgres, and §2 comes back off the shelf unchanged.

### A.2 — Drizzle and `@effect/sql` on DynamoDB: no, but

**Neither works.** Both are SQL-only by design:

- **Drizzle** ships dialects for PostgreSQL, MySQL, SQLite, SingleStore, MSSQL and CockroachDB,
  plus serverless variants (D1, Turso, Neon, PlanetScale, Vercel, RDS Data API). There's an open
  discussion asking for DynamoDB; nothing has shipped, and nothing should — a query builder that
  emits SQL has no meaning against a key-value store. DynamoDB's PartiQL is a thin veneer that
  still obeys the same key constraints and offers no joins, and Drizzle has no PartiQL driver
  regardless.
- **`@effect/sql`** is the same story: drivers for pg, mysql2, sqlite-\*, mssql, clickhouse and
  d1. Its core abstractions — SQL fragments, transactions — don't map onto DynamoDB's API.

**This does not leak, by design.** §4 puts every I/O behind an `Effect.Service`. Whether
`ArticleRepo` internally calls Drizzle-on-D1, Drizzle-on-Postgres or ElectroDB-on-DynamoDB is
invisible to callers. That boundary is exactly why the platform decision can stay open until
Phase 0 — and why switching later is contained rather than viral.

The DynamoDB stack splits into three layers that Drizzle would otherwise have collapsed into one:

| Layer                 | Choice                                                                 | Role                                                      |
| --------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| Effect ↔ AWS SDK      | `@effect-aws/client-dynamodb@2` (beta — the v1 line peers on Effect 3) | SDK v3 commands as Effects, with Layers and tagged errors |
| Key / index modelling | **ElectroDB**                                                          | composite key templates, GSI mapping, entity isolation    |
| Validation            | **`effect/Schema`**                                                    | decode at the repo boundary; same schemas as HttpApi (§5) |

**On the SDK layer:** [`floydspace/effect-aws`](https://github.com/floydspace/effect-aws) is MIT,
actively maintained, and covers most AWS clients. If you'd rather not take the dependency,
wrapping `DynamoDBDocumentClient` yourself in `Effect.tryPromise` is roughly 40 lines and gives
you full control over the error channel.

**On the modelling layer:** ElectroDB is purpose-built for single-table design and its core
feature — composite key templating — maps directly onto A.1's `CAT#{shortName}` /
`{publishedTs13}#{arxivId}` shapes. It also **removes the zero-padding footgun by
construction**, which is worth the dependency on its own. `dynamodb-toolbox` v2 is the lighter
alternative (~64 kB, typed schemas, AWS SDK v3, GSI support) if ElectroDB's learning curve
feels like too much magic.

**One caution:** ElectroDB has its own attribute schema and validation system, which overlaps
with `effect/Schema`. Don't run both as sources of truth — that's precisely the duplication
we removed by dropping Zod. Let ElectroDB own **keys and indexes only**, keep its attribute
validation loose, and decode with `Schema` at the repo boundary so one definition still serves
parsing, persistence and the API contract.

### Design B — the mainstream stack (Postgres)

CloudFront + S3 + Lambda as above, but Postgres with `pgvector` **and** `tsvector` in one box —
the closest analogue to the Cloudflare D1 plan, and it lets you use §2 exactly as written and
skip A.1 entirely.

#### Is Postgres more expensive? Yes — and here's exactly why

Every Postgres option rents a machine that runs 24/7. DynamoDB and S3 Vectors charge **nothing
when idle**. For a hobby site that's busy maybe 5% of the day, that single structural
difference is the whole story — it isn't that Postgres is inefficient.

Database line item only, `us-east-1`, single-AZ, steady state:

| Option                                               | Compute | Storage         | VPC tax | **DB total** |
| ---------------------------------------------------- | ------- | --------------- | ------- | ------------ |
| **DynamoDB (Design A)**                              | $0      | $0 (25 GB free) | $0      | **$0.15**    |
| RDS `db.t4g.micro`, split-Lambda (below)             | $11.68  | $2.30           | $0      | **$13.98**   |
| EC2 `t4g.micro`, self-managed PG                     | $6.13   | $1.60           | $0      | **$7.73**    |
| RDS `db.t4g.micro` + 1-yr RI, no upfront (−29%)      | $8.29   | $2.30           | $0      | **$10.59**   |
| RDS `db.t4g.micro`, Lambda in VPC + Bedrock endpoint | $11.68  | $2.30           | $7.30   | **$21.28**   |
| RDS + NAT Gateway                                    | $11.68  | $2.30           | $32.00  | **$45.98**   |
| Aurora Serverless v2, min 0.5 ACU                    | $43.80  | $0.20           | —       | **$44.00+**  |

**App total: ≈ $6.50/mo on Design A vs ≈ $20/mo on Design B** (RDS + the ~$6 of Bedrock,
CloudWatch, Route 53 and S3 that both designs share). Call it a **$14/month delta** — still a
60% cut on the original $50 bill.

#### Killing the VPC tax

The $7.30 line is avoidable, and understanding how is itself worth learning. Lambda inside a
VPC can't reach Bedrock without a NAT Gateway ($32/mo idle) or an Interface Endpoint ($7.30/mo
per AZ). Gateway Endpoints for S3 and DynamoDB are free; Bedrock has no free option.

**So split the Lambdas along the VPC boundary:**

- **Browse / search / article Lambdas** → in the VPC. They only touch RDS. No endpoint needed.
- **Chat / embedding Lambdas** → outside the VPC. They touch Bedrock and S3 Vectors, both
  public APIs. When they need article metadata for hydration, they call your own public
  Function URL — which is just your API, not a workaround.

That's $0 of VPC tax and a clean separation. It's also a genuinely instructive exercise in why
the VPC boundary shapes serverless architecture on AWS.

The other route — making RDS publicly accessible and keeping every Lambda out of the VPC — also
costs $0, but Lambda has no stable egress IP, so the security group must allow `0.0.0.0/0` on
5432. Even with `rds.force_ssl` and IAM database auth, don't.

#### Aurora is not the escape hatch

Serverless v2 at the 0.5 ACU floor is $43.80/mo. With min 0 ACU it auto-pauses, but resume
takes ~15s — unusable on a web request path (fine for the ingest pipeline, not worth splitting
for). **Aurora DSQL is disqualified outright**: no extensions at all, so no `pgvector`, plus no
triggers and no enforced foreign keys.

#### What the extra ~$14/month buys

Worth weighing honestly rather than optimising blindly:

- **§2 works as written** — skip A.1's redesign entirely, probably 1–2 weeks less build time.
- **Arbitrary filter combinations.** The index-intersection constraint in A.1 disappears;
  "cs.LG and author X and 2025" is one `WHERE` clause.
- **bm25 keyword search stays**, via `tsvector` + GIN — no SQLite-in-S3 trick, no dropping to
  semantic-only.
- **One system** for metadata, full-text and vectors (`pgvector`), instead of DynamoDB +
  S3 Vectors.
- **A different, arguably more common, AWS skillset**: VPC, subnets, security groups, parameter
  groups, snapshots, IAM database auth. Nearly every enterprise runs RDS; far fewer run
  single-table DynamoDB.

#### A note on the RDS free tier

Sources still describe the legacy 12-month / 750-hour `db.t4g.micro` free tier, but the July
2025 restructure replaced it with the $200-credit / 6-month model for **new** accounts. Which
applies to you depends on when your account was created — **check your own Billing console
rather than planning around either**. And since this is meant to run indefinitely, model the
steady-state cost regardless; a 6- or 12-month promo just delays the question.

### Design C — Bedrock Knowledge Bases (managed RAG)

Worth a **learning spike**, not the production path. KB with S3 Vectors as the store gives you
managed chunking, ingestion sync, and `Retrieve` / `RetrieveAndGenerate`, and you'd learn the
Bedrock RAG surface properly. But `RetrieveAndGenerate` owns the prompt, and the temporal
query analysis + time-decay ranking is the most differentiated code in this product (§7 bug 1).
Build the KB to learn it, then ship direct `Retrieve` on S3 Vectors with your own prompt.

### IaC: use CDK

You asked for a CDK-like tool for Cloudflare and got Alchemy. On AWS, use **CDK v2** itself —
it's the AWS-native TypeScript option and the transferable skill. SST v3 has the nicer dev loop
(`sst dev` live Lambda) but sits on Pulumi over Terraform providers, so you learn SST rather
than AWS. For a project whose stated purpose is learning AWS, that abstraction works against
you. Note CDK and Effect coexist fine — CDK is build-time, Effect is runtime.

### Cost traps to configure on day one

1. **The Free Tier now closes your account.** Since July 2025 new accounts pick a Free or Paid
   plan, both starting with $100–200 in credits. **The Free plan auto-closes the account at
   6 months**, forfeiting unused credits. Choose **Paid**, spend the credits, set an AWS Budgets
   alert at $10.
2. **NAT Gateway** — $32/mo idle. Don't put Lambda in a VPC unless something forces it.
3. **CloudWatch Logs retention defaults to "never expire."** Set 7 days on every log group at
   creation time, in CDK, not later.
4. **Use Lambda Function URLs behind CloudFront**, not API Gateway — REST is $3.50/M requests,
   HTTP API $1/M, Function URL free.
5. **Never serve S3 directly** — front it with CloudFront for the 1 TB free egress.
6. **SSM Parameter Store, not Secrets Manager** ($0 vs $0.40/secret/mo).

### Is it a good thing to learn on?

Yes, and better than the Cloudflare version for that purpose. Design A exercises IAM, S3,
CloudFront, Lambda, DynamoDB single-table design, Step Functions, EventBridge, SES, Bedrock,
CDK, CloudWatch and Budgets — a broad, genuinely marketable slice. **IAM and CDK are the real
transferable skills**; Cloudflare has no equivalent because it's a deliberately simpler platform.

The honest trade: **Design A costs about the same as Cloudflare (~$6.50 vs ~$5) and teaches
far more.** Design B costs ~$20 — a $14/month premium for keeping SQL, arbitrary filters and
bm25 search, plus 1–2 weeks less build time because §2 stands as written.

Neither is wrong. Design A teaches the more distinctive skill (single-table modelling, sparse
GSIs, capacity thinking); Design B teaches the more commonly encountered one (VPC, security
groups, RDS operations). $14/month is a defensible price for the faster path and the
familiar mental model — spend it if the DynamoDB redesign in A.1 reads as a chore rather than
as the interesting part.

**Suggested split:** ship Design A, and treat Bedrock Knowledge Bases (Design C) and a
VPC/RDS variant (Design B) as separate weekend spikes you throw away afterwards.

---

## References

- [arXiv bulk data](https://info.arxiv.org/help/bulk_data.html) · [arXiv S3 (9.2 TB)](https://info.arxiv.org/help/bulk_data_s3.html) · [arXiv OAI-PMH](https://info.arxiv.org/help/oa/index.html)
- [Workers SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/) · [SPA shell with bootstrap data](https://developers.cloudflare.com/workers/examples/spa-shell) · [Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [oRPC v1](https://orpc.dev/blog/v1-announcement) · [tRPC vs oRPC vs Hono RPC](https://www.pkgpulse.com/guides/orpc-vs-trpc-vs-hono-rpc-type-safe-apis-2026) · [Hono vs tRPC vs oRPC](https://supastarter.dev/blog/hono-vs-trpc-vs-orpc-api-comparison)
- [Alchemy](https://alchemy.run/) · [Alchemy on GitHub](https://github.com/alchemy-run/alchemy) · [Cloudflare IaC options](https://developers.cloudflare.com/workers/platform/infrastructure-as-code/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) · [D1 SQL statements (FTS5)](https://developers.cloudflare.com/d1/sql-api/sql-statements/) · [Vectorize limits](https://developers.cloudflare.com/vectorize/platform/limits/) · [Workflows](https://developers.cloudflare.com/workflows/) · [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Mastra Cloudflare deployer](https://mastra.ai/docs/deployment/cloud-providers/cloudflare-deployer) · [Mastra in 2026](https://dev.to/gabrielanhaia/mastra-in-2026-what-it-is-when-to-use-it-and-how-it-compares-2go1)
- [AI SDK 5 migration](https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0) · [Embedding pricing](https://embeddingcost.com/openai)
- **AWS:** [S3 Vectors pricing](https://aws.amazon.com/s3/pricing/) · [S3 Vectors GA](https://www.infoq.com/news/2026/01/aws-s3-vectors-ga/) · [S3 Vectors + Bedrock KB](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-bedrock-kb.html) · [OpenSearch Serverless NextGen GA](https://aws.amazon.com/about-aws/whats-new/2026/05/amazon-opensearch-serverless-next-generation-generally-available/) · [OpenSearch pricing](https://aws.amazon.com/opensearch-service/pricing/) · [Bedrock pricing](https://aws.amazon.com/bedrock/pricing/) · [Free Tier changes](https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/) · [Aurora Serverless v2 scale-to-zero](https://aws.amazon.com/about-aws/whats-new/2024/11/amazon-aurora-serverless-v2-scaling-zero-capacity/) · [Aurora DSQL limits](https://www.kloia.com/blog/aws-aurora-dsql) · [NAT Gateway cost trap](https://patotski.com/blog/nat-gateway-cost-trap/) · [CDK vs SST vs Terraform](https://www.pkgpulse.com/guides/sst-v3-vs-serverless-framework-vs-aws-cdk-nodejs-iac-2026)
- [Better-T-Stack × Alchemy](https://www.better-t-stack.dev/docs/guides/cloudflare-alchemy)
