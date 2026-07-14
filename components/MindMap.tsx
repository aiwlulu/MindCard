"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import Card from "./Card";
import ShortcutGuide from "./ShortcutGuide";
import { MindmapContext } from "@/lib/store/mindmap-context";
import {
  layoutMindmap,
  NODE_LINE_HEIGHT,
  NODE_LINK_HEIGHT,
  type LayoutNode,
} from "@/lib/mindmap/layout";
import { getBranchColor, getBranchStrokeWidth } from "@/lib/mindmap/colors";
import { formatExternalLinkLabel, normalizeExternalUrl } from "@/lib/mindmap/links";
import { parsePastedOutline } from "@/lib/mindmap/outline";
import {
  cloneNodeWithNewIds,
  countDescendants,
  createNode,
  findNode,
  formatHiddenDescendantCount,
  insertChild,
  insertSibling,
  moveNode,
  moveNodesAsChildren,
  removeNode,
  setAllBranchesCollapsed,
  updateNode,
} from "@/lib/mindmap/tree";
import type { MindmapData, NodeData } from "@/lib/types";

interface MindMapProps {
  id: string | null;
}

interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
}

interface PanState {
  x: number;
  y: number;
}

interface NodeDragState {
  nodeIds: string[];
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
}

type TreeUpdater = (root: NodeData) => NodeData;

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 8;

