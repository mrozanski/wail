# wail

WAIL ("What Am I Looking At") is a local-first CLI that turns a Markdown
document into a self-contained, AI-assisted HTML reading artifact: the
rendered source plus a scroll-synchronized semantic margin (summaries,
significance, findings). The artifact is generated once and opens directly
from the filesystem afterward — no running WAIL process, no server.

## Requirements

- Node.js >= 20 (developed against v24)
- npm

## Install

```bash
npm install
npm run build
npm link   # exposes `wail` on PATH via the compiled dist/cli/index.js
```

`npm link` needs to be re-run after `npm run build` produces a new `dist/`,
since `bin` points at the compiled entry point, not the TypeScript source.

## Usage

```bash
wail analyze <file|-> [options]
wail build <file|-> [options]
wail open <file|-> [options]
wail context explain [file] [options]
```

Common options: `--intent <orient|review|learn|implement|reference>`,
`--depth <glance|working|deep>`, `--title`/`--source-url` (stdin input only).

`--profile`, `--context`, `--provider`, `--model`, and `--force` are parsed
but currently rejected with a configuration error — they belong to
not-yet-implemented phases (real provider, personal context, caching).

```bash
wail open docs/proposal.md --intent review --depth working
wail analyze SCHEMA.md --intent reference --format json
git show HEAD:docs/design.md | wail build - --title design.md --intent review --output design.wail.html
```

Exit codes: `0` success, `1` usage, `2` input/parse error, `3`
configuration/credential error, `4` provider/network error, `5` invalid
model output, `6` cache/write error, `7` browser-open error.

## Development

```bash
npm run typecheck   # src/ and reader/, checked separately (see AGENTS.md)
npm run build       # compile src/ to dist/
npm test            # compile src/+test/ to dist-test/, then run node:test
```

Module layout: `src/cli`, `src/document`, `src/analysis`, `src/providers`,
`src/render`, `src/context` (types only so far), plus `reader/` — the
client-side reader script/styles, bundled into the generated artifact at
build time rather than compiled with the rest of the package.
