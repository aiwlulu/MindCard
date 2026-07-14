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
  type LayoutNode,
} from "@/lib/mindmap/layout";
import {
  cloneNodeWithNewIds,
  createNode,
  insertChild,
  insertSibling,
  moveNode,
  removeNode,
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

type TreeUpdater = (root: NodeData) => NodeData;

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.5;

export default function MindMap({ id }: MindMapProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; pan: PanState } | null>(null);
  const clipboardRef = useRef<NodeData | null>(null);
  const {
    mindmapData,
    loadMindmap,
    saveMindmap,
    selectedNode,
    setSelectedNode,
    updateMindmapData,
    updateNodeHyperlink,
  } = React.useContext(MindmapContext);
  const [showBanner, setShowBanner] = useState(true);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const [history, setHistory] = useState<MindmapData[]>([]);

  const root = mindmapData?.root ?? mindmapData?.nodeData ?? null;
  const layout = useMemo(() => (root ? layoutMindmap(root) : null), [root]);

  useEffect(() => {
    if (id) void loadMindmap(id);
    setPan({ x: 0, y: 0 });
    setHistory([]);
  }, [id, loadMindmap]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowBanner(window.localStorage.getItem("hideGuideBanner") !== "true");
    }
  }, []);

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
      updateMindmapData((current) =>
        current ? { ...current, nodeData: updater(current.nodeData) } : current
      );
    },
    [mindmapData, updateMindmapData]
  );

  const selectNode = useCallback(
    (node: NodeData) => {
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
    const node = root ? findLayoutNode(layout?.nodes, editingNodeId)?.node : null;

    if (node && nextTopic && nextTopic !== node.topic) {
      commitData((tree) =>
        updateNode(tree, editingNodeId, (current) => ({
          ...current,
          topic: nextTopic,
        }))
      );
    }

    setEditingNodeId(null);
    setEditingTopic("");
  }, [commitData, editingNodeId, editingTopic, layout?.nodes, root]);

  const addNode = useCallback(
    (kind: "child" | "sibling", nodeId: string) => {
      const newNode = createNode();
      commitData((tree) =>
        kind === "child"
          ? insertChild(tree, nodeId, newNode)
          : insertSibling(tree, nodeId, newNode)
      );
      setSelectedNode(newNode);
      setEditingNodeId(newNode.id);
      setEditingTopic(newNode.topic);
      setContextMenu(null);
    },
    [commitData, setSelectedNode]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const node = root ? findLayoutNode(layout?.nodes, nodeId)?.node : null;
      if (node?.root) {
        toast.error("The root node cannot be deleted.", { autoClose: 1500 });
        return;
      }

      commitData((tree) => removeNode(tree, nodeId).root);
      setSelectedNode(null);
      setContextMenu(null);
    },
    [commitData, layout?.nodes, root, setSelectedNode]
  );

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    updateMindmapData(previous);
    setSelectedNode(null);
  }, [history, setSelectedNode, updateMindmapData]);

  const pasteNode = useCallback(async () => {
    if (!selectedNode) return;

    let source = clipboardRef.current;
    if (!source && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        const text = await navigator.clipboard.readText();
        source = JSON.parse(text) as NodeData;
      } catch {
        return;
      }
    }
    if (!source) return;

    const pasted = cloneNodeWithNewIds(source);
    commitData((tree) => insertSibling(tree, selectedNode.id, pasted));
    setSelectedNode(pasted);
  }, [commitData, selectedNode, setSelectedNode]);

  const centerMap = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (editingNodeId) return;
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const selectedId = selectedNode?.id;
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
      if (commandKey && key === "c" && selectedNode && !selectedNode.root) {
        event.preventDefault();
        clipboardRef.current = selectedNode;
        void navigator.clipboard?.writeText(JSON.stringify(selectedNode));
        return;
      }
      if (commandKey && key === "v") {
        event.preventDefault();
        void pasteNode();
        return;
      }
      if (commandKey && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        setZoom((value) => clampZoom(value + 0.1));
        return;
      }
      if (commandKey && event.key === "-") {
        event.preventDefault();
        setZoom((value) => clampZoom(value - 0.1));
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
      if (event.key === "F2" && selectedNode) {
        event.preventDefault();
        startEditing(selectedNode);
        return;
      }
      if (!selectedId) return;

      if (event.key === "Enter") {
        event.preventDefault();
        addNode("sibling", selectedId);
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
      }
    },
    [
      addNode,
      centerMap,
      commitData,
      deleteNode,
      editingNodeId,
      pasteNode,
      saveMindmap,
      selectedNode,
      startEditing,
      undo,
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

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return;
    panStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      pan,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!panStartRef.current) return;
    const start = panStartRef.current;
    setPan({
      x: start.pan.x + event.clientX - start.pointerX,
      y: start.pan.y + event.clientY - start.pointerY,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (panStartRef.current) {
      panStartRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
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

  const handleCloseBanner = () => {
    setShowBanner(false);
    window.localStorage.setItem("hideGuideBanner", "true");
  };

  const removeHyperlink = () => {
    if (selectedNode) {
      void updateNodeHyperlink(selectedNode.id, "");
    } else {
      toast.error("Please select a node first", { autoClose: 1500 });
    }
  };

  return (
    <div
      ref={editorRef}
      className="relative bg-gray-900 text-gray-200 mindmap-editor"
      tabIndex={0}
      role="application"
      aria-label="Mind map editor"
      onKeyDown={handleKeyDown}
      onDrop={handleDrop}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("card/json")) event.preventDefault();
      }}
    >
      {showBanner && <GuideBanner onClose={handleCloseBanner} />}
      <div className="showcase">
        <div className="block">
          {layout ? (
            <svg
              className="mindmap-canvas"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              role="img"
              aria-label="Mind map"
              onWheel={(event) => {
                event.preventDefault();
                setZoom((value) => clampZoom(value + (event.deltaY < 0 ? 0.08 : -0.08)));
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <rect width="100%" height="100%" fill="#111827" />
              <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                {layout.edges.map((edge) => (
                  <path
                    key={`${edge.parentId}-${edge.childId}`}
                    d={connectorPath(edge.startX, edge.startY, edge.endX, edge.endY)}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                  />
                ))}
                {layout.nodes.map((item) => (
                  <MindMapNode
                    key={item.node.id}
                    item={item}
                    selected={selectedNode?.id === item.node.id}
                    editing={editingNodeId === item.node.id}
                    editingTopic={editingTopic}
                    onSelect={selectNode}
                    onEdit={startEditing}
                    onEditTopic={setEditingTopic}
                    onCommitEdit={finishEditing}
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
        <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => setZoom((value) => clampZoom(value - 0.1))}>−</button>
        <button type="button" title="Reset zoom" aria-label="Reset zoom" onClick={centerMap}>100%</button>
        <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => setZoom((value) => clampZoom(value + 0.1))}>+</button>
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
          <button role="menuitem" onClick={() => addNode("sibling", contextMenu.nodeId)}>Add sibling</button>
          <button
            role="menuitem"
            onClick={() => {
              const node = findLayoutNode(layout?.nodes, contextMenu.nodeId)?.node;
              if (node) startEditing(node);
            }}
          >
            Rename
          </button>
          <button role="menuitem" onClick={() => deleteNode(contextMenu.nodeId)}>Delete</button>
        </div>
      )}
    </div>
  );
}

interface MindMapNodeProps {
  item: LayoutNode;
  selected: boolean;
  editing: boolean;
  editingTopic: string;
  onSelect: (node: NodeData) => void;
  onEdit: (node: NodeData) => void;
  onEditTopic: (topic: string) => void;
  onCommitEdit: () => void;
  onContextMenu: (event: React.MouseEvent<SVGGElement>, node: NodeData) => void;
}

function MindMapNode({
  item,
  selected,
  editing,
  editingTopic,
  onSelect,
  onEdit,
  onEditTopic,
  onCommitEdit,
  onContextMenu,
}: MindMapNodeProps) {
  const { node, x, y, width, height } = item;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={node.topic}
      data-node-id={node.id}
      transform={`translate(${x} ${y})`}
      className="mindmap-node"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onEdit(node);
      }}
      onContextMenu={(event) => onContextMenu(event, node)}
    >
      <rect
        width={width}
        height={height}
        rx="12"
        fill={selected ? "#4145a5" : "#334155"}
        stroke={selected ? "#bef264" : "#64748b"}
        strokeWidth={selected ? "3" : "1"}
      />
      {editing ? (
        <foreignObject x="8" y="8" width={width - 16} height={height - 16}>
          <input
            autoFocus
            value={editingTopic}
            aria-label={`Edit ${node.topic}`}
            className="mindmap-node-input"
            onChange={(event) => onEditTopic(event.target.value)}
            onBlur={onCommitEdit}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") onCommitEdit();
              if (event.key === "Escape") onCommitEdit();
            }}
          />
        </foreignObject>
      ) : (
        <>
          <text x="14" y="25" fill="#f8fafc" fontSize="15" fontFamily="system-ui, sans-serif">
            {node.topic}
          </text>
          {node.hyperLink && (
            <text x="14" y={height - 10} fill="#bef264" fontSize="11" fontFamily="system-ui, sans-serif">
              ↗ Card link
            </text>
          )}
        </>
      )}
    </g>
  );
}

function GuideBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-0 left-0 z-50 flex w-full items-center justify-between bg-blue-900 bg-opacity-30 px-4 py-2 text-sm text-blue-100 md:text-base">
      <span className="hidden lg:flex">
        Right-click on a node to interact with it. Double-click on a node to edit its content. Or use the “Show Shortcuts” button for more tips.
      </span>
      <span className="lg:hidden">Double-click on a node to edit its content.</span>
      <button type="button" onClick={onClose} className="text-2xl text-blue-100" aria-label="Close guide">×</button>
    </div>
  );
}

function findLayoutNode(nodes: LayoutNode[] | undefined, nodeId: string): LayoutNode | null {
  return nodes?.find((item) => item.node.id === nodeId) ?? null;
}

function connectorPath(startX: number, startY: number, endX: number, endY: number): string {
  const midpoint = (startX + endX) / 2;
  return `M ${startX} ${startY} C ${midpoint} ${startY}, ${midpoint} ${endY}, ${endX} ${endY}`;
}

function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(2))));
}
