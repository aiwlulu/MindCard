import type { MindmapData, NodeData } from "@/lib/types";
import { normalizeExternalUrl } from "./links";

const DEFAULT_ROOT_ID = "root";

export interface SerializedMindmapNode {
  id: string;
  topic: string;
  parentId: string | null;
  order: number;
  hyperLink?: string;
  externalLink?: string;
  collapsed?: boolean;
}

export interface SerializedMindmapData {
  schemaVersion: 2;
  rootId: string;
  nodes: SerializedMindmapNode[];
}

export function createNode(topic = "New Topic", id = createNodeId()): NodeData {
  return { id, topic };
}

export function createNodeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeMindmapData(input: unknown): MindmapData {
  const record = asRecord(input);
  const flatRoot = record ? normalizeFlatMindmapData(record) : null;
  if (flatRoot) return { nodeData: flatRoot };

  const rawRoot = asRecord(record?.nodeData) ?? asRecord(record?.root);

  if (!rawRoot) {
    return { nodeData: { ...createNode("New Mind Map", DEFAULT_ROOT_ID), root: true } };
  }

  return { nodeData: normalizeNode(rawRoot, true) };
}

export function serializeMindmapData(
  data: MindmapData
): SerializedMindmapData {
  const root = data.root ?? data.nodeData;
  const nodes: SerializedMindmapNode[] = [];

  const visit = (node: NodeData, parentId: string | null, order: number) => {
    const storedNode: SerializedMindmapNode = {
      id: node.id,
      topic: node.topic,
      parentId,
      order,
    };
    if (node.hyperLink) storedNode.hyperLink = node.hyperLink;
    if (node.externalLink) storedNode.externalLink = node.externalLink;
    if (node.collapsed) storedNode.collapsed = true;
    nodes.push(storedNode);

    node.children?.forEach((child, childIndex) => {
      visit(child, node.id, childIndex);
    });
  };

  visit(root, null, 0);
  return { schemaVersion: 2, rootId: root.id, nodes };
}

export function findNode(root: NodeData, nodeId: string): NodeData | null {
  if (root.id === nodeId) return root;

  for (const child of root.children ?? []) {
    const match = findNode(child, nodeId);
    if (match) return match;
  }

  return null;
}

export function countDescendants(node: NodeData): number {
  return (node.children ?? []).reduce(
    (total, child) => total + 1 + countDescendants(child),
    0
  );
}

export function formatHiddenDescendantCount(count: number): string {
  return count > 99 ? "99+" : `+${count}`;
}

export function updateNode(
  root: NodeData,
  nodeId: string,
  updater: (node: NodeData) => NodeData
): NodeData {
  if (root.id === nodeId) return updater(root);

  if (!root.children?.length) return root;

  let changed = false;
  const children = root.children.map((child) => {
    const updated = updateNode(child, nodeId, updater);
    changed ||= updated !== child;
    return updated;
  });

  return changed ? { ...root, children } : root;
}

export function insertChild(
  root: NodeData,
  parentId: string,
  child: NodeData
): NodeData {
  return updateNode(root, parentId, (node) => ({
    ...node,
    children: [...(node.children ?? []), cloneNode(child)],
  }));
}

export function insertSibling(
  root: NodeData,
  nodeId: string,
  sibling: NodeData
): NodeData {
  if (!root.children?.length) return root;

  const siblingIndex = root.children.findIndex((child) => child.id === nodeId);
  if (siblingIndex >= 0) {
    const children = [...root.children];
    children.splice(siblingIndex + 1, 0, cloneNode(sibling));
    return { ...root, children };
  }

  let changed = false;
  const children = root.children.map((child) => {
    const updated = insertSibling(child, nodeId, sibling);
    changed ||= updated !== child;
    return updated;
  });

  return changed ? { ...root, children } : root;
}

export function insertSiblingBefore(
  root: NodeData,
  nodeId: string,
  sibling: NodeData
): NodeData {
  if (!root.children?.length) return root;

  const siblingIndex = root.children.findIndex((child) => child.id === nodeId);
  if (siblingIndex >= 0) {
    const children = [...root.children];
    children.splice(siblingIndex, 0, cloneNode(sibling));
    return { ...root, children };
  }

  let changed = false;
  const children = root.children.map((child) => {
    const updated = insertSiblingBefore(child, nodeId, sibling);
    changed ||= updated !== child;
    return updated;
  });

  return changed ? { ...root, children } : root;
}

