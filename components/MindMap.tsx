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
  convertToMarkdown,
  parseMindmapMarkdown,
  reconcileMarkdownTree,
} from "@/lib/mindmap/markdown";
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

interface CanvasPanGesture {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  button: number;
  moved: boolean;
  pan: PanState;
}

interface SelectionBoxState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface CanvasSelectionGesture extends SelectionBoxState {
  pointerId: number;
  additive: boolean;
  moved: boolean;
  initialNodeIds: string[];
  selectedNodeIds: string[];
}

interface NodeDragState {
  nodeIds: string[];
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
}

type TreeUpdater = (root: NodeData) => NodeData;
type EditorMode = "map" | "markdown" | "split";
type InteractionMode = "select" | "pan";

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 8;

export default function MindMap({ id }: MindMapProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panStartRef = useRef<CanvasPanGesture | null>(null);
  const selectionStartRef = useRef<CanvasSelectionGesture | null>(null);
  const suppressContextMenuRef = useRef(false);
  const contextMenuResetTimerRef = useRef<number | null>(null);
  const nodeDragRef = useRef<NodeDragState | null>(null);
  const suppressNodeClickRef = useRef(false);
  const nodeClickResetTimerRef = useRef<number | null>(null);
  const clipboardRef = useRef<NodeData | null>(null);
  const markdownHistoryCapturedRef = useRef(false);
  const {
    mindmapData,
    currentMindmapId,
    loadMindmap,
    saveMindmap,
    saveStatus = "idle",
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
  const [isPanning, setIsPanning] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(
    "select"
  );
  const [selectionBox, setSelectionBox] = useState<SelectionBoxState | null>(
    null
  );
  const [history, setHistory] = useState<MindmapData[]>([]);
  const [redoHistory, setRedoHistory] = useState<MindmapData[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    () => new Set()
  );
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [externalLinkNodeId, setExternalLinkNodeId] = useState<string | null>(
    null
  );
  const [externalLinkDraft, setExternalLinkDraft] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("map");
  const [markdownDraft, setMarkdownDraft] = useState("");
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const [cardLinkCompletedVersion, setCardLinkCompletedVersion] = useState(0);

  const routeMatchesLoadedMap = !id || currentMindmapId === id;
  const root = routeMatchesLoadedMap
    ? mindmapData?.root ?? mindmapData?.nodeData ?? null
    : null;
  const layout = useMemo(
    () => (root && editorMode !== "markdown" ? layoutMindmap(root) : null),
    [editorMode, root]
  );
  const currentSelectedNode = useMemo(
    () =>
      selectedNode && root
        ? findNode(root, selectedNode.id) ?? selectedNode
        : null,
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
    setInteractionMode("select");
    setIsPanning(false);
    setHistory([]);
    setRedoHistory([]);
    setSelectedNodeIds(new Set());
    setEditorMode("map");
    setMarkdownDraft("");
    setMarkdownError(null);
    markdownHistoryCapturedRef.current = false;
  }, [id, loadMindmap]);

  useEffect(() => {
    if (!editingNodeId && editorMode === "map") {
      editorRef.current?.focus({ preventScroll: true });
    }
  }, [editingNodeId, editorMode, id]);

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);
    window.addEventListener("mousedown", closeContextMenu);
    return () => window.removeEventListener("mousedown", closeContextMenu);
  }, []);

  useEffect(
    () => () => {
      if (contextMenuResetTimerRef.current) {
        window.clearTimeout(contextMenuResetTimerRef.current);
      }
      if (nodeClickResetTimerRef.current) {
        window.clearTimeout(nodeClickResetTimerRef.current);
      }
    },
    []
  );

  const commitData = useCallback(
    (updater: TreeUpdater) => {
      if (!mindmapData) return;

      const nextRoot = updater(mindmapData.nodeData);
      if (nextRoot === mindmapData.nodeData) return;

      setHistory((previous) => [...previous.slice(-39), mindmapData]);
      setRedoHistory([]);
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

  const selectNodeFromPointer = useCallback(
    (node: NodeData, additive = false) => {
      if (suppressNodeClickRef.current) {
        suppressNodeClickRef.current = false;
        if (nodeClickResetTimerRef.current) {
          window.clearTimeout(nodeClickResetTimerRef.current);
          nodeClickResetTimerRef.current = null;
        }
        return;
      }
      selectNode(node, additive);
    },
    [selectNode]
  );

  const switchEditorMode = useCallback(
    (mode: EditorMode) => {
      if (mode !== "map" && editorMode === "map") {
        if (!root) return;
        setMarkdownDraft(convertToMarkdown(root));
        setMarkdownError(null);
        setSelectedNode(null);
        setSelectedNodeIds(new Set());
        markdownHistoryCapturedRef.current = false;
      }
      setEditorMode(mode);
    },
    [editorMode, root, setSelectedNode]
  );

  const updateMarkdownDraft = useCallback(
    (nextDraft: string) => {
      setMarkdownDraft(nextDraft);
      const parsed = parseMindmapMarkdown(nextDraft);
      if (!parsed.root) {
        setMarkdownError(parsed.error);
        return;
      }

      setMarkdownError(null);
      if (!markdownHistoryCapturedRef.current && mindmapData) {
        setHistory((previous) => [...previous.slice(-39), mindmapData]);
        setRedoHistory([]);
        markdownHistoryCapturedRef.current = true;
      }
      updateMindmapData((current) => {
        if (!current || !parsed.root) return current;
        const existingRoot = current.root ?? current.nodeData;
        const nextRoot = reconcileMarkdownTree(parsed.root, existingRoot);
        return {
          ...current,
          nodeData: nextRoot,
          ...(current.root ? { root: nextRoot } : {}),
        };
      });
    },
    [mindmapData, updateMindmapData]
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

  const removeExternalLink = useCallback(
    (nodeId: string) => {
      commitData((tree) =>
        updateNode(tree, nodeId, (node) => {
          const nextNode = { ...node };
          delete nextNode.externalLink;
          return nextNode;
        })
      );
      setExternalLinkNodeId(null);
      setExternalLinkDraft("");
    },
    [commitData]
  );

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    if (mindmapData) {
      setRedoHistory((items) => [...items.slice(-39), mindmapData]);
    }
    updateMindmapData(previous);
    setMarkdownDraft(convertToMarkdown(previous.root ?? previous.nodeData));
    setMarkdownError(null);
    markdownHistoryCapturedRef.current = false;
    setSelectedNode(null);
    setSelectedNodeIds(new Set());
  }, [history, mindmapData, setSelectedNode, updateMindmapData]);

  const redo = useCallback(() => {
    const next = redoHistory.at(-1);
    if (!next) return;
    setRedoHistory((items) => items.slice(0, -1));
    if (mindmapData) {
      setHistory((items) => [...items.slice(-39), mindmapData]);
    }
    updateMindmapData(next);
    setMarkdownDraft(convertToMarkdown(next.root ?? next.nodeData));
    setMarkdownError(null);
    markdownHistoryCapturedRef.current = false;
    setSelectedNode(null);
    setSelectedNodeIds(new Set());
  }, [mindmapData, redoHistory, setSelectedNode, updateMindmapData]);

  const pasteContent = useCallback((text: string): boolean => {
    if (!currentSelectedNode) return false;

    const clipboardNode = parseClipboardNode(text);
    const children = clipboardNode
      ? [cloneNodeWithNewIds(clipboardNode)]
      : parsePastedOutline(text);
    if (!children.length) return false;

    commitData((tree) =>
      updateNode(tree, currentSelectedNode.id, (node) => ({
        ...node,
        collapsed: false,
        children: [...(node.children ?? []), ...children],
      }))
    );
    return true;
  }, [commitData, currentSelectedNode]);

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

  const toggleInteractionMode = useCallback(() => {
    panStartRef.current = null;
    setIsPanning(false);
    setInteractionMode((current) => (current === "select" ? "pan" : "select"));
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
      const commandKey = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (commandKey && key === "e") {
        event.preventDefault();
        switchEditorMode(editorMode === "map" ? "markdown" : "map");
        return;
      }
      if (commandKey && key === "s") {
        event.preventDefault();
        void saveMindmap();
        return;
      }
      if (editingNodeId) return;
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (key === "escape" && interactionMode === "pan") {
        event.preventDefault();
        panStartRef.current = null;
        setIsPanning(false);
        setInteractionMode("select");
        return;
      }
      if (key === "h") {
        event.preventDefault();
        toggleInteractionMode();
        return;
      }

      const selectedId = currentSelectedNode?.id;
      if (commandKey && key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }
      if (commandKey && key === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if (commandKey && key === "y") {
        event.preventDefault();
        redo();
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
        let targetNode: NodeData | null = null;
        event.preventDefault();

        if (event.key === "ArrowRight") {
          targetNode = currentSelectedNode?.collapsed
            ? null
            : currentSelectedNode?.children?.[0] ?? null;
        } else if (event.key === "ArrowLeft") {
          targetNode = findParentNode(root, selectedId);
        } else {
          targetNode = findSiblingNode(
            root,
            selectedId,
            event.key === "ArrowUp" ? -1 : 1
          );
        }

        if (targetNode) {
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
      interactionMode,
      pasteNode,
      root,
      redo,
      saveMindmap,
      selectNode,
      editorMode,
      switchEditorMode,
      currentSelectedNode,
      startEditing,
      toggleBranch,
      toggleInteractionMode,
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
          setSelectedNodeIds(new Set([selectedNode.id]));
          setCardLinkCompletedVersion((version) => version + 1);
          editorRef.current?.focus({ preventScroll: true });
        }
      } catch {
        toast.error("Invalid card data.", { autoClose: 1500 });
      }
    },
    [selectedNode, updateNodeHyperlink]
  );

  const handleNodePointerDown = useCallback(
    (event: React.PointerEvent<SVGGElement>, node: NodeData) => {
      const target = event.target as Element;
      if (
        interactionMode === "pan" ||
        event.button !== 0 ||
        node.root ||
        target.closest('[data-node-control="true"]')
      ) {
        return;
      }
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
    [interactionMode, selectedNodeIds]
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

      if (drag.moved) {
        suppressNodeClickRef.current = true;
        if (nodeClickResetTimerRef.current) {
          window.clearTimeout(nodeClickResetTimerRef.current);
        }
        nodeClickResetTimerRef.current = window.setTimeout(() => {
          suppressNodeClickRef.current = false;
          nodeClickResetTimerRef.current = null;
        }, 250);
      }

      nodeDragRef.current = null;
      setDropTargetId(null);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
    [commitData, dropTargetId]
  );

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const target = event.target as SVGElement;
    const startedOnBackground =
      event.target === event.currentTarget ||
      target.dataset.canvasBackground === "true";
    const isTouchPointer =
      event.pointerType === "touch" || event.pointerType === "pen";
    const isRightMouseButton = !isTouchPointer && event.button === 2;
    const isMiddleMouseButton = !isTouchPointer && event.button === 1;
    const isPanModeLeftButton =
      !isTouchPointer && interactionMode === "pan" && event.button === 0;

    if (
      interactionMode === "select" &&
      !isTouchPointer &&
      event.button === 0 &&
      startedOnBackground &&
      layout
    ) {
      const point = clientPointToMap(
        event.currentTarget,
        event.clientX,
        event.clientY,
        layout.width,
        layout.height,
        pan,
        zoom
      );
      selectionStartRef.current = {
        pointerId: event.pointerId,
        startX: point.x,
        startY: point.y,
        currentX: point.x,
        currentY: point.y,
        additive: event.ctrlKey || event.metaKey,
        moved: false,
        initialNodeIds: [...selectedNodeIds],
        selectedNodeIds: [],
      };
      setContextMenu(null);
      editorRef.current?.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    if (!isRightMouseButton && !isPanModeLeftButton && !startedOnBackground) {
      return;
    }
    if (
      !isTouchPointer &&
      !isRightMouseButton &&
      !isMiddleMouseButton &&
      !isPanModeLeftButton
    ) {
      return;
    }

    editorRef.current?.focus({ preventScroll: true });
    panStartRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      button: event.button,
      moved: false,
      pan,
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const selection = selectionStartRef.current;
    if (selection?.pointerId === event.pointerId && layout) {
      const point = clientPointToMap(
        event.currentTarget,
        event.clientX,
        event.clientY,
        layout.width,
        layout.height,
        pan,
        zoom
      );
      if (
        !selection.moved &&
        Math.hypot(point.x - selection.startX, point.y - selection.startY) < 4
      ) {
        return;
      }

      selection.moved = true;
      selection.currentX = point.x;
      selection.currentY = point.y;
      const bounds = normalizeSelectionBounds(selection);
      const matchingNodeIds = layout.nodes
        .filter((item) => nodeIntersectsSelection(item, bounds))
        .map((item) => item.node.id);
      const nextNodeIds = selection.additive
        ? [...new Set([...selection.initialNodeIds, ...matchingNodeIds])]
        : matchingNodeIds;
      selection.selectedNodeIds = nextNodeIds;
      setSelectedNodeIds(new Set(nextNodeIds));
      setSelectionBox({
        startX: selection.startX,
        startY: selection.startY,
        currentX: point.x,
        currentY: point.y,
      });
      return;
    }

    if (
      !panStartRef.current ||
      panStartRef.current.pointerId !== event.pointerId
    ) {
      return;
    }
    const start = panStartRef.current;
    if (
      !start.moved &&
      Math.hypot(
        event.clientX - start.pointerX,
        event.clientY - start.pointerY
      ) >= 4
    ) {
      start.moved = true;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const scaleX = layout && bounds.width ? layout.width / bounds.width : 1;
    const scaleY = layout && bounds.height ? layout.height / bounds.height : 1;
    setPan({
      x: start.pan.x + (event.clientX - start.pointerX) * scaleX,
      y: start.pan.y + (event.clientY - start.pointerY) * scaleY,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    const selection = selectionStartRef.current;
    if (selection?.pointerId === event.pointerId) {
      if (!selection.moved && !selection.additive) {
        setSelectedNodeIds(new Set());
        setSelectedNode(null);
      } else if (selection.moved) {
        const primaryNode = layout?.nodes.find((item) =>
          selection.selectedNodeIds.includes(item.node.id)
        )?.node;
        setSelectedNode(primaryNode ?? null);
      }
      selectionStartRef.current = null;
      setSelectionBox(null);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      return;
    }

    const gesture = panStartRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (gesture.button === 2 && gesture.moved) {
      suppressContextMenuRef.current = true;
      if (contextMenuResetTimerRef.current) {
        window.clearTimeout(contextMenuResetTimerRef.current);
      }
      contextMenuResetTimerRef.current = window.setTimeout(() => {
        suppressContextMenuRef.current = false;
        contextMenuResetTimerRef.current = null;
      }, 250);
    }

    panStartRef.current = null;
    setIsPanning(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleCanvasContextMenu = (
    event: React.MouseEvent<SVGSVGElement>
  ) => {
    event.preventDefault();
    if (suppressContextMenuRef.current || panStartRef.current) {
      event.stopPropagation();
      suppressContextMenuRef.current = false;
      if (contextMenuResetTimerRef.current) {
        window.clearTimeout(contextMenuResetTimerRef.current);
        contextMenuResetTimerRef.current = null;
      }
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
        if (editingNodeId || isTextEntryTarget(event.target)) return;
        const text = event.clipboardData.getData("text/plain");
        if (pasteContent(text)) event.preventDefault();
      }}
      onDrop={handleDrop}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("card/json")) event.preventDefault();
      }}
    >
      <div className="mindmap-commandbar" aria-label="Mind map actions">
        <div className="mindmap-mode-switch" role="group" aria-label="Editor mode">
          <button
            type="button"
            aria-label="Mind map mode"
            aria-pressed={editorMode === "map"}
            className={editorMode === "map" ? "is-active" : undefined}
            onClick={() => switchEditorMode("map")}
          >
            Mind map
          </button>
          <button
            type="button"
            aria-label="Markdown mode"
            aria-pressed={editorMode === "markdown"}
            className={editorMode === "markdown" ? "is-active" : undefined}
            disabled={!root}
            onClick={() => switchEditorMode("markdown")}
          >
            Markdown
          </button>
          <button
            type="button"
            aria-label="Split view mode"
            aria-pressed={editorMode === "split"}
            className={editorMode === "split" ? "is-active" : undefined}
            disabled={!root}
            onClick={() => switchEditorMode("split")}
          >
            Split
          </button>
        </div>
        <span className="mindmap-commandbar-divider" aria-hidden="true" />
        <button
          type="button"
          aria-label="Undo last change"
          disabled={!history.length}
          onClick={undo}
        >
          Undo <kbd>⌘Z</kbd>
        </button>
        <button
          type="button"
          aria-label="Redo last change"
          disabled={!redoHistory.length}
          onClick={redo}
        >
          Redo <kbd>⇧⌘Z</kbd>
        </button>
        <span className="mindmap-commandbar-divider" aria-hidden="true" />
        {editorMode === "map" ? (currentSelectedNode ? (
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
            {currentSelectedNode.externalLink ? (
              <button
                type="button"
                aria-label="Remove external link"
                onClick={() => removeExternalLink(currentSelectedNode.id)}
              >
                Remove link
              </button>
            ) : null}
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
          <span className="mindmap-commandbar-hint">
            Select a node · Press H for pan · Right-drag to browse
          </span>
        )) : (
          <span
            className={`mindmap-markdown-status${markdownError ? " is-error" : ""}`}
            role="status"
          >
            {markdownError ?? "Changes sync automatically"}
          </span>
        )}
        {editorMode !== "markdown" ? (
          <>
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
          </>
        ) : null}
        <span className="mindmap-commandbar-spacer" aria-hidden="true" />
        <span
          className={`mindmap-save-status is-${saveStatus}`}
          role="status"
          aria-live="polite"
        >
          {saveStatus === "saving"
            ? "Saving…"
            : saveStatus === "saved"
              ? "Saved"
              : saveStatus === "unsaved"
                ? "Unsaved changes"
                : saveStatus === "error"
                  ? "Save failed"
                  : "Auto-save ready"}
        </span>
      </div>
      <div className="showcase">
        <div className={`block${editorMode === "split" ? " mindmap-split-view" : ""}`}>
          {editorMode !== "map" ? (
            <div className="mindmap-markdown-editor">
              <textarea
                autoFocus
                aria-label="Mind map Markdown"
                aria-describedby="mindmap-markdown-help"
                value={markdownDraft}
                spellCheck={false}
                onChange={(event) => updateMarkdownDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Tab") return;
                  event.preventDefault();
                  const textarea = event.currentTarget;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const nextDraft = `${markdownDraft.slice(0, start)}  ${markdownDraft.slice(end)}`;
                  updateMarkdownDraft(nextDraft);
                  window.requestAnimationFrame(() => {
                    textarea.setSelectionRange(start + 2, start + 2);
                  });
                }}
              />
              <p id="mindmap-markdown-help">
                Use headings or indented bullets. Tab inserts two spaces.
              </p>
            </div>
          ) : null}
          {editorMode !== "markdown" ? (
            <div className="mindmap-map-pane">
              {layout ? (
                <svg
              ref={svgRef}
              className={`mindmap-canvas${interactionMode === "pan" ? " is-pan-mode" : ""}${isPanning ? " is-panning" : ""}${
                selectionBox ? " is-selecting" : ""
              }`}
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
              onLostPointerCapture={() => {
                panStartRef.current = null;
                setIsPanning(false);
              }}
              onContextMenuCapture={handleCanvasContextMenu}
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
                    onSelect={selectNodeFromPointer}
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
                {selectionBox ? (
                  <rect
                    {...selectionRectAttributes(selectionBox)}
                    className="mindmap-selection-box"
                  />
                ) : null}
              </g>
                </svg>
              ) : (
                <div className="mindmap-loading" role="status">
                  <span aria-hidden="true" />
                  Loading mind map…
                </div>
              )}
            </div>
          ) : null}
        </div>
        {editorMode === "map" ? (
          <>
            <div className="hidden lg:block">
              <ShortcutGuide />
            </div>
            <div className="hidden lg:block">
              <Card
                currentMindmapId={id}
                removeHyperlink={removeHyperlink}
                linkCompletedVersion={cardLinkCompletedVersion}
              />
            </div>
          </>
        ) : null}
      </div>

      {editorMode !== "markdown" ? (
        <div className="mindmap-toolbar" aria-label="Map controls">
          <button
            type="button"
            aria-label={interactionMode === "pan" ? "Disable pan mode" : "Enable pan mode"}
            aria-pressed={interactionMode === "pan"}
            className={interactionMode === "pan" ? "is-active" : undefined}
            title="Pan mode — left-drag the canvas (H). Right-drag always pans."
            onClick={toggleInteractionMode}
          >
            {interactionMode === "pan" ? "⌖" : "✋"}
          </button>
          <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => zoomBy(-0.1)}>−</button>
          <span className="mindmap-zoom-level" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => zoomBy(0.1)}>+</button>
          <button type="button" title="Center map" aria-label="Center map" onClick={centerMap}>⌾</button>
          <button type="button" title="Fullscreen" aria-label="Fullscreen" onClick={toggleFullscreen}>⛶</button>
        </div>
      ) : null}

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
  const collapseHeight = node.collapsed ? 16 : 18;
  const collapseWidth = node.collapsed
    ? Math.max(16, collapseLabel.length * 5.5 + 7)
    : 18;

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
          <textarea
            autoFocus
            wrap="soft"
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
              if (event.key === "Enter" && !event.shiftKey) {
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
              data-node-control="true"
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
              data-node-control="true"
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
              data-node-control="true"
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
                y={-collapseHeight / 2}
                width={collapseWidth}
                height={collapseHeight}
                rx={collapseHeight / 2}
                stroke={branchColor}
              />
              <text
                className={node.collapsed ? "mindmap-collapse-count" : undefined}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {collapseLabel}
              </text>
            </g>
          ) : null}
        </>
      )}
    </g>
  );
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

