import type { StructuredDocument } from "../document/types.js";
import type { WailArtifact } from "./types.js";

export function toMarkdownReport(document: StructuredDocument, artifact: WailArtifact): string {
  const lines: string[] = [];
  lines.push(`# ${document.title}`, "");
  lines.push(artifact.overview.summary, "");

  const analysisBySectionId = new Map(artifact.sections.map((section) => [section.sectionId, section]));

  for (const section of document.sections) {
    const analysis = analysisBySectionId.get(section.id);
    if (!analysis) continue;
    const heading = section.heading.length > 0 ? section.heading : "Preamble";
    lines.push(`${"#".repeat(Math.min(section.level + 1, 6) || 2)} ${heading}`, "");
    lines.push(analysis.summary, "");
    if (analysis.significance) {
      lines.push(`_${analysis.significance}_`, "");
    }
    for (const finding of analysis.findings) {
      const ranges = finding.sourceRanges.map((r) => `L${r.startLine}-${r.endLine}`).join(", ");
      lines.push(`- **${finding.kind} (${finding.basis})**: ${finding.text}${ranges ? ` (${ranges})` : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
