---
name: effect-ts
description: Use whenever writing, reviewing, or debugging Effect code in this repo — Effect, Layer, Schema, Stream, Schedule, Result, Option, Context services, HttpApi, or anything imported from `effect`. This project pins Effect 4 beta, whose API differs substantially from the Effect 3 that most documentation, blog posts and model training data describe. Read this before trusting recall.
---

# Effect in this repo

**This repo is on Effect `4.0.0-beta.102`, pinned exactly.** Almost everything
written about Effect online is version 3. Recall is unreliable here, and web
search is worse — it confidently returns v3 APIs that no longer exist.

The full Effect source for the exact pinned version is vendored at
**`repos/effect/`**. Read it instead of guessing.

## The rule

**Verify every Effect API against `repos/effect/` or the installed `.d.ts`
before you use it.** Not after the typechecker complains — before writing the
line. This costs one `grep` and saves a debugging cycle.

Vendored code is **read-only reference material**. Never edit anything under
`repos/`. It is replaced wholesale by `git subtree pull`.

## Where to look

| Question                               | Where                                                        |
| -------------------------------------- | ------------------------------------------------------------ |
| "What replaced this v3 API?"           | `repos/effect/migration/v3-to-v4.md` (1.3 MB, comprehensive) |
| Schema changes specifically            | `repos/effect/migration/schema.md`                           |
| Services, Layers, dependency injection | `repos/effect/migration/services.md`                         |
| Retry and repeat policies              | `repos/effect/cookbooks/schedule.md`                         |
| Error handling, Cause, fibers, scope   | the other files in `repos/effect/migration/`                 |
| How an API actually behaves            | `repos/effect/packages/effect/src/<Module>.ts`               |
| Real usage examples                    | `repos/effect/packages/effect/test/`                         |
| HttpApi, SQL, CLI, AI, Workflow        | `repos/effect/packages/effect/src/unstable/`                 |

Useful greps:

```bash
rg "declare const retry" repos/effect/packages/effect/src/Effect.ts
rg -n "^### " repos/effect/migration/v3-to-v4.md | head -50   # section index
ls repos/effect/packages/effect/src/unstable/httpapi/
```

## v3 → v4 differences already hit in this project

Confirmed by compiling, not from memory. Treat as a starting list, not a
complete one — consult `migration/v3-to-v4.md` for anything else.

| Effect 3                                      | Effect 4                                                                    |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `Either`                                      | `Result` — `isFailure`/`isSuccess`, `.failure`/`.success`, `fail`/`succeed` |
| `Either.mapLeft`                              | `Result.mapError`                                                           |
| `Option.fromNullable`                         | `Option.fromUndefinedOr` / `fromNullOr` / `fromNullishOr`                   |
| `Effect.Service`                              | `Context.Service<Self, Shape>()("Key")`                                     |
| `Schema.TaggedError`                          | `Schema.TaggedErrorClass` (or keep `Data.TaggedError`)                      |
| `Schema.filter(pred, ann)`                    | `Schema.check(Schema.makeFilter(pred, ann))`                                |
| `Schema.decodeUnknownEither`                  | `Schema.decodeUnknownResult`                                                |
| `Schema.decodeUnknown`                        | `Schema.decodeUnknownEffect`                                                |
| `Schema.NonEmptyTrimmedString`                | `Schema.NonEmptyString` (trim separately)                                   |
| `Schema.Number.pipe(Schema.int())`            | `Schema.Int`                                                                |
| `Effect.timeoutFail`                          | `Effect.timeoutOrElse({ duration, orElse })`                                |
| `@effect/platform` HttpApi                    | `effect/unstable/httpapi` — in core, no separate package                    |
| `FileSystem` / `Path` from `@effect/platform` | top-level exports of `effect`                                               |

Other things worth knowing:

- A `Schema.makeFilter` predicate returns `true` to pass or a **string message**
  to fail — not a bare boolean.
- A `Result` is not yieldable inside `Effect.gen`. Convert with
  `Effect.fromResult(...)`.
- `Effect.retry` takes an options object — `{ schedule, times, while, until }` —
  rather than a composed `Schedule`. Prefer the **data-first** form
  `Effect.retry(effect, options)`; the data-last form in a `.pipe` frequently
  fails to infer.
- `Option.none()` infers `Option<unknown>`. Write `Option.none<string>()`.
- `Stream.paginate(seed, f)` where `f` returns
  `Effect<[ReadonlyArray<A>, Option<S>], E, R>` is the idiomatic shape for
  cursor- or token-paginated APIs. See `src/arxiv/harvester.ts`.

## House style

Follow `repos/effect/.patterns/effect.md` and the repo's `clean-code` skill.
In short:

- **Schema-first.** Model data as `Schema`, not bare TypeScript types. One
  schema serves parsing, persistence and the API contract — do not duplicate it
  in a second validator.
- **Typed errors.** `Data.TaggedError` per failure mode, named for the domain
  condition. No `throw`, no untyped rejections.
- **Functional.** No `for` loops, no mutation, no `else if` chains. Prefer
  `Array` combinators and `Match` over imperative control flow.
- **Services at every I/O boundary.** `Context.Service` + `Layer`, so tests swap
  a layer rather than mocking a module. See `src/arxiv/client.ts` — the live
  layer uses `fetch`, the test layer replays canned responses.
- **Keep Effect inside the boundary.** Where a runtime owns durability (a
  Cloudflare Workflow step, a Lambda handler), run the Effect inside that step
  rather than spanning steps with it.

## Updating the vendored source

Only when the pinned Effect version changes. Bump `packages/core/package.json`
in the same commit so the two never drift.

```bash
git fetch https://github.com/Effect-TS/effect.git main
git subtree pull --prefix=repos/effect FETCH_HEAD --squash
```

**Use `FETCH_HEAD`, not `main`.** Passing `main` makes git resolve this repo's
own `main` branch and vendor _this project_ into `repos/effect/`. That mistake
has already been made once here.