export function removeNode(
  root: NodeData,
  nodeId: string
): { root: NodeData; removed: boolean } {
  if (root.id === nodeId || !root.children?.length) {
    return { root, removed: false };
  }

  const childIndex = root.children.findIndex((child) => child.id === nodeId);
  if (childIndex >= 0) {
    const children = root.children.filter((_, index) => index !== childIndex);
    return {
      root: children.length ? { ...root, children } : omitChildren(root),
      removed: true,
    };
  }

  for (let index = 0; index < root.children.length; index += 1) {
    const result = removeNode(root.children[index], nodeId);
    if (result.removed) {
      const children = [...root.children];
      children[index] = result.root;
      return { root: { ...root, children }, removed: true };
    }
  }

  return { root, removed: false };
}

export function moveNode(
  root: NodeData,
  nodeId: string,
  direction: "up" | "down"
): NodeData {
  if (!root.children?.length) return root;

  const index = root.children.findIndex((child) => child.id === nodeId);
  if (index >= 0) {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= root.children.length) return root;

    const children = [...root.children];
    [children[index], children[targetIndex]] = [
      children[targetIndex],
      children[index],
    ];
    return { ...root, children };
  }

  let changed = false;
  const children = root.children.map((child) => {
    const updated = moveNode(child, nodeId, direction);
    changed ||= updated !== child;
    return updated;
  });

  return changed ? { ...root, children } : root;
}

export function moveNodesAsChildren(
  root: NodeData,
  nodeIds: string[],
  parentId: string
): NodeData {
  const selectedIds = new Set(nodeIds);
  if (!selectedIds.size || selectedIds.has(root.id) || selectedIds.has(parentId)) {
    return root;
  }

  const parent = findNode(root, parentId);
  if (!parent) return root;

  const sources: NodeData[] = [];
  collectSelectedRoots(root, false);
  if (!sources.length || sources.some((source) => findNode(source, parentId))) {
    return root;
  }

  let nextRoot = root;
  for (const source of sources) {
    const result = removeNode(nextRoot, source.id);
    if (!result.removed) return root;
    nextRoot = result.root;
  }

  return updateNode(nextRoot, parentId, (node) => ({
    ...node,
    collapsed: false,
    children: [...(node.children ?? []), ...sources.map(cloneNode)],
  }));

  function collectSelectedRoots(node: NodeData, ancestorSelected: boolean) {
    const selected = selectedIds.has(node.id);
    if (selected && !ancestorSelected) {
      sources.push(node);
      return;
    }

    for (const child of node.children ?? []) {
      collectSelectedRoots(child, ancestorSelected || selected);
    }
  }
}

export type SiblingMovePosition = "before" | "after";

export function moveNodesAsSiblings(
  root: NodeData,
  nodeIds: string[],
  targetId: string,
  position: SiblingMovePosition
): NodeData {
  const selectedIds = new Set(nodeIds);
  if (!selectedIds.size || selectedIds.has(root.id) || selectedIds.has(targetId)) {
    return root;
  }

  const target = findNode(root, targetId);
  if (!target || target.root) return root;

  const sources: NodeData[] = [];
  collectSelectedRoots(root, false);
  if (!sources.length || sources.some((source) => findNode(source, targetId))) {
    return root;
  }

  let nextRoot = root;
  for (const source of sources) {
    const result = removeNode(nextRoot, source.id);
    if (!result.removed) return root;
    nextRoot = result.root;
  }

  return insertSiblings(nextRoot, targetId, sources, position);

  function collectSelectedRoots(node: NodeData, ancestorSelected: boolean) {
    const selected = selectedIds.has(node.id);
    if (selected && !ancestorSelected) {
      sources.push(node);
      return;
    }

    for (const child of node.children ?? []) {
      collectSelectedRoots(child, ancestorSelected || selected);
    }
  }
}

function insertSiblings(
  root: NodeData,
  targetId: string,
  siblings: NodeData[],
  position: SiblingMovePosition
): NodeData {
  if (!root.children?.length) return root;

  const targetIndex = root.children.findIndex((child) => child.id === targetId);
  if (targetIndex >= 0) {
    const children = [...root.children];
    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
    children.splice(insertIndex, 0, ...siblings.map(cloneNode));
    return { ...root, children };
  }

  let changed = false;
  const children = root.children.map((child) => {
    const updated = insertSiblings(child, targetId, siblings, position);
    changed ||= updated !== child;
    return updated;
  });

  return changed ? { ...root, children } : root;
}

