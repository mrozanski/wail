# Architectural Decision Records

## Raw HTML handling is deliberate

**Context:** Markdown fed to WAIL is treated as untrusted input, including
material from external sources (vendor docs, whitepapers, content shared by
others) that may carry raw HTML with no Markdown equivalent — exactly the
case CommonMark's raw-HTML passthrough exists for. The generated artifact
is a static `file://` HTML page opened in a real browser, so any executable
HTML that reached it would run with a real DOM and could exfiltrate the
document's contents or annotations to a remote server.

**Decision:** `src/document/render.ts` renders every mdast `html` node as
escaped visible text instead of converting it to a hast `raw` node. This is
implemented by overriding the `html` handler passed to
`mdast-util-to-hast`, rather than relying on its default behavior — the
override is what makes the literal HTML *visible* as escaped text, instead
of the default of silently dropping the node.

**Consequences:** Any literal HTML tag in source Markdown (`<details>`,
`<div align>`, `<script>`, etc.) always renders as visible escaped text,
never as interpreted markup, starting from Phase 1 — this is not deferred
to a later "sanitization" phase. This trades away legitimate uses of raw
HTML in Markdown (e.g. `<details>` blocks, inline `<sub>`/`<sup>`) for a
categorical guarantee. Rendering one of those constructs as real markup
later would need a deliberate, reviewed allowlist change, not a config
flag flip.

**Options considered:** Full sanitization (parse, then allowlist-filter,
DOMPurify-style) was rejected for Phase 1 as disproportionate to the actual
risk profile (single-user tool, `file://`, no session/cookies to steal) —
disabling passthrough costs nothing and closes the gap regardless. Letting
`mdast-util-to-hast` silently drop raw HTML (its default when
`allowDangerousHtml` is unset) was rejected because silently removing
content can change a document's meaning without any visible sign that
happened; escaping preserves visibility while remaining inert.

## `reader/` bundles at generation time, not at package-build time

**Context:** `reader/reader.ts` is a single file with no imports — there
is nothing to bundle in the multi-module sense. esbuild is used purely as
a fast TS→JS transpiler for it. The choice is *when* that transpile
happens: once, during `npm run build`, producing a compiled artifact in
`dist/`; or on demand, every time `wail build`/`wail open` renders a
document.

**Decision:** `src/render/artifact.ts` calls `esbuild.build()` on
`reader/reader.ts` and reads `reader/reader.css` directly, live, on every
artifact generation. `reader/` is deliberately excluded from
`tsconfig.json`'s `include` and from `dist/`; it is typechecked
separately via `reader/tsconfig.json` but never compiled ahead of time.

**Consequences:** Editing `reader.ts` takes effect on the very next
`wail build` with no separate build step to remember or forget — there is
nothing to go stale. The cost is that `dist/` is not self-contained:
`reader/` (TypeScript source, not compiled output) must physically exist
next to wherever `dist/cli/index.js` runs from, and every invocation pays
a small esbuild transpile rather than a plain file read. This is fine
today: `package.json` has no `files` allowlist and is `"private": true`,
so every install is a working-tree install where `reader/` is always
present alongside `dist/`. It would break if this package were ever
published with a `dist`-only `files` list (or otherwise shipped without
the working tree) — revisit then, not before.

**Options considered:** Precompiling `reader.ts` into `dist/` at
package-build time (e.g. `dist/reader/reader.bundle.js`, copied CSS) was
rejected for now — it would make `dist/` fully self-contained and shave a
transpile off every invocation, but adds a second build target to keep in
sync with the source, with the classic risk of `wail build` silently
using a stale bundle if a future change to the build script forgets to
regenerate it. Given the project's current single-user, working-tree-only
distribution, that tradeoff isn't worth it yet.

## `FakeProvider` returning empty findings is correct

**Context:** Phase 1 has no live model integration. `src/providers/fake.ts`
stands in for a real `AnalysisProvider` so the CLI, document pipeline, and
reader can be built and tested end-to-end before a real provider exists.

**Decision:** The fake provider always returns a `summary` derived from
the section heading and an empty `findings` array — it never fabricates a
plausible-looking decision, risk, requirement, or other finding. This
follows the same rule the analysis contract sets for the eventual real
model: an empty findings list is preferred over an invented one.

**Consequences:** Tests and manual smoke runs against the fake provider
exercise only the *structural* correctness of the pipeline — section
coverage, citation-range validation, artifact rendering — and say nothing
about analysis quality, which only a real provider can produce. A reader
built from the fake provider showing no findings is the correct, honest
result of no real analysis having run; it is not a bug to "improve" by
having the fake provider guess at plausible findings.

## Unimplemented CLI options fail loudly, not silently

**Context:** `src/cli/args.ts` already parses the full command surface
from the spec, including `--profile`, `--context`, `--provider`,
`--model`, and `--force` — options whose actual behavior (personal
context, a real provider, content-addressed caching) belongs to later
phases that don't exist yet. A user can type any of them today.

**Decision:** `guardUnimplementedOptions` in `src/cli/pipeline.ts` rejects
each of these with a configuration error the moment they're passed,
before any document is read or analyzed, rather than accepting them and
running the fake-provider pipeline as if they had no effect.

**Consequences:** Passing `--profile` or `--context` today gets an
immediate, specific error instead of a normal-looking result that quietly
ignored the flag — which matters most for these two, since their entire
purpose is to change what gets sent for analysis; a silently-ignored
`--profile` would produce output indistinguishable from output that
actually used it. The cost is maintenance: each guard clause needs to be
removed individually as its phase lands, and forgetting one leaves a
flag erroring after it's actually implemented — a stale error, not a
wrong answer, so the failure mode stays safe in the direction it fails.

**Options considered:** Silently accepting and ignoring these options was
rejected — it would let `wail analyze --profile ~/me.md` succeed and
produce a plausible-looking result that never touched the profile, which
is a worse failure mode than a loud, immediate rejection.
