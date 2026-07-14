import type { NodeData } from "@/lib/types";
import { layoutMindmap, NODE_LINE_HEIGHT, NODE_LINK_HEIGHT } from "./layout";
import { getBranchColor, getBranchStrokeWidth } from "./colors";
import {
  countDescendants,
  formatHiddenDescendantCount,
} from "./tree";

const MAX_PNG_DIMENSION = 16_384;

export function convertToMarkdown(node: NodeData, depth = 0): string {
  const prefix = depth <= 2
    ? `${"#".repeat(depth + 1)} `
    : `${"  ".repeat(depth - 2)}- `;
  const topic = node.externalLink
    ? `[${node.topic}](${node.externalLink})`
    : node.topic;
  let markdown = `${prefix}${topic}\n`;

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
      const branchColor = getBranchColor(edge.branchIndex, edge.depth);
      return `<path d="M ${edge.startX} ${edge.startY} C ${midpoint} ${edge.startY}, ${midpoint} ${edge.endY}, ${edge.endX} ${edge.endY}" fill="none" stroke="${branchColor}" stroke-width="${getBranchStrokeWidth(edge.depth)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join("");
  const nodeMarkup = layout.nodes
    .map(({ node, x, y, width, height, lines, depth, branchIndex }) => {
      const topicBlockHeight = lines.length * NODE_LINE_HEIGHT;
      const linkCount = Number(Boolean(node.hyperLink)) + Number(Boolean(node.externalLink));
      const linkHeight = linkCount * NODE_LINK_HEIGHT;
      const contentTop = Math.max(
        0,
        (height - topicBlockHeight - linkHeight) / 2
      );
      const textX = depth === 0 ? x + width / 2 : x + 8;
      const textAnchor = depth === 0 ? "middle" : "start";
      const firstBaseline = y + contentTop + 16;
      const branchColor = getBranchColor(branchIndex, depth);
      const textMarkup = lines
        .map(
          (line, index) =>
            `<tspan x="${textX}" dy="${index === 0 ? 0 : NODE_LINE_HEIGHT}">${escapeXml(line)}</tspan>`
        )
        .join("");
      const linkMarkup = node.hyperLink
        ? `<a href="/mindmap/${escapeXml(node.hyperLink)}" target="_blank" rel="noopener noreferrer"><text x="${textX}" y="${y + contentTop + topicBlockHeight + 14}" text-anchor="${textAnchor}" fill="#aaa8d4" font-size="11">↗ Open linked mind map</text></a>`
        : "";
      const externalLinkMarkup = node.externalLink
        ? `<a href="${escapeXml(node.externalLink)}" target="_blank" rel="noopener noreferrer"><text x="${textX}" y="${y + contentTop + topicBlockHeight + 14 + (node.hyperLink ? NODE_LINK_HEIGHT : 0)}" text-anchor="${textAnchor}" fill="#aaa8d4" font-size="11">↗ Open external link</text></a>`
        : "";
      const rootMarkup = depth === 0
        ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.min(22, height / 2)}" fill="#292a32" stroke="#c9c9d2" stroke-width="1.5"/>`
        : "";
      const lineY = y + contentTop + topicBlockHeight + 1;
      const underlineMarkup = depth >= 1
        ? `<line x1="${x}" x2="${x + width}" y1="${lineY}" y2="${lineY}" stroke="${branchColor}" stroke-width="${getBranchStrokeWidth(depth)}" stroke-linecap="round"/>`
        : "";
      let collapsedMarkup = "";
      if (node.collapsed && node.children?.length) {
        const label = formatHiddenDescendantCount(countDescendants(node));
        const badgeWidth = Math.max(16, label.length * 5.5 + 7);
        const centerX = x + width + 12;
        const centerY = lineY;
        collapsedMarkup = `<rect x="${centerX - badgeWidth / 2}" y="${centerY - 8}" width="${badgeWidth}" height="16" rx="8" fill="#292a32" stroke="${branchColor}"/><text x="${centerX}" y="${centerY + 3}" text-anchor="middle" fill="#d6d6df" font-size="8">${label}</text>`;
      }
      return `<g data-node-id="${escapeXml(node.id)}">${rootMarkup}<text x="${textX}" y="${firstBaseline}" text-anchor="${textAnchor}" fill="#dedee4" font-size="15" font-weight="${depth <= 1 ? 600 : 400}" font-family="system-ui, sans-serif">${textMarkup}</text>${underlineMarkup}${linkMarkup}${externalLinkMarkup}${collapsedMarkup}</g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${escapeXml(root.topic)}"><rect width="100%" height="100%" fill="#171921"/>${edgeMarkup}${nodeMarkup}</svg>`;
}

export async function buildMindmapPng(
  root: NodeData,
  scale = 2
): Promise<Blob> {
  const layout = layoutMindmap(root);
  return rasterizeSvgToPng(
    buildMindmapSvg(root),
    layout.width,
    layout.height,
    scale
  );
}

export function rasterizeSvgToPng(
  svg: string,
  width: number,
  height: number,
  scale = 2
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const requestedScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    const safeScale = Math.min(
      requestedScale,
      MAX_PNG_DIMENSION / Math.max(width, 1),
      MAX_PNG_DIMENSION / Math.max(height, 1)
    );
    const svgBlob = new Blob([svg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(
        MAX_PNG_DIMENSION,
        Math.ceil(width * safeScale)
      );
      canvas.height = Math.min(
        MAX_PNG_DIMENSION,
        Math.ceil(height * safeScale)
      );
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas rendering is not available."));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) resolve(blob);
        else reject(new Error("Unable to encode the PNG image."));
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to load the mind map SVG."));
    };
    image.src = objectUrl;
  });
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
