"use client";

import React, { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  layoutMindmap,
  NODE_LINE_HEIGHT,
  NODE_LINK_HEIGHT,
  type LayoutNode,
} from "@/lib/mindmap/layout";
import { getBranchColor, getBranchStrokeWidth } from "@/lib/mindmap/colors";
import { buildMindmapPng, sanitizeFilename } from "@/lib/mindmap/export";
import {
  countDescendants,
  formatHiddenDescendantCount,
  setAllBranchesCollapsed,
  updateNode,
} from "@/lib/mindmap/tree";
import { toPublicMindmapNode } from "@/lib/mindmap/public";
import type { NodeData } from "@/lib/types";

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
  const dragRef = useRef<DragState | null>(null);
  const layout = useMemo(() => layoutMindmap(root), [root]);

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
        await buildMindmapPng(root),
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
        <div>
          <span>Read-only public view</span>
          <h1>{root.topic}</h1>
        </div>
        <div className="public-mindmap-actions">
          <button type="button" onClick={copyLink}>Copy link</button>
          <button type="button" onClick={exportPng}>Export PNG</button>
          <button
            type="button"
            onClick={() => setRoot((current) => setAllBranchesCollapsed(current, false))}
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={() => setRoot((current) => setAllBranchesCollapsed(current, true))}
          >
            Collapse all
          </button>
        </div>
      </header>

      <div className="public-mindmap-canvas-wrap">
        <svg
          className={`mindmap-canvas public-mindmap-canvas${isPanning ? " is-panning" : ""}`}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
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
            const bounds = event.currentTarget.getBoundingClientRect();
            setPan({
              x: drag.panX + (event.clientX - drag.x) * (layout.width / Math.max(1, bounds.width)),
              y: drag.panY + (event.clientY - drag.y) * (layout.height / Math.max(1, bounds.height)),
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
          <rect width="100%" height="100%" className="mindmap-canvas-background" />
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {layout.edges.map((edge) => (
              <path
                key={`${edge.parentId}-${edge.childId}`}
                d={connectorPath(edge.startX, edge.startY, edge.endX, edge.endY)}
                fill="none"
                stroke={getBranchColor(edge.branchIndex, edge.depth)}
                strokeWidth={getBranchStrokeWidth(edge.depth)}
                className="mindmap-edge"
              />
            ))}
            {layout.nodes.map((item) => (
              <PublicNode key={item.node.id} item={item} onToggle={toggleBranch} />
            ))}
          </g>
        </svg>

        <div className="mindmap-toolbar public-mindmap-toolbar" aria-label="Public map controls">
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-0.1)}>−</button>
          <span className="mindmap-zoom-level" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(0.1)}>+</button>
          <button type="button" aria-label="Center map" onClick={centerMap}>⌾</button>
        </div>
      </div>
    </main>
  );
}

function PublicNode({ item, onToggle }: { item: LayoutNode; onToggle: (node: NodeData) => void }) {
  const { node, x, y, width, height, depth, lines, branchIndex } = item;
  const topicHeight = lines.length * NODE_LINE_HEIGHT;
  const linkHeight = node.externalLink ? NODE_LINK_HEIGHT : 0;
  const contentTop = Math.max(0, (height - topicHeight - linkHeight) / 2);
  const textX = depth === 0 ? width / 2 : 8;
  const textAnchor = depth === 0 ? "middle" : "start";
  const lineY = contentTop + topicHeight + 1;
  const branchColor = getBranchColor(branchIndex, depth);

  return (
    <g className="mindmap-node public-mindmap-node" transform={`translate(${x} ${y})`}>
      {depth === 0 ? (
        <rect className="mindmap-root-shape" width={width} height={height} rx={Math.min(22, height / 2)} />
      ) : null}
      <text
        className={`mindmap-node-topic${depth === 1 ? " is-first-level" : ""}`}
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
      {depth >= 1 ? (
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
            ↗ Open external link
          </text>
        </a>
      ) : null}
      {node.children?.length ? (
        <g
          role="button"
          tabIndex={0}
          aria-label={`${node.collapsed ? "Expand" : "Collapse"} ${node.topic} branch`}
          className="mindmap-collapse-toggle"
          data-viewer-control="true"
          transform={`translate(${width + 12} ${depth === 0 ? height / 2 : lineY})`}
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

function connectorPath(startX: number, startY: number, endX: number, endY: number) {
  const midpoint = (startX + endX) / 2;
  return `M ${startX} ${startY} C ${midpoint} ${startY}, ${midpoint} ${endY}, ${endX} ${endY}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
