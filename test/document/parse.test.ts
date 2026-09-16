import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDocument } from "../../src/document/parse.js";

function doc(markdown: string) {
  return parseDocument({ markdown, title: "t", sourcePath: null, sourceUrl: null });
}

test("ordinary headings produce ordered sections with correct ranges", () => {
  const d = doc(["# One", "body one", "", "## Two", "body two"].join("\n"));
  assert.equal(d.sections.length, 2);
  assert.equal(d.sections[0].id, "one");
  assert.equal(d.sections[0].range.startLine, 1);
  assert.equal(d.sections[0].range.endLine, 3);
  assert.equal(d.sections[1].id, "two");
  assert.equal(d.sections[1].parentId, "one");
  assert.equal(d.sections[1].range.startLine, 4);
  assert.equal(d.sections[1].range.endLine, 5);
});

test("duplicate headings get deterministic suffixes", () => {
  const d = doc(["# Same", "a", "# Same", "b"].join("\n"));
  assert.deepEqual(
    d.sections.map((s) => s.id),
    ["same", "same-2"],
  );
});

test("skipped heading levels still nest by level, not by adjacency", () => {
  const d = doc(["# A", "# B", "### C"].join("\n"));
  assert.equal(d.sections[2].parentId, d.sections[1].id);
});

test("content before the first heading becomes a preamble section", () => {
  const d = doc(["intro text", "", "# Heading", "body"].join("\n"));
  assert.equal(d.sections[0].id, "preamble");
  assert.equal(d.sections[0].heading, "");
  assert.equal(d.sections[0].range.endLine, 2);
});

test("a document with no headings is one synthetic section", () => {
  const d = doc(["just", "plain", "text"].join("\n"));
  assert.equal(d.sections.length, 1);
  assert.equal(d.sections[0].range.startLine, 1);
  assert.equal(d.sections[0].range.endLine, 3);
});

test("heading-like text inside fenced code is not treated as a heading", () => {
  const d = doc(["# Real Heading", "```", "# not a heading", "```", "tail"].join("\n"));
  assert.equal(d.sections.length, 1);
  assert.equal(d.sections[0].id, "real-heading");
});

test("source ranges stay one-based across a multi-section document", () => {
  const d = doc(["# H1", "", "# H2", "", "# H3"].join("\n"));
  assert.deepEqual(
    d.sections.map((s) => [s.range.startLine, s.range.endLine]),
    [
      [1, 2],
      [3, 4],
      [5, 5],
    ],
  );
});
