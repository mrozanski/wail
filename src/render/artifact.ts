import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as esbuild from "esbuild";
import type { StructuredDocument } from "../document/types.js";
import type { WailArtifact, SectionAnalysis } from "../analysis/types.js";
import { renderSectionToHtml } from "../document/render.js";
import { escapeHtml, embedJson } from "./escape.js";

function packageRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

async function bundleReaderScript(): Promise<string> {
  const entryPoint = join(packageRoot(), "reader", "reader.ts");
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    format: "iife",
    target: "es2019",
    minify: false,
  });
  return result.outputFiles[0].text;
}

async function readReaderStyles(): Promise<string> {
  return readFile(join(packageRoot(), "reader", "reader.css"), "utf8");
}

function sectionDisplayHeading(heading: string): string {
  return heading.length > 0 ? heading : "Preamble";
}

function renderFinding(finding: SectionAnalysis["findings"][number]): string {
  const label = `${finding.kind} · ${finding.basis}`;
  return `<p class="wail-finding"><span class="wail-finding-basis">${escapeHtml(label)}</span>${escapeHtml(finding.text)}</p>`;
}

function renderDocumentMapItem(id: string, heading: string, level: number): string {
  return `<li class="wail-map-item" data-wail-map-for="${escapeHtml(id)}" style="padding-left: ${Math.max(level - 1, 0) * 0.75}rem"><a href="#${escapeHtml(id)}">${escapeHtml(sectionDisplayHeading(heading))}</a></li>`;
}

function renderAnnotation(analysis: SectionAnalysis, heading: string): string {
  const significance = analysis.significance
    ? `<p class="wail-significance">${escapeHtml(analysis.significance)}</p>`
    : "";
  const findings = analysis.findings.map(renderFinding).join("");
  return `<div class="wail-annotation" data-wail-annotation-for="${escapeHtml(analysis.sectionId)}">
    <h3>${escapeHtml(sectionDisplayHeading(heading))}</h3>
    <p>${escapeHtml(analysis.summary)}</p>
    ${significance}
    ${findings}
  </div>`;
}

function renderContentSection(sectionId: string, level: number, bodyHtml: string): string {
  return `<section id="${escapeHtml(sectionId)}" class="wail-section" data-wail-section-id="${escapeHtml(sectionId)}" data-level="${level}">
    <div class="wail-section-body">${bodyHtml}</div>
  </section>`;
}

export async function buildArtifactHtml(document: StructuredDocument, artifact: WailArtifact): Promise<string> {
  const analysisBySectionId = new Map(artifact.sections.map((section) => [section.sectionId, section]));

  const contentSections = document.sections
    .map((section) => renderContentSection(section.id, section.level, renderSectionToHtml(section.markdown)))
    .join("\n");

  const mapItems = document.sections
    .map((section) => renderDocumentMapItem(section.id, section.heading, section.level))
    .join("\n");

  const annotationCards = document.sections
    .map((section) => {
      const analysis = analysisBySectionId.get(section.id);
      if (!analysis) return "";
      return renderAnnotation(analysis, section.heading);
    })
    .join("\n");

  const [readerScript, readerStyles] = await Promise.all([bundleReaderScript(), readReaderStyles()]);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(document.title)} — WAIL</title>
<style>${readerStyles}</style>
</head>
<body>
<div class="wail-toolbar">
  <div class="wail-title">${escapeHtml(document.title)}</div>
  <div class="wail-meta">${escapeHtml(artifact.request.intent)} · ${escapeHtml(artifact.request.depth)} · generated ${escapeHtml(artifact.generatedAt)}</div>
  <button type="button" class="wail-drawer-toggle" data-wail-drawer-toggle>Map</button>
</div>
<div class="wail-layout">
  <main class="wail-content">
    ${contentSections}
  </main>
  <aside class="wail-margin">
    <nav class="wail-map"><ul>${mapItems}</ul></nav>
    <div class="wail-annotations">${annotationCards}</div>
  </aside>
</div>
<script type="application/json" id="wail-data">${embedJson(artifact)}</script>
<script>${readerScript}</script>
</body>
</html>
`;
}
