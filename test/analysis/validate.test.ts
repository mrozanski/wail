import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDocument } from "../../src/document/parse.js";
import { validateArtifact } from "../../src/analysis/validate.js";

function fixtureDocument() {
  return parseDocument({
    markdown: ["# One", "line two", "", "# Two", "line five"].join("\n"),
    title: "fixture",
    sourcePath: null,
    sourceUrl: null,
  });
}

function baseArtifact(sections: unknown[]) {
  return {
    schemaVersion: 1,
    promptVersion: "test",
    generatedAt: "2026-01-01T00:00:00.000Z",
    document: { title: "fixture", sourcePath: null, sourceUrl: null, contentHash: "x" },
    request: { intent: "orient", depth: "working" },
    context: [],
    overview: { summary: "s", documentKind: "k", readingGuidance: [], keyItems: [] },
    sections,
    provider: { name: "fake", model: "fake-v1", responseIds: [] },
  };
}

test("valid artifact with exactly one SectionAnalysis per section passes", () => {
  const document = fixtureDocument();
  const artifact = baseArtifact([
    { sectionId: "one", summary: "s1", significance: null, findings: [] },
    { sectionId: "two", summary: "s2", significance: null, findings: [] },
  ]);
  const result = validateArtifact(document, artifact);
  assert.equal(result.ok, true);
});

test("missing SectionAnalysis for a section is rejected", () => {
  const document = fixtureDocument();
  const artifact = baseArtifact([{ sectionId: "one", summary: "s1", significance: null, findings: [] }]);
  const result = validateArtifact(document, artifact);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes('missing SectionAnalysis for section "two"')));
});

test("unknown sectionId is rejected", () => {
  const document = fixtureDocument();
  const artifact = baseArtifact([
    { sectionId: "one", summary: "s1", significance: null, findings: [] },
    { sectionId: "two", summary: "s2", significance: null, findings: [] },
    { sectionId: "ghost", summary: "s3", significance: null, findings: [] },
  ]);
  const result = validateArtifact(document, artifact);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes('unknown sectionId "ghost"')));
});

test("duplicate sectionId is rejected", () => {
  const document = fixtureDocument();
  const artifact = baseArtifact([
    { sectionId: "one", summary: "s1", significance: null, findings: [] },
    { sectionId: "one", summary: "s1-dup", significance: null, findings: [] },
    { sectionId: "two", summary: "s2", significance: null, findings: [] },
  ]);
  const result = validateArtifact(document, artifact);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes('duplicate sectionId "one"')));
});

test("out-of-range citation is rejected", () => {
  const document = fixtureDocument();
  const artifact = baseArtifact([
    {
      sectionId: "one",
      summary: "s1",
      significance: null,
      findings: [
        { kind: "concept", basis: "stated", text: "t", sourceRanges: [{ startLine: 4, endLine: 4 }] },
      ],
    },
    { sectionId: "two", summary: "s2", significance: null, findings: [] },
  ]);
  const result = validateArtifact(document, artifact);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.includes("out-of-range")));
});

test("invalid enum values are rejected by schema validation", () => {
  const document = fixtureDocument();
  const artifact = baseArtifact([
    {
      sectionId: "one",
      summary: "s1",
      significance: null,
      findings: [{ kind: "not-a-real-kind", basis: "stated", text: "t", sourceRanges: [] }],
    },
    { sectionId: "two", summary: "s2", significance: null, findings: [] },
  ]);
  const result = validateArtifact(document, artifact);
  assert.equal(result.ok, false);
});
