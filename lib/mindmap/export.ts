import type { NodeData } from "@/lib/types";
import { layoutMindmap } from "./layout";

export function convertToMarkdown(node: NodeData, depth = 0): string {
  const prefix = depth <= 2
    ? `${"#".repeat(depth + 1)} `
    : `${"  ".repeat(depth - 2)}- `;
  let markdown = `${prefix}${node.topic}\n`;

  for (const child of node.children ?? []) {
    markdown += convertToMarkdown(child, depth + 1);
  }

  return markdown;
}

export function buildMindmapSvg(root: NodeData): string {
  const layout = layoutMindmap(root);
  const edgeMarkup = layout.edges
    .map((edge) => {
      const midpoint = (edge.startX + edge.endX) / 2;
      return `<path d="M ${edge.startX} ${edge.startY} C ${midpoint} ${edge.startY}, ${midpoint} ${edge.endY}, ${edge.endX} ${edge.endY}" fill="none" stroke="#64748b" stroke-width="2"/>`;
    })
    .join("");
  const nodeMarkup = layout.nodes
    .map(({ node, x, y, width, height }) => {
      const linkMarkup = node.hyperLink
        ? `<text x="${x + 14}" y="${y + height - 9}" fill="#bef264" font-size="11">Card link: ${escapeXml(node.hyperLink)}</text>`
        : "";
      return `<g data-node-id="${escapeXml(node.id)}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="#334155" stroke="#64748b" stroke-width="1"/><text x="${x + 14}" y="${y + 25}" fill="#f8fafc" font-size="15" font-family="system-ui, sans-serif">${escapeXml(node.topic)}</text>${linkMarkup}</g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${escapeXml(root.topic)}"><rect width="100%" height="100%" fill="#0f172a"/>${edgeMarkup}${nodeMarkup}</svg>`;
}

export function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "MindMap";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
