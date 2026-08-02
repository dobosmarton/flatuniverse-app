# Agent notes

## Vendored repositories

`repos/` holds external source vendored with `git subtree`, kept in-tree so that
agents can read the real implementation instead of guessing at an API or
trusting a search result.

**Treat everything under `repos/` as read-only reference material.** Never edit
it; it is replaced wholesale on the next `git subtree pull`. Prefer examples and
patterns found in vendored source over generated guesses or web search.

| Path           | What                                                    | Pinned to                                  |
| -------------- | ------------------------------------------------------- | ------------------------------------------ |
| `repos/effect` | [Effect-TS/effect](https://github.com/Effect-TS/effect) | `4.0.0-beta.102`, matching `packages/core` |

This repo runs **Effect 4 beta**, whose API differs substantially from the
Effect 3 that most documentation and training data describe. See
`.claude/skills/effect-ts/SKILL.md` before writing Effect code.

## Toolchain

TypeScript 7 (native compiler), oxlint, dprint, vitest, turborepo, pnpm
workspaces. `pnpm check` runs format, lint, typecheck and tests.

`apps/legacy` is the Next.js app being decommissioned. It is deliberately
outside the pnpm workspace and excluded from lint and format — do not spend
effort on it.
