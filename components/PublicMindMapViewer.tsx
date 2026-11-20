"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  layoutMindmap,
  NODE_LINE_HEIGHT,
  NODE_LINK_HEIGHT,
  type LayoutNode,
} from "@/lib/mindmap/layout";
import {
  getBranchColor,
  getBranchStrokeWidth,
  isFilledTopic,
} from "@/lib/mindmap/colors";
import {
  buildMindmapPng,
  connectorPath,
  sanitizeFilename,
} from "@/lib/mindmap/export";
import {
  countDescendants,
  formatHiddenDescendantCount,
  setAllBranchesCollapsed,
  updateNode,
} from "@/lib/mindmap/tree";
import { toPublicMindmapNode } from "@/lib/mindmap/public";
import { useTheme } from "@/lib/store/theme-context";
import type { ResolvedTheme } from "@/lib/theme";
import type { NodeData } from "@/lib/types";
import {
  CollapseIcon,
  CopyIcon,
  ExpandIcon,
  FitIcon,
  GlobeIcon,
  ImageIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./Icons";

interface PublicMindMapViewerProps {
  root: NodeData;
}

interface DragState {
  pointerId: number;
  x: number;
  y: number;
  panX: number;
  panY: number;
}

export default function PublicMindMapViewer({ root: sourceRoot }: PublicMindMapViewerProps) {
  const [root, setRoot] = useState(() => toPublicMindmapNode(sourceRoot));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [bounds, setBounds] = useState<{ width: number; height: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const layout = useMemo(() => layoutMindmap(root), [root]);
  const { theme } = useTheme();
  // Keep 100% at real pixel size by never letting the viewBox shrink below the pane.
  const viewBox = {
    width: Math.max(layout.width, bounds?.width ?? 0),
    height: Math.max(layout.height, bounds?.height ?? 0),
  };
  const offset = {
    x: (viewBox.width - layout.width) / 2,
    y: (viewBox.height - layout.height) / 2,
  };

  const measure = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setBounds((current) =>
      current && current.width === rect.width && current.height === rect.height
        ? current
        : { width: rect.width, height: rect.height }
    );
  }, []);

  const attachSvg = useCallback(
    (node: SVGSVGElement | null) => {
      svgRef.current = node;
      if (node) measure();
    },
    [measure]
  );

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const centerMap = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const zoomBy = (delta: number) => {
    setZoom((current) => Math.min(8, Math.max(0.45, current + delta)));
  };

  const toggleBranch = (node: NodeData) => {
    if (!node.children?.length) return;
    setRoot((current) =>
      updateNode(current, node.id, (value) => ({
        ...value,
        collapsed: !value.collapsed,
      }))
    );
  };

  const exportPng = async () => {
    try {
      downloadBlob(
        await buildMindmapPng(root, 2, { theme }),
        `MindCard-${sanitizeFilename(root.topic)}.png`
      );
    } catch {
      toast.error("Unable to export this mind map.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Public link copied.", { autoClose: 1200 });
    } catch {
      toast.error("Unable to copy the public link.");
    }
  };

  return (
    <main className="public-mindmap-viewer">
      <header className="public-mindmap-header">
        <div className="public-mindmap-title">
          <span className="public-mindmap-badge">
            <GlobeIcon size={13} />
            Read-only public view
          </span>
          <h1>{root.topic}</h1>
        </div>
        <div className="public-mindmap-actions">
          <button type="button" onClick={copyLink}>
            <CopyIcon size={15} />
            <span>Copy link</span>
          </button>
          <button type="button" onClick={exportPng}>
            <ImageIcon size={15} />
            <span>Export PNG</span>
          </button>
          <button
            type="button"
            onClick={() => setRoot((current) => setAllBranchesCollapsed(current, false))}
          >
            <ExpandIcon size={15} />
            <span>Expand all</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRoot((current) => setAllBranchesCollapsed(current, true));
              centerMap();
            }}
          >
            <CollapseIcon size={15} />
            <span>Collapse all</span>
          </button>
        </div>
      </header>

      <div className="public-mindmap-canvas-wrap">
        <svg
          ref={attachSvg}
          className={`mindmap-canvas public-mindmap-canvas${isPanning ? " is-panning" : ""}`}
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Public mind map: ${root.topic}`}
          onContextMenu={(event) => event.preventDefault()}
          onWheel={(event) => {
            event.preventDefault();
            zoomBy(event.deltaY < 0 ? 0.08 : -0.08);
          }}
          onPointerDown={(event) => {
            const target = event.target as Element;
            if (target.closest('[data-viewer-control="true"]')) return;
            if (![0, 1, 2].includes(event.button)) return;
            dragRef.current = {
              pointerId: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              panX: pan.x,
              panY: pan.y,
            };
            setIsPanning(true);
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setPan({
              x: drag.panX + (event.clientX - drag.x) * (viewBox.width / Math.max(1, rect.width)),
              y: drag.panY + (event.clientY - drag.y) * (viewBox.height / Math.max(1, rect.height)),
            });
          }}
          onPointerUp={(event) => {
            if (dragRef.current?.pointerId !== event.pointerId) return;
            dragRef.current = null;
            setIsPanning(false);
            event.currentTarget.releasePointerCapture?.(event.pointerId);
          }}
          onPointerCancel={() => {
            dragRef.current = null;
            setIsPanning(false);
          }}
        >
          <defs>
            <pattern
              id="public-dot-grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" className="mindmap-canvas-dot" />
            </pattern>
          </defs>
          <rect x="-200%" y="-200%" width="500%" height="500%" className="mindmap-canvas-background" />
          <rect x="-200%" y="-200%" width="500%" height="500%" fill="url(#public-dot-grid)" className="mindmap-canvas-grid" />
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            <g transform={`translate(${offset.x} ${offset.y})`}>
            {layout.edges.map((edge) => (
              <path
                key={`${edge.parentId}-${edge.childId}`}
                d={connectorPath(edge.startX, edge.startY, edge.endX, edge.endY)}
                fill="none"
                stroke={getBranchColor(edge.branchIndex, edge.depth, theme)}
                strokeWidth={getBranchStrokeWidth(edge.depth)}
                className="mindmap-edge"
              />
            ))}
            {layout.nodes.map((item) => (
              <PublicNode key={item.node.id} item={item} theme={theme} onToggle={toggleBranch} />
            ))}
            </g>
          </g>
        </svg>

        <div className="mindmap-toolbar public-mindmap-toolbar" aria-label="Public map controls">
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-0.1)}>
            <ZoomOutIcon />
          </button>
          <span className="mindmap-zoom-level" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(0.1)}>
            <ZoomInIcon />
          </button>
          <span className="mindmap-toolbar-divider" aria-hidden="true" />
          <button type="button" aria-label="Center map" onClick={centerMap}>
            <FitIcon />
          </button>
        </div>
      </div>
    </main>
  );
}

function PublicNode({
  item,
  theme,
  onToggle,
}: {
  item: LayoutNode;
  theme: ResolvedTheme;
  onToggle: (node: NodeData) => void;
}) {
  const { node, x, y, width, height, depth, lines, branchIndex } = item;
  const filled = isFilledTopic(depth);
  const topicHeight = lines.length * NODE_LINE_HEIGHT;
  const linkHeight = node.externalLink ? NODE_LINK_HEIGHT : 0;
  const contentTop = Math.max(0, (height - topicHeight - linkHeight) / 2);
  const textX = filled ? width / 2 : 8;
  const textAnchor = filled ? "middle" : "start";
  const lineY = contentTop + topicHeight + 1;
  const anchorY = filled ? height / 2 : lineY;
  const branchColor = getBranchColor(branchIndex, depth, theme);
  const shapeRadius = Math.min(depth === 0 ? 14 : 10, height / 2);

  return (
    <g
      className={`mindmap-node public-mindmap-node${filled ? " is-filled" : ""}`}
      data-node-depth={depth}
      transform={`translate(${x} ${y})`}
    >
      {depth === 0 ? (
        <rect className="mindmap-root-shape" width={width} height={height} rx={shapeRadius} />
      ) : null}
      {depth === 1 ? (
        <rect className="mindmap-topic-shape" width={width} height={height} rx={shapeRadius} fill={branchColor} />
      ) : null}
      <text
        className={`mindmap-node-topic${depth === 0 ? " is-root" : ""}${depth === 1 ? " is-first-level" : ""}`}
        x={textX}
        y={contentTop + 16}
        textAnchor={textAnchor}
      >
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={textX} dy={index === 0 ? 0 : NODE_LINE_HEIGHT}>
            {line}
          </tspan>
        ))}
      </text>
      {!filled ? (
        <line
          className="mindmap-node-underline"
          x1={0}
          x2={width}
          y1={lineY}
          y2={lineY}
          stroke={branchColor}
          strokeWidth={getBranchStrokeWidth(depth)}
        />
      ) : null}
      {node.externalLink ? (
        <a
          href={node.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mindmap-node-link"
          data-viewer-control="true"
          aria-label={`Open external link for ${node.topic}`}
        >
          <text x={textX} y={contentTop + topicHeight + 14} textAnchor={textAnchor}>
            Open external link
          </text>
        </a>
      ) : null}
      {node.children?.length ? (
        <g
          role="button"
          tabIndex={0}
          aria-label={`${node.collapsed ? "Expand" : "Collapse"} ${node.topic} branch`}
          className={`mindmap-collapse-toggle${node.collapsed ? " is-collapsed" : ""}`}
          data-viewer-control="true"
          transform={`translate(${width + 12} ${anchorY})`}
          onClick={() => onToggle(node)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onToggle(node);
          }}
        >
          <rect
            x={-9}
            y={-9}
            width={18}
            height={18}
            rx={9}
            stroke={branchColor}
          />
          <text textAnchor="middle" dominantBaseline="central">
            {node.collapsed
              ? formatHiddenDescendantCount(countDescendants(node))
              : "−"}
          </text>
        </g>
      ) : null}
    </g>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
