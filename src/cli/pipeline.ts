import { basename, extname, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import type { StructuredDocument } from "../document/types.js";
import type { WailArtifact } from "../analysis/types.js";
import { parseDocument } from "../document/parse.js";
import { assembleArtifact } from "../analysis/assemble.js";
import { FakeProvider } from "../providers/fake.js";
import type { ParsedArgs } from "./args.js";
import { CliError } from "./errors.js";
import { ExitCode } from "./exitCodes.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function guardUnimplementedOptions(parsed: ParsedArgs): void {
  if (parsed.profile || parsed.contextFiles.length > 0) {
    throw new CliError(
      ExitCode.ConfigError,
      "personal profile and explicit context are not implemented until Phase 3",
    );
  }
  if (parsed.provider && parsed.provider !== "fake") {
    throw new CliError(
      ExitCode.ConfigError,
      `provider "${parsed.provider}" is not implemented; only the fake provider exists in Phase 1`,
    );
  }
  if (parsed.model) {
    throw new CliError(ExitCode.ConfigError, "--model has no effect until a real provider is implemented in Phase 2");
  }
  if (parsed.force) {
    throw new CliError(ExitCode.ConfigError, "--force has no effect until the cache is implemented in Phase 3");
  }
}

export async function loadDocument(parsed: ParsedArgs): Promise<StructuredDocument> {
  guardUnimplementedOptions(parsed);

  const file = parsed.file;
  if (file === null) {
    throw new CliError(ExitCode.UsageError, 'a file path or "-" is required');
  }

  let markdown: string;
  let sourcePath: string | null;
  if (file === "-") {
    markdown = await readStdin();
    sourcePath = null;
  } else {
    try {
      markdown = await readFile(file, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new CliError(ExitCode.InputError, `failed to read "${file}": ${message}`);
    }
    sourcePath = resolve(file);
  }

  const title = parsed.title ?? (file === "-" ? "untitled" : basename(file, extname(file)));

  return parseDocument({
    markdown,
    title,
    sourcePath,
    sourceUrl: parsed.sourceUrl ?? null,
  });
}

export async function analyzeDocument(parsed: ParsedArgs, document: StructuredDocument): Promise<WailArtifact> {
  const intent = parsed.intent ?? "orient";
  const depth = parsed.depth ?? "working";
  const provider = new FakeProvider();
  const result = await provider.analyze({ document, intent, depth, context: [] });
  const generatedAt = new Date().toISOString();
  const validation = assembleArtifact(document, intent, depth, [], result, generatedAt);
  if (!validation.ok) {
    throw new CliError(ExitCode.InvalidOutput, `invalid analysis output:\n${validation.errors.join("\n")}`);
  }
  return validation.artifact;
}
