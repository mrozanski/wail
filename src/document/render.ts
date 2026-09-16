import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";
import type { Root } from "mdast";
import type { Text } from "hast";

/**
 * Raw HTML in the source has no Markdown equivalent, which is exactly why CommonMark
 * passes it through verbatim by default. The source is untrusted even when local, so
 * the `html` mdast node is rendered as escaped visible text instead of being converted
 * to a hast `raw` node (the mechanism that would let it reach the page as real markup).
 */
function disableRawHtml() {
  return {
    html(_state: unknown, node: { value: string }): Text {
      return { type: "text", value: node.value };
    },
  };
}

export function renderSectionToHtml(markdown: string): string {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(markdown) as Root;
  const hast = toHast(tree, { handlers: disableRawHtml() });
  return toHtml(hast, { allowDangerousHtml: false });
}
