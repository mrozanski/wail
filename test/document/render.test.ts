import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSectionToHtml } from "../../src/document/render.js";

test("raw HTML is rendered as escaped visible text, not passed through as markup", () => {
  const html = renderSectionToHtml("Before <script>alert('xss')</script> after.");
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&#x3C;script>alert"));
});

test("ordinary markdown constructs still render as real markup", () => {
  const html = renderSectionToHtml("- one\n- two\n\n**bold**");
  assert.ok(html.includes("<ul>"));
  assert.ok(html.includes("<strong>bold</strong>"));
});
