import type { NodeData } from "@/lib/types";
import { normalizeExternalUrl } from "./links";
import { createNode } from "./tree";

const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*$/;
const BULLET_PATTERN = /^(\s*)[-*+]\s+(.+?)\s*$/;
const EXTERNAL_LINK_PATTERN = /^\[([^\]]+)]\((https?:\/\/.+)\)$/i;
const BOLD_LINE_PATTERN = /^\*\*((?:(?!\*\*)[\s\S])+)\*\*$/;

export interface MarkdownParseResult {
  root: NodeData | null;
  error: string | null;
}

export function convertToMarkdown(node: NodeData, depth = 0): string {
  const prefix =
    depth <= 2
      ? `${"#".repeat(depth + 1)} `
      : `${"  ".repeat(depth - 2)}- `;
  const label = node.topic.replace(/\r?\n/g, "<br>");
  const topic = node.externalLink
    ? `[${label}](${node.externalLink})`
    : label;
  const content = node.bold ? `**${topic}**` : topic;
  let markdown = `${prefix}${content}\n`;

  for (const child of node.children ?? []) {
    markdown += convertToMarkdown(child, depth + 1);
  }

  return markdown;
}

export function parseMindmapMarkdown(markdown: string): MarkdownParseResult {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const stack: NodeData[] = [];
  let root: NodeData | null = null;
  let lastHeadingDepth = 0;
  let bulletBaseIndent: number | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    if (!rawLine.trim()) continue;

    const heading = rawLine.match(HEADING_PATTERN);
    const bullet = rawLine.match(BULLET_PATTERN);
    let depth: number;
    let content: string;

    if (heading) {
      depth = heading[1].length - 1;
      content = heading[2];
      lastHeadingDepth = depth;
      bulletBaseIndent = null;
    } else if (bullet) {
      const indent = measureIndent(bullet[1]);
      bulletBaseIndent ??= indent;
      depth =
        lastHeadingDepth +
        1 +
        Math.max(0, Math.floor((indent - bulletBaseIndent) / 2));
      content = bullet[2];
    } else {
      return parseError(index, "Use a heading or bullet for each topic.");
    }

    if (!root && depth !== 0) {
      return parseError(index, "Start with a level-one (#) root topic.");
    }
    if (root && depth === 0) {
      return parseError(index, "Only one root topic is allowed.");
    }

    const node = createMarkdownNode(content);
    if (!node) {
      return parseError(index, "Topic text cannot be empty.");
    }

    if (depth === 0) {
      node.root = true;
      root = node;
      stack[0] = node;
      stack.length = 1;
      continue;
    }

    const parent = stack[depth - 1];
    if (!parent) {
      return parseError(index, "A topic cannot skip a parent level.");
    }
    parent.children = [...(parent.children ?? []), node];
    stack[depth] = node;
    stack.length = depth + 1;
  }

  return root
    ? { root, error: null }
    : { root: null, error: "Add a level-one (#) root topic." };
}

export function reconcileMarkdownTree(
  parsed: NodeData,
  existing?: NodeData
): NodeData {
  const children = parsed.children?.map((child, index) =>
    reconcileMarkdownTree(child, existing?.children?.[index])
  );
  const reconciled: NodeData = {
    ...parsed,
    id: existing?.id ?? parsed.id,
    ...(children?.length ? { children } : {}),
  };

  if (parsed.root || existing?.root) reconciled.root = true;
  if (existing?.hyperLink) reconciled.hyperLink = existing.hyperLink;
  if (existing?.collapsed) reconciled.collapsed = true;

  return reconciled;
}

function createMarkdownNode(content: string): NodeData | null {
  let normalizedContent = content.trim().replace(/<br\s*\/?>/gi, "\n");
  if (!normalizedContent) return null;

  const boldMatch = normalizedContent.match(BOLD_LINE_PATTERN);
  const bold = Boolean(boldMatch);
  if (boldMatch) normalizedContent = boldMatch[1].trim();
  if (!normalizedContent) return null;

  const externalLinkMatch = normalizedContent.match(EXTERNAL_LINK_PATTERN);
  if (!externalLinkMatch) {
    const node = createNode(normalizedContent);
    return bold ? { ...node, bold: true } : node;
  }

  const externalLink = normalizeExternalUrl(externalLinkMatch[2]);
  if (!externalLink) {
    const node = createNode(normalizedContent);
    return bold ? { ...node, bold: true } : node;
  }

  return {
    ...createNode(externalLinkMatch[1].replace(/<br\s*\/?>/gi, "\n")),
    externalLink,
    ...(bold ? { bold: true } : {}),
  };
}

function measureIndent(whitespace: string): number {
  return Array.from(whitespace).reduce(
    (total, character) => total + (character === "\t" ? 2 : 1),
    0
  );
}

function parseError(lineIndex: number, message: string): MarkdownParseResult {
  return {
    root: null,
    error: `Line ${lineIndex + 1}: ${message}`,
  };
}
