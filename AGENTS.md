# AGENTS.md

Durable, repo-local facts for a coding or code-review agent working in this
repo.

## Architectural decisions

See [ADR.md](ADR.md) before changing behavior that looks like it could be
"just" a bug fix — currently covers raw HTML handling, why `reader/`
bundles at generation time instead of package-build time, why the fake
provider returns empty findings, and why unimplemented CLI options reject
loudly instead of being ignored. All four are considered decisions with
consequences, not oversights.

## Build & test

- `npm run typecheck` runs two separate `tsc` invocations: `tsconfig.json`
  for `src/` (Node target, `NodeNext`) and `reader/tsconfig.json` for
  `reader/` (browser DOM lib, no Node globals, no emit). They're split on
  purpose — `reader/reader.ts` runs in the browser inside the generated
  artifact and must never import a Node builtin.
- `npm test` compiles `src/` + `test/` together via `tsconfig.test.json`
  into `dist-test/`, then runs `node --test` against the compiled output.
  This is not incidental complexity: Node's `--experimental-strip-types`
  does not resolve TypeScript's `NodeNext` `.js`-for-`.ts` import
  convention (verified against Node 24.19 — running `test/*.ts` directly
  throws `ERR_MODULE_NOT_FOUND` looking for a `.js` file that doesn't
  exist). Don't try to shortcut this by running test files directly.
- `npm run build` compiles only `src/` to `dist/`. `reader/` is bundled
  separately at artifact-generation time, not by this build.

## Import convention

Source under `src/` uses ESM with explicit `.js` extensions in relative
import specifiers (e.g. `from "../document/parse.js"`) even though the
files are `.ts`. This is the standard `NodeNext` moduleResolution
convention — the specifier names the post-compile filename. Don't "fix"
these to `.ts`.

## Exit code categories

`src/cli/exitCodes.ts`: `0` success, `1` usage, `2` input/parse error, `3`
config/credential error, `4` provider/network error, `5` invalid model
output, `6` cache/write error, `7` browser-open error. Map new failure
paths onto one of these rather than inventing a new category.
