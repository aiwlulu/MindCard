import type { NodeData } from "@/lib/types";
import { createNode } from "./tree";
import { formatExternalLinkLabel, normalizeExternalUrl } from "./links";

const BULLET_PREFIX = /^(?:[-*+•◦▪▫‣⁃]|\d+[.)])\s+(?:\[[ xX]\]\s*)?/;

interface OutlineLine {
  indent: number;
  topic: string;
  hasBullet: boolean;
  externalLink: string | null;
}

export function parsePastedOutline(text: string): NodeData[] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(parseLine)
    .filter((line): line is OutlineLine => line !== null);

  if (
    lines.length < 2 &&
    !lines.some((line) => line.hasBullet || line.externalLink)
  ) {
    return [];
  }

  const roots: NodeData[] = [];
  const stack: Array<{ indent: number; node: NodeData }> = [];

  for (const line of lines) {
    const node = createNode(
      line.externalLink
        ? formatExternalLinkLabel(line.externalLink)
        : line.topic
    );
    if (line.externalLink) node.externalLink = line.externalLink;

    while (stack.length && line.indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack.at(-1)?.node;
    if (parent) {
      parent.children = [...(parent.children ?? []), node];
    } else {
      roots.push(node);
    }

    stack.push({ indent: line.indent, node });
  }

  return roots;
}

function parseLine(rawLine: string): OutlineLine | null {
  if (!rawLine.trim()) return null;

  const leadingWhitespace = rawLine.match(/^[\t ]*/)?.[0] ?? "";
  const indent = Array.from(leadingWhitespace).reduce(
    (total, character) => total + (character === "\t" ? 2 : 1),
    0
  );
  const content = rawLine.slice(leadingWhitespace.length).trimEnd();
  const hasBullet = BULLET_PREFIX.test(content);
  const topic = content.replace(BULLET_PREFIX, "").trim();
  const externalLink = normalizeExternalUrl(topic);

  return topic ? { indent, topic, hasBullet, externalLink } : null;
}
