import { createHash } from "node:crypto";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, Heading } from "mdast";
import { makeIdAllocator } from "./slug.js";
import type { DocumentSection, SourceRange, StructuredDocument } from "./types.js";

export type ParseDocumentInput = {
  markdown: string;
  title: string;
  sourcePath: string | null;
  sourceUrl: string | null;
};

function toText(node: Heading): string {
  let text = "";
  const visit = (n: unknown): void => {
    if (n && typeof n === "object" && "value" in n && typeof (n as { value: unknown }).value === "string") {
      text += (n as { value: string }).value;
    }
    if (n && typeof n === "object" && "children" in n && Array.isArray((n as { children: unknown[] }).children)) {
      for (const child of (n as { children: unknown[] }).children) visit(child);
    }
  };
  visit(node);
  return text;
}

function sliceLines(lines: string[], range: SourceRange): string {
  return lines.slice(range.startLine - 1, range.endLine).join("\n");
}

export function parseDocument(input: ParseDocumentInput): StructuredDocument {
  const lines = input.markdown.split("\n");
  const totalLines = lines.length;
  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(input.markdown) as Root;

  const topLevelHeadings = tree.children.filter(
    (node): node is Heading => node.type === "heading" && node.position !== undefined,
  );

  const allocateId = makeIdAllocator();
  const sections: DocumentSection[] = [];
  const stack: { level: number; id: string }[] = [];
  let ordinal = 0;

  const firstHeadingLine = topLevelHeadings[0]?.position?.start.line ?? null;

  if (firstHeadingLine === null) {
    // No headings: the whole document is one synthetic section.
    sections.push({
      id: allocateId("preamble"),
      heading: "",
      level: 0,
      ordinal: ordinal++,
      parentId: null,
      range: { startLine: 1, endLine: totalLines },
      markdown: input.markdown,
    });
  } else {
    if (firstHeadingLine > 1) {
      const range: SourceRange = { startLine: 1, endLine: firstHeadingLine - 1 };
      sections.push({
        id: allocateId("preamble"),
        heading: "",
        level: 0,
        ordinal: ordinal++,
        parentId: null,
        range,
        markdown: sliceLines(lines, range),
      });
    }

    for (let i = 0; i < topLevelHeadings.length; i++) {
      const heading = topLevelHeadings[i];
      const startLine = heading.position!.start.line;
      const nextHeading = topLevelHeadings[i + 1];
      const endLine = nextHeading ? nextHeading.position!.start.line - 1 : totalLines;
      const level = heading.depth;

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;

      const headingText = toText(heading);
      const range: SourceRange = { startLine, endLine };
      const id = allocateId(headingText);

      sections.push({
        id,
        heading: headingText,
        level,
        ordinal: ordinal++,
        parentId,
        range,
        markdown: sliceLines(lines, range),
      });

      stack.push({ level, id });
    }
  }

  const contentHash = createHash("sha256").update(input.markdown, "utf8").digest("hex");

  return {
    title: input.title,
    sourcePath: input.sourcePath,
    sourceUrl: input.sourceUrl,
    contentHash,
    markdown: input.markdown,
    sections,
  };
}