function findSiblingNode(
  root: NodeData | null,
  nodeId: string,
  offset: -1 | 1
): NodeData | null {
  const parent = findParentNode(root, nodeId);
  const siblings = parent?.children ?? [];
  const currentIndex = siblings.findIndex((node) => node.id === nodeId);
  return currentIndex >= 0 ? siblings[currentIndex + offset] ?? null : null;
}

function connectorPath(startX: number, startY: number, endX: number, endY: number): string {
  const midpoint = (startX + endX) / 2;
  return `M ${startX} ${startY} C ${midpoint} ${startY}, ${midpoint} ${endY}, ${endX} ${endY}`;
}

function clientPointToMap(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  canvasWidth: number,
  canvasHeight: number,
  pan: PanState,
  zoom: number
): { x: number; y: number } {
  const bounds = svg.getBoundingClientRect();
  if (!bounds.width || !bounds.height) {
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom,
    };
  }

  const viewScale = Math.min(
    bounds.width / canvasWidth,
    bounds.height / canvasHeight
  );
  const offsetX = (bounds.width - canvasWidth * viewScale) / 2;
  const offsetY = (bounds.height - canvasHeight * viewScale) / 2;
  const canvasX = (clientX - bounds.left - offsetX) / viewScale;
  const canvasY = (clientY - bounds.top - offsetY) / viewScale;

  return {
    x: (canvasX - pan.x) / zoom,
    y: (canvasY - pan.y) / zoom,
  };
}

function normalizeSelectionBounds(selection: SelectionBoxState) {
  return {
    left: Math.min(selection.startX, selection.currentX),
    top: Math.min(selection.startY, selection.currentY),
    right: Math.max(selection.startX, selection.currentX),
    bottom: Math.max(selection.startY, selection.currentY),
  };
}

function nodeIntersectsSelection(
  item: LayoutNode,
  bounds: ReturnType<typeof normalizeSelectionBounds>
): boolean {
  return (
    item.x <= bounds.right &&
    item.x + item.width >= bounds.left &&
    item.y <= bounds.bottom &&
    item.y + item.height >= bounds.top
  );
}

function selectionRectAttributes(selection: SelectionBoxState) {
  const bounds = normalizeSelectionBounds(selection);
  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.right - bounds.left,
    height: bounds.bottom - bounds.top,
  };
}

function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(2))));
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest('input, textarea, [contenteditable="true"]'))
  );
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
