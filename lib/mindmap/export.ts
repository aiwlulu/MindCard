import type { NodeData } from "@/lib/types";
import { layoutMindmap, NODE_LINE_HEIGHT, NODE_LINK_HEIGHT } from "./layout";

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
      return `<path d="M ${edge.startX} ${edge.startY} C ${midpoint} ${edge.startY}, ${midpoint} ${edge.endY}, ${edge.endX} ${edge.endY}" fill="none" stroke="#6865a9" stroke-width="2"/>`;
    })
    .join("");
  const nodeMarkup = layout.nodes
    .map(({ node, x, y, width, height, lines, depth, side }) => {
      const topicBlockHeight = lines.length * NODE_LINE_HEIGHT;
      const linkHeight = node.hyperLink ? NODE_LINK_HEIGHT : 0;
      const contentTop = Math.max(
        0,
        (height - topicBlockHeight - linkHeight) / 2
      );
      const textX = depth === 0 ? x + width / 2 : side === "left" ? x + width - 8 : x + 8;
      const textAnchor = depth === 0 ? "middle" : side === "left" ? "end" : "start";
      const firstBaseline = y + contentTop + 16;
      const textMarkup = lines
        .map(
          (line, index) =>
            `<tspan x="${textX}" dy="${index === 0 ? 0 : NODE_LINE_HEIGHT}">${escapeXml(line)}</tspan>`
        )
        .join("");
      const linkMarkup = node.hyperLink
        ? `<a href="/mindmap/${escapeXml(node.hyperLink)}"><text x="${textX}" y="${y + contentTop + topicBlockHeight + 14}" text-anchor="${textAnchor}" fill="#aaa8d4" font-size="11">↗ Open linked mind map</text></a>`
        : "";
      const rootMarkup = depth === 0
        ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.min(22, height / 2)}" fill="#292a32" stroke="#c9c9d2" stroke-width="1.5"/>`
        : "";
      const underlineMarkup = depth >= 2
        ? `<line x1="${x}" x2="${x + width}" y1="${y + contentTop + topicBlockHeight + 1}" y2="${y + contentTop + topicBlockHeight + 1}" stroke="#6865a9" stroke-width="1.5"/>`
        : "";
      const collapsedMarkup = node.collapsed && node.children?.length
        ? `<circle cx="${side === "left" ? x - 12 : x + width + 12}" cy="${y + height / 2}" r="8" fill="#292a32" stroke="#8b89bd"/><text x="${side === "left" ? x - 12 : x + width + 12}" y="${y + height / 2 + 4}" text-anchor="middle" fill="#d6d6df" font-size="12">+</text>`
        : "";
      return `<g data-node-id="${escapeXml(node.id)}">${rootMarkup}<text x="${textX}" y="${firstBaseline}" text-anchor="${textAnchor}" fill="#dedee4" font-size="15" font-weight="${depth <= 1 ? 600 : 400}" font-family="system-ui, sans-serif">${textMarkup}</text>${underlineMarkup}${linkMarkup}${collapsedMarkup}</g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${escapeXml(root.topic)}"><rect width="100%" height="100%" fill="#171921"/>${edgeMarkup}${nodeMarkup}</svg>`;
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
