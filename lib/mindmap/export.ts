import type { NodeData } from "@/lib/types";
import type { ResolvedTheme } from "@/lib/theme";
import {
  layoutMindmap,
  NODE_LINE_HEIGHT,
  NODE_LINK_HEIGHT,
  type LayoutNode,
} from "./layout";
import {
  getBranchColor,
  getBranchStrokeWidth,
  isFilledTopic,
  MAP_PALETTES,
} from "./colors";
import {
  countDescendants,
  formatHiddenDescendantCount,
} from "./tree";

export { convertToMarkdown } from "./markdown";

const MAX_PNG_DIMENSION = 16_384;
const FONT_STACK =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', sans-serif";

export interface ExportOptions {
  theme?: ResolvedTheme;
}

export function buildMindmapSvg(
  root: NodeData,
  options: ExportOptions = {}
): string {
  const theme = options.theme ?? "light";
  const palette = MAP_PALETTES[theme];
  const layout = layoutMindmap(root);
  const edgeMarkup = layout.edges
    .map((edge) => {
      const branchColor = getBranchColor(edge.branchIndex, edge.depth, theme);
      return `<path d="${connectorPath(edge.startX, edge.startY, edge.endX, edge.endY)}" fill="none" stroke="${branchColor}" stroke-width="${getBranchStrokeWidth(edge.depth)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join("");
  const nodeMarkup = layout.nodes
    .map((item) => renderNode(item, theme))
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${escapeXml(root.topic)}"><rect width="100%" height="100%" fill="${palette.canvas}"/>${edgeMarkup}${nodeMarkup}</svg>`;
}

function renderNode(item: LayoutNode, theme: ResolvedTheme): string {
  const { node, x, y, width, height, lines, richLines, depth, branchIndex } = item;
  const palette = MAP_PALETTES[theme];
  const filled = isFilledTopic(depth);
  const topicBlockHeight = lines.length * NODE_LINE_HEIGHT;
  const linkCount =
    Number(Boolean(node.hyperLink)) + Number(Boolean(node.externalLink));
  const linkHeight = linkCount * NODE_LINK_HEIGHT;
  const contentTop = Math.max(0, (height - topicBlockHeight - linkHeight) / 2);
  const textX = filled ? x + width / 2 : x + 8;
  const textAnchor = filled ? "middle" : "start";
  const firstBaseline = y + contentTop + 16;
  const branchColor = getBranchColor(branchIndex, depth, theme);
  const textFill =
    depth === 0
      ? palette.rootText
      : depth === 1
        ? palette.firstLevelText
        : node.bold
          ? palette.boldText
          : palette.topicText;
  const boldFill = filled ? textFill : palette.boldText;
  const textMarkup = richLines
    .map((line, index) => {
      const segmentMarkup = line
        .map((segment) =>
          segment.bold
            ? `<tspan font-weight="700" fill="${boldFill}">${escapeXml(segment.text)}</tspan>`
            : escapeXml(segment.text)
        )
        .join("");
      return `<tspan x="${textX}" dy="${index === 0 ? 0 : NODE_LINE_HEIGHT}">${segmentMarkup}</tspan>`;
    })
    .join("");
  const linkFill = filled ? textFill : palette.linkText;
  const linkMarkup = node.hyperLink
    ? `<a href="/mindmap/${escapeXml(node.hyperLink)}" target="_blank" rel="noopener noreferrer"><text x="${textX}" y="${y + contentTop + topicBlockHeight + 14}" text-anchor="${textAnchor}" fill="${linkFill}" font-size="11" font-family="${FONT_STACK}">Open linked mind map</text></a>`
    : "";
  const externalLinkMarkup = node.externalLink
    ? `<a href="${escapeXml(node.externalLink)}" target="_blank" rel="noopener noreferrer"><text x="${textX}" y="${y + contentTop + topicBlockHeight + 14 + (node.hyperLink ? NODE_LINK_HEIGHT : 0)}" text-anchor="${textAnchor}" fill="${linkFill}" font-size="11" font-family="${FONT_STACK}">Open external link</text></a>`
    : "";
  const radius = Math.min(depth === 0 ? 14 : 10, height / 2);
  const shapeMarkup =
    depth === 0
      ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${palette.rootFill}" stroke="${palette.rootStroke}" stroke-width="1.5"/>`
      : depth === 1
        ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${branchColor}"/>`
        : "";
  const lineY = y + contentTop + topicBlockHeight + 1;
  const underlineMarkup =
    depth >= 2
      ? `<line x1="${x}" x2="${x + width}" y1="${lineY}" y2="${lineY}" stroke="${branchColor}" stroke-width="${getBranchStrokeWidth(depth)}" stroke-linecap="round"/>`
      : "";
  let collapsedMarkup = "";
  if (node.collapsed && node.children?.length) {
    const label = formatHiddenDescendantCount(countDescendants(node));
    const badgeWidth = Math.max(18, label.length * 6 + 8);
    const centerX = x + width + 12;
    const centerY = filled ? y + height / 2 : lineY;
    collapsedMarkup = `<rect x="${centerX - badgeWidth / 2}" y="${centerY - 9}" width="${badgeWidth}" height="18" rx="9" fill="${palette.badgeFill}" stroke="${branchColor}" stroke-width="1.5"/><text x="${centerX}" y="${centerY + 3}" text-anchor="middle" fill="${palette.badgeText}" font-size="9" font-weight="600" font-family="${FONT_STACK}">${label}</text>`;
  }
  const fontWeight = node.bold ? 700 : depth <= 1 ? 600 : 450;
  const fontSize = depth === 0 ? 17 : depth === 1 ? 15 : 14;
  return `<g data-node-id="${escapeXml(node.id)}">${shapeMarkup}<text x="${textX}" y="${firstBaseline}" text-anchor="${textAnchor}" fill="${textFill}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${FONT_STACK}">${textMarkup}</text>${underlineMarkup}${linkMarkup}${externalLinkMarkup}${collapsedMarkup}</g>`;
}

export function connectorPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const midpoint = (startX + endX) / 2;
  return `M ${startX} ${startY} C ${midpoint} ${startY}, ${midpoint} ${endY}, ${endX} ${endY}`;
}

export async function buildMindmapPng(
  root: NodeData,
  scale = 2,
  options: ExportOptions = {}
): Promise<Blob> {
  const layout = layoutMindmap(root);
  return rasterizeSvgToPng(
    buildMindmapSvg(root, options),
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
