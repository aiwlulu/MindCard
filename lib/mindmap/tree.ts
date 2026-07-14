import type { MindmapData, NodeData } from "@/lib/types";

const DEFAULT_ROOT_ID = "root";

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
  const rawRoot = asRecord(record?.nodeData) ?? asRecord(record?.root);

  if (!rawRoot) {
    return { nodeData: { ...createNode("New Mind Map", DEFAULT_ROOT_ID), root: true } };
  }

  return { nodeData: normalizeNode(rawRoot, true) };
}

export function findNode(root: NodeData, nodeId: string): NodeData | null {
  if (root.id === nodeId) return root;

  for (const child of root.children ?? []) {
    const match = findNode(child, nodeId);
    if (match) return match;
  }

  return null;
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