export default function MindMap({ id }: MindMapProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; pan: PanState } | null>(null);
  const nodeDragRef = useRef<NodeDragState | null>(null);
  const clipboardRef = useRef<NodeData | null>(null);
  const {
    exportMindMap,
    mindmapData,
    loadMindmap,
    saveMindmap,
    selectedNode,
    setSelectedNode,
    updateMindmapData,
    updateNodeHyperlink,
  } = React.useContext(MindmapContext);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const [history, setHistory] = useState<MindmapData[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    () => new Set()
  );
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [externalLinkNodeId, setExternalLinkNodeId] = useState<string | null>(
    null
  );
  const [externalLinkDraft, setExternalLinkDraft] = useState("");

  const root = mindmapData?.root ?? mindmapData?.nodeData ?? null;
  const layout = useMemo(() => (root ? layoutMindmap(root) : null), [root]);
  const currentSelectedNode = useMemo(
    () =>
      selectedNode && root
        ? findNode(root, selectedNode.id) ?? selectedNode
        : selectedNode,
    [root, selectedNode]
  );
  const contextMenuNode = useMemo(
    () =>
      contextMenu && root ? findNode(root, contextMenu.nodeId) : null,
    [contextMenu, root]
  );

  useEffect(() => {
    if (id) void loadMindmap(id);
    setPan({ x: 0, y: 0 });
    setHistory([]);
    setSelectedNodeIds(new Set());
  }, [id, loadMindmap]);

  useEffect(() => {
    if (!editingNodeId) {
      editorRef.current?.focus({ preventScroll: true });
    }
  }, [editingNodeId, id]);

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);
    window.addEventListener("mousedown", closeContextMenu);
    return () => window.removeEventListener("mousedown", closeContextMenu);
  }, []);

  const commitData = useCallback(
    (updater: TreeUpdater) => {
      if (!mindmapData) return;

      const nextRoot = updater(mindmapData.nodeData);
      if (nextRoot === mindmapData.nodeData) return;

      setHistory((previous) => [...previous.slice(-39), mindmapData]);
      updateMindmapData((current) => {
        if (!current) return current;
        return {
          ...current,
          nodeData:
            current === mindmapData ? nextRoot : updater(current.nodeData),
        };
      });
    },
    [mindmapData, updateMindmapData]
  );

  const selectNode = useCallback(
    (node: NodeData, additive = false) => {
      setSelectedNodeIds((current) => {
        if (!additive) return new Set([node.id]);

        const next = new Set(current);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
      setSelectedNode(node);
      editorRef.current?.focus();
    },
    [setSelectedNode]
  );

  const startEditing = useCallback(
    (node: NodeData) => {
      selectNode(node);
      setEditingNodeId(node.id);
      setEditingTopic(node.topic);
      setContextMenu(null);
    },
    [selectNode]
  );

  const finishEditing = useCallback(() => {
    if (!editingNodeId) return;
    const nextTopic = editingTopic.trim();
    const node = root ? findNode(root, editingNodeId) : null;

    if (node && nextTopic && nextTopic !== node.topic) {
      const externalLink = normalizeExternalUrl(nextTopic);
      commitData((tree) =>
        updateNode(tree, editingNodeId, (current) => ({
          ...current,
          topic: externalLink
            ? formatExternalLinkLabel(externalLink)
            : nextTopic,
          ...(externalLink ? { externalLink } : {}),
        }))
      );
    }

    setEditingNodeId(null);
    setEditingTopic("");
  }, [commitData, editingNodeId, editingTopic, root]);

  const addNode = useCallback(
    (kind: "child" | "sibling", nodeId: string) => {
      const newNode = createNode();
      commitData((tree) => {
        const expandedTree =
          kind === "child"
            ? updateNode(tree, nodeId, (node) => ({
                ...node,
                collapsed: false,
              }))
            : tree;
        return kind === "child"
          ? insertChild(expandedTree, nodeId, newNode)
          : insertSibling(expandedTree, nodeId, newNode);
      });
      setSelectedNode(newNode);
      setSelectedNodeIds(new Set([newNode.id]));
      setEditingNodeId(newNode.id);
      setEditingTopic(newNode.topic);
      setContextMenu(null);
    },
    [commitData, setSelectedNode]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const node = root ? findNode(root, nodeId) : null;
      if (node?.root) {
        toast.error("The root node cannot be deleted.", { autoClose: 1500 });
        return;
      }

      commitData((tree) => removeNode(tree, nodeId).root);
      setSelectedNode(null);
      setSelectedNodeIds(new Set());
      setContextMenu(null);
    },
    [commitData, root, setSelectedNode]
  );

  const toggleBranch = useCallback(
    (nodeId: string) => {
      const node = root ? findNode(root, nodeId) : null;
      if (!node?.children?.length) return;

      commitData((tree) =>
        updateNode(tree, nodeId, (current) => ({
          ...current,
          collapsed: !current.collapsed,
        }))
      );
      setContextMenu(null);
    },
    [commitData, root]
  );

  const setAllBranches = useCallback(
    (collapsed: boolean) => {
      commitData((tree) => setAllBranchesCollapsed(tree, collapsed));
      setContextMenu(null);
    },
    [commitData]
  );

  const startExternalLinkEditing = useCallback((node: NodeData) => {
    setExternalLinkNodeId(node.id);
    setExternalLinkDraft(node.externalLink ?? "");
  }, []);

  const saveExternalLink = useCallback(() => {
    if (!externalLinkNodeId) return;
    const externalLink = normalizeExternalUrl(externalLinkDraft);
    if (!externalLink) {
      toast.error("Enter a valid http or https URL.", { autoClose: 1500 });
      return;
    }

    commitData((tree) =>
      updateNode(tree, externalLinkNodeId, (node) => ({
        ...node,
        externalLink,
      }))
    );
    setExternalLinkNodeId(null);
    setExternalLinkDraft("");
  }, [commitData, externalLinkDraft, externalLinkNodeId]);

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    updateMindmapData(previous);
    setSelectedNode(null);
    setSelectedNodeIds(new Set());
  }, [history, setSelectedNode, updateMindmapData]);

  const pasteContent = useCallback((text: string): boolean => {
    if (!currentSelectedNode) return false;

    const clipboardNode = parseClipboardNode(text);
    if (clipboardNode) {
      const pasted = cloneNodeWithNewIds(clipboardNode);
      commitData((tree) => insertSibling(tree, currentSelectedNode.id, pasted));
      setSelectedNode(pasted);
      return true;
    }

    const outline = parsePastedOutline(text);
    if (!outline.length) return false;

    commitData((tree) =>
      updateNode(tree, currentSelectedNode.id, (node) => ({
        ...node,
        collapsed: false,
        children: [...(node.children ?? []), ...outline],
      }))
    );
    return true;
  }, [commitData, currentSelectedNode, setSelectedNode]);

  const pasteNode = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;

    try {
      const text = await navigator.clipboard.readText();
      if (!pasteContent(text) && clipboardRef.current) {
        pasteContent(JSON.stringify(clipboardRef.current));
      }
    } catch {
      if (clipboardRef.current) {
        pasteContent(JSON.stringify(clipboardRef.current));
      }
    }
  }, [pasteContent]);

  const centerMap = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const zoomBy = useCallback(
    (delta: number, clientPoint?: { x: number; y: number }) => {
      const nextZoom = clampZoom(zoom + delta);
      if (nextZoom === zoom) return;

      const svg = svgRef.current;
      if (clientPoint && svg && layout) {
        const bounds = svg.getBoundingClientRect();
        if (bounds.width && bounds.height) {
          const pointX =
            ((clientPoint.x - bounds.left) / bounds.width) * layout.width;
          const pointY =
            ((clientPoint.y - bounds.top) / bounds.height) * layout.height;
          setPan((current) => ({
            x: current.x + (zoom - nextZoom) * pointX,
            y: current.y + (zoom - nextZoom) * pointY,
          }));
        }
      }

      setZoom(nextZoom);
    },
    [layout, zoom]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (editingNodeId) return;
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const selectedId = currentSelectedNode?.id;
      const commandKey = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (commandKey && key === "s") {
        event.preventDefault();
        void saveMindmap();
        return;
      }
      if (commandKey && key === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if (commandKey && key === "c" && currentSelectedNode && !currentSelectedNode.root) {
        event.preventDefault();
        clipboardRef.current = currentSelectedNode;
        void navigator.clipboard?.writeText(JSON.stringify(currentSelectedNode));
        return;
      }
      if (commandKey && key === "v") {
        event.preventDefault();
        void pasteNode();
        return;
      }
      if (commandKey && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        zoomBy(0.1);
        return;
      }
      if (commandKey && event.key === "-") {
        event.preventDefault();
        zoomBy(-0.1);
        return;
      }
      if (commandKey && event.key === "0") {
        event.preventDefault();
        centerMap();
        return;
      }
      if (event.key === "F1") {
        event.preventDefault();
        centerMap();
        return;
      }
      if (event.key === "F2" && currentSelectedNode) {
        event.preventDefault();
        startEditing(currentSelectedNode);
        return;
      }
      if (!selectedId) return;

      if (
        !event.altKey &&
        (event.key === "ArrowLeft" ||
          event.key === "ArrowRight" ||
          event.key === "ArrowUp" ||
          event.key === "ArrowDown")
      ) {
        const currentLayout = findLayoutNode(layout?.nodes, selectedId);
        let targetNode: NodeData | null = null;

        if (event.key === "ArrowRight") {
          targetNode =
            currentLayout?.side === "center"
              ? layout?.nodes.find(
                  (item) => item.depth === 1 && item.side === "right"
                )?.node ?? null
              : currentSelectedNode?.collapsed
                ? null
                : currentSelectedNode?.children?.[0] ?? null;
        } else if (event.key === "ArrowLeft") {
          targetNode =
            currentLayout?.side === "center"
              ? null
              : findParentNode(root, selectedId);
        } else if (layout?.nodes.length) {
          const orderedNodes = [...layout.nodes].sort(
            (first, second) => first.y - second.y || first.x - second.x
          );
          const currentIndex = orderedNodes.findIndex(
            (item) => item.node.id === selectedId
          );
          const offset = event.key === "ArrowUp" ? -1 : 1;
          targetNode = orderedNodes[currentIndex + offset]?.node ?? null;
        }

        if (targetNode) {
          event.preventDefault();
          selectNode(targetNode);
          return;
        }
      }

      if (event.key === "Enter") {
        event.preventDefault();
        addNode(currentSelectedNode?.root ? "child" : "sibling", selectedId);
      } else if (event.key === "Tab") {
        event.preventDefault();
        addNode("child", selectedId);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteNode(selectedId);
      } else if (event.key === "PageUp" || (event.altKey && event.key === "ArrowUp")) {
        event.preventDefault();
        commitData((tree) => moveNode(tree, selectedId, "up"));
      } else if (event.key === "PageDown" || (event.altKey && event.key === "ArrowDown")) {
        event.preventDefault();
        commitData((tree) => moveNode(tree, selectedId, "down"));
      } else if (event.key === " " && currentSelectedNode?.children?.length) {
        event.preventDefault();
        toggleBranch(selectedId);
      }
    },
    [
      addNode,
      centerMap,
      commitData,
      deleteNode,
      editingNodeId,
      pasteNode,
      layout,
      root,
      saveMindmap,
      selectNode,
      currentSelectedNode,
      startEditing,
      toggleBranch,
      undo,
      zoomBy,
    ]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!event.dataTransfer.types.includes("card/json")) return;

      try {
        const card = JSON.parse(event.dataTransfer.getData("card/json")) as {
          id?: string;
        };
        if (selectedNode && card.id) {
          void updateNodeHyperlink(selectedNode.id, { id: card.id });
          setSelectedNode(null);
        }
      } catch {
        toast.error("Invalid card data.", { autoClose: 1500 });
      }
    },
    [selectedNode, setSelectedNode, updateNodeHyperlink]
  );

  const handleNodePointerDown = useCallback(
    (event: React.PointerEvent<SVGGElement>, node: NodeData) => {
      if (event.button !== 0 || node.root) return;
      const nodeIds = selectedNodeIds.has(node.id)
        ? [...selectedNodeIds]
        : [node.id];
      nodeDragRef.current = {
        nodeIds,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [selectedNodeIds]
  );

  const handleNodePointerMove = useCallback(
    (event: React.PointerEvent<SVGGElement>) => {
      const drag = nodeDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const distance = Math.hypot(
        event.clientX - drag.startX,
        event.clientY - drag.startY
      );
      if (!drag.moved && distance < 6) return;
      drag.moved = true;

      const target = document
        .elementFromPoint?.(event.clientX, event.clientY)
        ?.closest("[data-node-id]") as SVGGElement | null | undefined;
      const targetId = target?.dataset.nodeId ?? null;
      setDropTargetId(
        targetId && !drag.nodeIds.includes(targetId) ? targetId : null
      );
    },
    []
  );

  const handleNodePointerUp = useCallback(
    (event: React.PointerEvent<SVGGElement>) => {
      const drag = nodeDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      if (drag.moved && dropTargetId) {
        commitData((tree) =>
          moveNodesAsChildren(tree, drag.nodeIds, dropTargetId)
        );
        setSelectedNodeIds(new Set(drag.nodeIds));
      }

      nodeDragRef.current = null;
      setDropTargetId(null);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
    [commitData, dropTargetId]
  );

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const target = event.target as SVGElement;
    if (
      event.target !== event.currentTarget &&
      target.dataset.canvasBackground !== "true"
    ) {
      return;
    }
    if (
      event.pointerType !== "touch" &&
      event.pointerType !== "pen" &&
      event.button !== 1
    ) {
      return;
    }
    editorRef.current?.focus({ preventScroll: true });
    panStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      pan,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!panStartRef.current) return;
    const start = panStartRef.current;
    const bounds = event.currentTarget.getBoundingClientRect();
    const scaleX = layout && bounds.width ? layout.width / bounds.width : 1;
    const scaleY = layout && bounds.height ? layout.height / bounds.height : 1;
    setPan({
      x: start.pan.x + (event.clientX - start.pointerX) * scaleX,
      y: start.pan.y + (event.clientY - start.pointerY) * scaleY,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (panStartRef.current) {
      panStartRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!editorRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void editorRef.current.requestFullscreen();
    }
  }, []);

  const removeHyperlink = () => {
    if (currentSelectedNode) {
      void updateNodeHyperlink(currentSelectedNode.id, "");
    } else {
      toast.error("Please select a node first", { autoClose: 1500 });
    }
  };

  const openLinkedMindMap = useCallback((mindmapId: string) => {
    openInNewTab(`/mindmap/${mindmapId}`);
  }, []);

  const openExternalLink = useCallback((url: string) => {
    openInNewTab(url);
  }, []);

  return (
    <div
      ref={editorRef}
      className="mindmap-editor"
      tabIndex={0}
      role="application"
      aria-label="Mind map editor"
      onKeyDown={handleKeyDown}
      onPaste={(event) => {
        if (editingNodeId) return;
        const text = event.clipboardData.getData("text/plain");
        if (pasteContent(text)) event.preventDefault();
      }}
      onDrop={handleDrop}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("card/json")) event.preventDefault();
      }}
    >
      <div className="mindmap-commandbar" aria-label="Mind map actions">
        {currentSelectedNode ? (
          <>
            <span className="mindmap-commandbar-topic" title={currentSelectedNode.topic}>
              {currentSelectedNode.topic}
            </span>
            <span className="mindmap-commandbar-divider" aria-hidden="true" />
            <button type="button" onClick={() => addNode("child", currentSelectedNode.id)}>
              + Child <kbd>Tab</kbd>
            </button>
            {!currentSelectedNode.root && (
              <button type="button" onClick={() => addNode("sibling", currentSelectedNode.id)}>
                + Sibling <kbd>Enter</kbd>
              </button>
            )}
            <button type="button" onClick={() => startEditing(currentSelectedNode)}>
              Edit <kbd>F2</kbd>
            </button>
            <button
              type="button"
              aria-label={
                currentSelectedNode.externalLink
                  ? "Edit external link"
                  : "Add external link"
              }
              onClick={() => startExternalLinkEditing(currentSelectedNode)}
            >
              External link
            </button>
            {externalLinkNodeId === currentSelectedNode.id ? (
              <>
                <input
                  type="url"
                  aria-label="External URL"
                  className="mindmap-commandbar-input"
                  placeholder="https://example.com"
                  value={externalLinkDraft}
                  onChange={(event) => setExternalLinkDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveExternalLink();
                    if (event.key === "Escape") setExternalLinkNodeId(null);
                  }}
                />
                <button
                  type="button"
                  aria-label="Save external link"
                  onClick={saveExternalLink}
                >
                  Apply
                </button>
              </>
            ) : null}
            {currentSelectedNode.children?.length ? (
              <button
                type="button"
                aria-label={currentSelectedNode.collapsed ? "Expand branch" : "Collapse branch"}
                onClick={() => toggleBranch(currentSelectedNode.id)}
              >
                {currentSelectedNode.collapsed ? "Expand branch" : "Collapse branch"} <kbd>Space</kbd>
              </button>
            ) : null}
          </>
        ) : (
          <span className="mindmap-commandbar-hint">Select a node to show quick actions</span>
        )}
        <button
          type="button"
          aria-label="Expand all branches"
          onClick={() => setAllBranches(false)}
        >
          Expand all
        </button>
        <button
          type="button"
          aria-label="Collapse all branches"
          onClick={() => setAllBranches(true)}
        >
          Collapse all
        </button>
        <span className="mindmap-commandbar-spacer" />
        <button
          type="button"
          aria-label="Export image"
          onClick={() => void exportMindMap("svg")}
        >
          Export SVG
        </button>
        <button
          type="button"
          aria-label="Export Markdown"
          onClick={() => void exportMindMap("markdown")}
        >
          Export MD
        </button>
      </div>
      <div className="showcase">
        <div className="block">
          {layout ? (
            <svg
              ref={svgRef}
              className="mindmap-canvas"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Mind map"
              onWheel={(event) => {
                event.preventDefault();
                zoomBy(event.deltaY < 0 ? 0.08 : -0.08, {
                  x: event.clientX,
                  y: event.clientY,
                });
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <rect
                width="100%"
                height="100%"
                className="mindmap-canvas-background"
                data-canvas-background="true"
              />
              <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                {layout.edges.map((edge) => (
                  <path
                    key={`${edge.parentId}-${edge.childId}`}
                    d={connectorPath(edge.startX, edge.startY, edge.endX, edge.endY)}
                    fill="none"
                    stroke={getBranchColor(edge.branchIndex, edge.depth)}
                    strokeWidth={getBranchStrokeWidth(edge.depth)}
                    data-branch-index={edge.branchIndex}
                    className={`mindmap-edge mindmap-edge-${edge.side}`}
                  />
                ))}
                {layout.nodes.map((item) => (
                  <MindMapNode
                    key={item.node.id}
                    item={item}
                    selected={
                      selectedNodeIds.size
                        ? selectedNodeIds.has(item.node.id)
                        : currentSelectedNode?.id === item.node.id
                    }
                    dropTarget={dropTargetId === item.node.id}
                    editing={editingNodeId === item.node.id}
                    editingTopic={editingTopic}
                    onSelect={selectNode}
                    onEdit={startEditing}
                    onEditTopic={setEditingTopic}
                    onCommitEdit={finishEditing}
                    onOpenLink={openLinkedMindMap}
                    onOpenExternalLink={openExternalLink}
                    onToggleBranch={toggleBranch}
                    onPointerDown={handleNodePointerDown}
                    onPointerMove={handleNodePointerMove}
                    onPointerUp={handleNodePointerUp}
                    onContextMenu={(event, node) => {
                      event.preventDefault();
                      selectNode(node);
                      setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
                    }}
                  />
                ))}
              </g>
            </svg>
          ) : (
            <div className="flex h-[90vh] items-center justify-center text-slate-400">
              Loading mind map…
            </div>
          )}
        </div>
        <div className="hidden lg:block">
          <ShortcutGuide />
        </div>
        <div className="hidden lg:block">
          <Card currentMindmapId={id} removeHyperlink={removeHyperlink} />
        </div>
      </div>

      <div className="mindmap-toolbar" aria-label="Map controls">
        <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => zoomBy(-0.1)}>−</button>
        <span className="mindmap-zoom-level" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => zoomBy(0.1)}>+</button>
        <button type="button" title="Center map" aria-label="Center map" onClick={centerMap}>⌾</button>
        <button type="button" title="Fullscreen" aria-label="Fullscreen" onClick={toggleFullscreen}>⛶</button>
      </div>

      {contextMenu && (
        <div
          role="menu"
          className="mindmap-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button role="menuitem" onClick={() => addNode("child", contextMenu.nodeId)}>Add child</button>
          {!contextMenuNode?.root ? (
            <button role="menuitem" onClick={() => addNode("sibling", contextMenu.nodeId)}>Add sibling</button>
          ) : null}
          <button
            role="menuitem"
            onClick={() => {
              if (contextMenuNode) startEditing(contextMenuNode);
            }}
          >
            Rename
          </button>
          {contextMenuNode?.children?.length ? (
            <button
              role="menuitem"
              onClick={() => toggleBranch(contextMenu.nodeId)}
            >
              {contextMenuNode.collapsed
                ? "Expand branch"
                : "Collapse branch"}
            </button>
          ) : null}
          {!contextMenuNode?.root ? (
            <button role="menuitem" onClick={() => deleteNode(contextMenu.nodeId)}>Delete</button>
          ) : null}
        </div>
      )}
    </div>
  );
}

