import type { StructuredDocument } from "../document/types.js";
import type { ProviderAnalysisResult } from "../providers/types.js";
import type { ContextReceiptEntry } from "../context/types.js";
import type { ReadingDepth, ReadingIntent } from "./types.js";
import { validateArtifact, type ValidationResult } from "./validate.js";

export const PROMPT_VERSION = "phase1-fake-v1";

export function assembleArtifact(
  document: StructuredDocument,
  intent: ReadingIntent,
  depth: ReadingDepth,
  context: ContextReceiptEntry[],
  result: ProviderAnalysisResult,
  generatedAt: string,
): ValidationResult {
  const candidate = {
    schemaVersion: 1 as const,
    promptVersion: PROMPT_VERSION,
    generatedAt,
    document: {
      title: document.title,
      sourcePath: document.sourcePath,
      sourceUrl: document.sourceUrl,
      contentHash: document.contentHash,
    },
    request: { intent, depth },
    context,
    overview: result.overview,
    sections: result.sections,
    provider: result.provider,
  };

  return validateArtifact(document, candidate);
}
