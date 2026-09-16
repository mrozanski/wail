#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { parseArgs, type ParsedArgs } from "./args.js";
import { CliError } from "./errors.js";
import { ExitCode } from "./exitCodes.js";
import { analyzeDocument, guardUnimplementedOptions, loadDocument } from "./pipeline.js";
import { toMarkdownReport } from "../analysis/report.js";
import { buildArtifactHtml } from "../render/artifact.js";
import { slugify } from "../document/slug.js";

const execFileAsync = promisify(execFile);

async function runAnalyze(parsed: ParsedArgs): Promise<void> {
  const document = await loadDocument(parsed);
  const artifact = await analyzeDocument(parsed, document);
  if (parsed.format === "markdown") {
    process.stdout.write(toMarkdownReport(document, artifact));
  } else {
    process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
  }
}

async function runBuild(parsed: ParsedArgs): Promise<void> {
  const document = await loadDocument(parsed);
  const artifact = await analyzeDocument(parsed, document);
  const html = await buildArtifactHtml(document, artifact);
  const outputPath = parsed.output ?? `${slugify(document.title)}.wail.html`;
  try {
    await writeFile(outputPath, html, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(ExitCode.WriteError, `failed to write "${outputPath}": ${message}`);
  }
  process.stdout.write(`${resolve(outputPath)}\n`);
}

async function runOpen(parsed: ParsedArgs): Promise<void> {
  const document = await loadDocument(parsed);
  const artifact = await analyzeDocument(parsed, document);
  const html = await buildArtifactHtml(document, artifact);

  const cacheDir = join(tmpdir(), "wail-open-cache");
  await mkdir(cacheDir, { recursive: true });
  const outputPath = join(cacheDir, `${slugify(document.title)}-${document.contentHash.slice(0, 12)}.html`);

  try {
    await writeFile(outputPath, html, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(ExitCode.WriteError, `failed to write "${outputPath}": ${message}`);
  }

  process.stdout.write(`${outputPath}\n`);

  try {
    await execFileAsync("open", [outputPath]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(ExitCode.BrowserOpenError, `failed to open browser for "${outputPath}": ${message}`);
  }

  if (parsed.consume && parsed.file && parsed.file !== "-") {
    await unlink(parsed.file);
  }
}

async function runContextExplain(parsed: ParsedArgs): Promise<void> {
  guardUnimplementedOptions(parsed);
  process.stdout.write(
    `${JSON.stringify(
      {
        note: "personal profile and explicit context are not implemented until Phase 3",
        context: [],
      },
      null,
      2,
    )}\n`,
  );
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  switch (parsed.command) {
    case "analyze":
      await runAnalyze(parsed);
      break;
    case "build":
      await runBuild(parsed);
      break;
    case "open":
      await runOpen(parsed);
      break;
    case "context-explain":
      await runContextExplain(parsed);
      break;
  }
}

main().catch((error: unknown) => {
  if (error instanceof CliError) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = error.exitCode;
    return;
  }
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = ExitCode.UsageError;
});
