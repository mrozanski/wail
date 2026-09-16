import type { StructuredDocument } from "../document/types.js";
import type { WailArtifact } from "./types.js";
import { WailArtifactSchema } from "./schema.js";

export type ValidationResult =
  | { ok: true; artifact: WailArtifact }
  | { ok: false; errors: string[] };

function rangeWithin(outer: { startLine: number; endLine: number }, inner: { startLine: number; endLine: number }): boolean {
  return inner.startLine >= outer.startLine && inner.endLine <= outer.endLine && inner.startLine <= inner.endLine;
}

export function validateArtifact(document: StructuredDocument, candidate: unknown): ValidationResult {
  const parsed = WailArtifactSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  }
  const artifact = parsed.data as WailArtifact;
  const errors: string[] = [];

  const sectionsById = new Map(document.sections.map((section) => [section.id, section]));
  const seenSectionIds = new Set<string>();

  for (const analysis of artifact.sections) {
    const section = sectionsById.get(analysis.sectionId);
    if (!section) {
      errors.push(`unknown sectionId "${analysis.sectionId}"`);
      continue;
    }
    if (seenSectionIds.has(analysis.sectionId)) {
      errors.push(`duplicate sectionId "${analysis.sectionId}"`);
      continue;
    }
    seenSectionIds.add(analysis.sectionId);

    for (const finding of analysis.findings) {
      for (const range of finding.sourceRanges) {
        if (!rangeWithin(section.range, range)) {
          errors.push(
            `finding in section "${analysis.sectionId}" cites out-of-range lines ${range.startLine}-${range.endLine} (section spans ${section.range.startLine}-${section.range.endLine})`,
          );
        }
      }
    }
  }

  for (const section of document.sections) {
    if (!seenSectionIds.has(section.id)) {
      errors.push(`missing SectionAnalysis for section "${section.id}"`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, artifact };
}