export function setAllBranchesCollapsed(
  root: NodeData,
  collapsed: boolean,
  isRoot = true
): NodeData {
  const children = root.children?.map((child) =>
    setAllBranchesCollapsed(child, collapsed, false)
  );
  const next: NodeData = children?.length ? { ...root, children } : { ...root };

  if (isRoot) {
    delete next.collapsed;
  } else if (children?.length || root.collapsed !== undefined) {
    next.collapsed = collapsed;
  }

  return next;
}

export function cloneNodeWithNewIds(node: NodeData): NodeData {
  const clone: NodeData = {
    ...node,
    id: createNodeId(),
    root: false,
  };

  if (node.children?.length) {
    clone.children = node.children.map(cloneNodeWithNewIds);
  } else {
    delete clone.children;
  }

  return clone;
}

function cloneNode(node: NodeData): NodeData {
  return {
    ...node,
    children: node.children?.map(cloneNode),
  };
}

function normalizeFlatMindmapData(
  record: Record<string, unknown>
): NodeData | null {
  if (record.schemaVersion !== 2 || !Array.isArray(record.nodes)) return null;

  const entries = record.nodes
    .map((value, index) => {
      const raw = asRecord(value);
      if (
        !raw ||
        typeof raw.id !== "string" ||
        !raw.id ||
        typeof raw.topic !== "string"
      ) {
        return null;
      }

      return {
        raw,
        id: raw.id,
        parentId: typeof raw.parentId === "string" ? raw.parentId : null,
        order:
          typeof raw.order === "number" && Number.isFinite(raw.order)
            ? raw.order
            : index,
        index,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (!entries.length) return null;

  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const requestedRootId =
    typeof record.rootId === "string" ? record.rootId : null;
  const rootEntry =
    (requestedRootId ? entryById.get(requestedRootId) : null) ??
    entries.find((entry) => entry.parentId === null);
  if (!rootEntry) return null;

  const childrenByParent = new Map<string, typeof entries>();
  for (const entry of entries) {
    if (!entry.parentId || entry.id === rootEntry.id) continue;
    const children = childrenByParent.get(entry.parentId) ?? [];
    children.push(entry);
    childrenByParent.set(entry.parentId, children);
  }
  for (const children of childrenByParent.values()) {
    children.sort(
      (first, second) => first.order - second.order || first.index - second.index
    );
  }

  const buildNode = (nodeId: string, ancestors: Set<string>): NodeData | null => {
    const entry = entryById.get(nodeId);
    if (!entry || ancestors.has(nodeId)) return null;

    const nextAncestors = new Set(ancestors).add(nodeId);
    const node = normalizeNode(entry.raw, nodeId === rootEntry.id);
    const children = (childrenByParent.get(nodeId) ?? [])
      .map((child) => buildNode(child.id, nextAncestors))
      .filter((child): child is NodeData => child !== null);
    if (children.length) node.children = children;
    else delete node.children;
    return node;
  };

  return buildNode(rootEntry.id, new Set());
}

function normalizeNode(raw: Record<string, unknown>, isRoot: boolean): NodeData {
  const children = Array.isArray(raw.children)
    ? raw.children
        .map(asRecord)
        .filter((child): child is Record<string, unknown> => child !== null)
        .map((child) => normalizeNode(child, false))
    : [];
  const node: NodeData = {
    id: typeof raw.id === "string" && raw.id ? raw.id : createNodeId(),
    topic: typeof raw.topic === "string" && raw.topic ? raw.topic : "New Topic",
  };

  if (isRoot) node.root = true;
  if (typeof raw.hyperLink === "string" && raw.hyperLink) {
    node.hyperLink = raw.hyperLink;
  }
  if (typeof raw.externalLink === "string" && raw.externalLink) {
    const externalLink = normalizeExternalUrl(raw.externalLink);
    if (externalLink) node.externalLink = externalLink;
  }
  if (raw.collapsed === true) node.collapsed = true;
  if (children.length) node.children = children;

  return node;
}

function omitChildren(node: NodeData): NodeData {
  const { children: _children, ...withoutChildren } = node;
  return withoutChildren;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}