interface MindMapNodeProps {
  item: LayoutNode;
  selected: boolean;
  dropTarget: boolean;
  editing: boolean;
  editingTopic: string;
  onSelect: (node: NodeData, additive?: boolean) => void;
  onEdit: (node: NodeData) => void;
  onEditTopic: (topic: string) => void;
  onCommitEdit: () => void;
  onOpenLink: (mindmapId: string) => void;
  onOpenExternalLink: (url: string) => void;
  onToggleBranch: (nodeId: string) => void;
  onPointerDown: (event: React.PointerEvent<SVGGElement>, node: NodeData) => void;
  onPointerMove: (event: React.PointerEvent<SVGGElement>) => void;
  onPointerUp: (event: React.PointerEvent<SVGGElement>) => void;
  onContextMenu: (event: React.MouseEvent<SVGGElement>, node: NodeData) => void;
}

function MindMapNode({
  item,
  selected,
  dropTarget,
  editing,
  editingTopic,
  onSelect,
  onEdit,
  onEditTopic,
  onCommitEdit,
  onOpenLink,
  onOpenExternalLink,
  onToggleBranch,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}: MindMapNodeProps) {
  const [isComposing, setIsComposing] = useState(false);
  const { node, x, y, width, height, depth, lines, branchIndex } = item;
  const isRoot = depth === 0;
  const isFirstLevel = depth === 1;
  const topicBlockHeight = lines.length * NODE_LINE_HEIGHT;
  const linkCount = Number(Boolean(node.hyperLink)) + Number(Boolean(node.externalLink));
  const linkHeight = linkCount * NODE_LINK_HEIGHT;
  const contentTop = Math.max(0, (height - topicBlockHeight - linkHeight) / 2);
  const firstBaseline = contentTop + 16;
  const textX = isRoot ? width / 2 : 8;
  const textAnchor = isRoot ? "middle" : "start";
  const underlineY = contentTop + topicBlockHeight + 1;
  const collapseX = width + 12;
  const branchColor = getBranchColor(branchIndex, depth);
  const hiddenDescendantCount = node.children?.length
    ? countDescendants(node)
    : 0;
  const collapseLabel = node.collapsed
    ? formatHiddenDescendantCount(hiddenDescendantCount)
    : "−";
  const collapseWidth = Math.max(18, collapseLabel.length * 7 + 8);

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={node.topic}
      data-node-id={node.id}
      data-node-depth={depth}
      transform={`translate(${x} ${y})`}
      className={`mindmap-node${dropTarget ? " is-drop-target" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node, event.ctrlKey || event.metaKey);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onEdit(node);
      }}
      onContextMenu={(event) => onContextMenu(event, node)}
      onPointerDown={(event) => onPointerDown(event, node)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {isRoot ? (
        <rect
          width={width}
          height={height}
          rx={Math.min(22, height / 2)}
          className={`mindmap-root-shape${selected ? " is-selected" : ""}`}
        />
      ) : selected || dropTarget ? (
        <rect
          x="-5"
          y="-3"
          width={width + 10}
          height={height + 6}
          rx="8"
          className="mindmap-node-selection"
        />
      ) : null}
      {editing ? (
        <foreignObject x="0" y="0" width={width} height={height}>
          <input
            autoFocus
            value={editingTopic}
            aria-label={`Edit ${node.topic}`}
            className="mindmap-node-input"
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => onEditTopic(event.target.value)}
            onBlur={onCommitEdit}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (
                isComposing ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229
              ) {
                return;
              }
              if (event.key === "Enter") {
                event.preventDefault();
                onCommitEdit();
              }
              if (event.key === "Escape") onCommitEdit();
            }}
          />
        </foreignObject>
      ) : (
        <>
          <text
            x={textX}
            y={firstBaseline}
            textAnchor={textAnchor}
            className={`mindmap-node-topic${isFirstLevel ? " is-first-level" : ""}`}
          >
            {lines.map((line, index) => (
              <tspan
                key={`${node.id}-line-${index}`}
                x={textX}
                dy={index === 0 ? 0 : NODE_LINE_HEIGHT}
              >
                {line}
              </tspan>
            ))}
          </text>
          {!isRoot ? (
            <line
              x1="0"
              x2={width}
              y1={underlineY}
              y2={underlineY}
              stroke={branchColor}
              strokeWidth={getBranchStrokeWidth(depth)}
              className="mindmap-node-underline"
            />
          ) : null}
          {node.hyperLink && (
            <a
              href={`/mindmap/${node.hyperLink}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open linked mind map"
              className="mindmap-node-link"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpenLink(node.hyperLink as string);
              }}
            >
              <text
                x={textX}
                y={contentTop + topicBlockHeight + 14}
                textAnchor={textAnchor}
              >
                ↗ Open card link
              </text>
            </a>
          )}
          {node.externalLink && (
            <a
              href={node.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open external link"
              className="mindmap-node-link"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpenExternalLink(node.externalLink as string);
              }}
            >
              <text
                x={textX}
                y={
                  contentTop +
                  topicBlockHeight +
                  14 +
                  (node.hyperLink ? NODE_LINK_HEIGHT : 0)
                }
                textAnchor={textAnchor}
              >
                ↗ Open external link
              </text>
            </a>
          )}
          {!isRoot && node.children?.length ? (
            <g
              role="button"
              tabIndex={0}
              aria-label={
                node.collapsed
                  ? `Expand ${node.topic} branch, ${hiddenDescendantCount} hidden nodes`
                  : `Collapse ${node.topic} branch`
              }
              className="mindmap-collapse-toggle"
              data-branch-index={branchIndex ?? undefined}
              transform={`translate(${collapseX} ${underlineY})`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleBranch(node.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleBranch(node.id);
                }
              }}
            >
              <rect
                x={-collapseWidth / 2}
                y="-9"
                width={collapseWidth}
                height="18"
                rx="9"
                stroke={branchColor}
              />
              <text textAnchor="middle" dominantBaseline="central">
                {collapseLabel}
              </text>
            </g>
          ) : null}
        </>
      )}
    </g>
  );
}

function findLayoutNode(nodes: LayoutNode[] | undefined, nodeId: string): LayoutNode | null {
  return nodes?.find((item) => item.node.id === nodeId) ?? null;
}

function findParentNode(root: NodeData | null, nodeId: string): NodeData | null {
  if (!root?.children?.length) return null;
  if (root.children.some((child) => child.id === nodeId)) return root;

  for (const child of root.children) {
    const parent = findParentNode(child, nodeId);
    if (parent) return parent;
  }

  return null;
}

function connectorPath(startX: number, startY: number, endX: number, endY: number): string {
  const midpoint = (startX + endX) / 2;
  return `M ${startX} ${startY} C ${midpoint} ${startY}, ${midpoint} ${endY}, ${endX} ${endY}`;
}

function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(2))));
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function parseClipboardNode(text: string): NodeData | null {
  try {
    const value = JSON.parse(text) as Partial<NodeData>;
    return typeof value.id === "string" && typeof value.topic === "string"
      ? (value as NodeData)
      : null;
  } catch {
    return null;
  }
}
