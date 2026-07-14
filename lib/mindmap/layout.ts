import type { NodeData } from "@/lib/types";

export const NODE_MIN_WIDTH = 96;
export const NODE_MAX_WIDTH = 300;
export const NODE_MIN_HEIGHT = 28;
export const NODE_WIDTH = 190;
export const NODE_HEIGHT = NODE_MIN_HEIGHT;
export const NODE_HORIZONTAL_PADDING = 16;
export const NODE_VERTICAL_PADDING = 8;
export const NODE_LINE_HEIGHT = 22;
export const NODE_LINK_HEIGHT = 18;
export const LEVEL_GAP = 100;
export const SIBLING_GAP = 20;
export const CANVAS_PADDING = 80;

export type LayoutSide = "right" | "center";

export interface LayoutNode {
  node: NodeData;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  lines: string[];
  side: LayoutSide;
  branchIndex: number | null;
  connectionY: number;
}

export interface LayoutEdge {
  parentId: string;
  childId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  side: "right";
  branchIndex: number;
  depth: number;
}

export interface MindmapLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

export interface LayoutOptions {
  nodeMaxWidth?: number;
  levelGap?: number;
  siblingGap?: number;
  padding?: number;
}

interface NodeMetrics {
  width: number;
  height: number;
  lines: string[];
}

interface SubtreeMetrics extends NodeMetrics {
  subtreeWidth: number;
  subtreeHeight: number;
}

export function layoutMindmap(
  root: NodeData,
  options: LayoutOptions = {}
): MindmapLayout {
  const nodeMaxWidth = options.nodeMaxWidth ?? NODE_MAX_WIDTH;
  const levelGap = options.levelGap ?? LEVEL_GAP;
  const siblingGap = options.siblingGap ?? SIBLING_GAP;
  const padding = options.padding ?? CANVAS_PADDING;
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const rootMetrics = measureSubtree(root, nodeMaxWidth, siblingGap, levelGap);
  const rootChildren = visibleChildren(root);
  const childrenHeight = stackHeight(
    rootChildren,
    nodeMaxWidth,
    siblingGap,
    levelGap
  );
  const contentHeight = Math.max(rootMetrics.height, childrenHeight);
  const canvasHeight = Math.max(contentHeight + padding * 2, 360);
  const canvasWidth = padding * 2 + rootMetrics.subtreeWidth;
  const rootX = padding;
  const rootY = padding + (canvasHeight - padding * 2 - rootMetrics.height) / 2;
  const rootLayout = assignNode(root, rootX, rootY, 0, "center", null);

  assignChildren(rootLayout, rootChildren, childrenHeight);

  return {
    nodes,
    edges,
    width: canvasWidth,
    height: canvasHeight,
  };

  function assignNode(
    node: NodeData,
    x: number,
    subtreeTop: number,
    depth: number,
    side: LayoutSide,
    branchIndex: number | null,
    parent?: LayoutNode
  ): LayoutNode {
    const metrics = measureNode(node, nodeMaxWidth);
    const nodeY =
      depth === 0
        ? subtreeTop
        : subtreeTop +
          (measureSubtree(node, nodeMaxWidth, siblingGap, levelGap)
            .subtreeHeight -
            metrics.height) /
            2;
    const connectionY = getConnectionY(node, nodeY, metrics, depth);
    const layoutNode: LayoutNode = {
      node,
      x,
      y: nodeY,
      width: metrics.width,
      height: metrics.height,
      depth,
      lines: metrics.lines,
      side,
      branchIndex,
      connectionY,
    };
    nodes.push(layoutNode);

    if (parent && branchIndex !== null) {
      edges.push({
        parentId: parent.node.id,
        childId: node.id,
        startX: parent.x + parent.width,
        startY: parent.connectionY,
        endX: layoutNode.x,
        endY: layoutNode.connectionY,
        side: "right",
        branchIndex,
        depth,
      });
    }

    return layoutNode;
  }

  function assignChildren(
    parent: LayoutNode,
    children: NodeData[],
    groupHeight: number
  ) {
    if (!children.length) return;

    let childTop = parent.y + parent.height / 2 - groupHeight / 2;
    for (const [branchIndex, child] of children.entries()) {
      const metrics = measureSubtree(child, nodeMaxWidth, siblingGap, levelGap);
      const childX = parent.x + parent.width + levelGap;
      const childLayout = assignNode(
        child,
        childX,
        childTop,
        1,
        "right",
        branchIndex,
        parent
      );
      assignDescendants(childLayout, branchIndex);
      childTop += metrics.subtreeHeight + siblingGap;
    }
  }

  function assignDescendants(parent: LayoutNode, branchIndex: number) {
    const children = visibleChildren(parent.node);
    if (!children.length) return;

    const groupHeight = stackHeight(children, nodeMaxWidth, siblingGap, levelGap);
    let childTop = parent.y + parent.height / 2 - groupHeight / 2;
    for (const child of children) {
      const metrics = measureSubtree(child, nodeMaxWidth, siblingGap, levelGap);
      const childX = parent.x + parent.width + levelGap;
      const childLayout = assignNode(
        child,
        childX,
        childTop,
        parent.depth + 1,
        "right",
        branchIndex,
        parent
      );
      assignDescendants(childLayout, branchIndex);
      childTop += metrics.subtreeHeight + siblingGap;
    }
  }
}

export function wrapTopic(topic: string, maxWidth = NODE_MAX_WIDTH): string[] {
  const availableWidth = Math.max(
    1,
    maxWidth - NODE_HORIZONTAL_PADDING * 2
  );
  const lines: string[] = [];

  for (const paragraph of topic.split("\n")) {
    let line = "";
    let width = 0;

    for (const character of Array.from(paragraph || " ")) {
      const characterWidth = estimateCharacterWidth(character);
      if (line && width + characterWidth > availableWidth) {
        lines.push(line.trimEnd());
        line = "";
        width = 0;
      }
      line += character;
      width += characterWidth;
    }

    lines.push(line.trimEnd() || " ");
  }

  return lines.length ? lines : [" "];
}

function measureSubtree(
  node: NodeData,
  nodeMaxWidth: number,
  siblingGap: number,
  levelGap: number
): SubtreeMetrics {
  const metrics = measureNode(node, nodeMaxWidth);
  const children = visibleChildren(node);
  if (!children.length) {
    return { ...metrics, subtreeWidth: metrics.width, subtreeHeight: metrics.height };
  }

  const childrenMetrics = children.map((child) =>
    measureSubtree(child, nodeMaxWidth, siblingGap, levelGap)
  );
  const childrenHeight =
    childrenMetrics.reduce((total, child) => total + child.subtreeHeight, 0) +
    siblingGap * (children.length - 1);
  const childrenWidth = Math.max(
    ...childrenMetrics.map((child) => child.subtreeWidth)
  );

  return {
    ...metrics,
    subtreeWidth: metrics.width + levelGap + childrenWidth,
    subtreeHeight: Math.max(metrics.height, childrenHeight),
  };
}

function stackHeight(
  nodes: NodeData[],
  nodeMaxWidth: number,
  siblingGap: number,
  levelGap: number
): number {
  if (!nodes.length) return 0;
  return (
    nodes.reduce(
      (total, node) =>
        total + measureSubtree(node, nodeMaxWidth, siblingGap, levelGap).subtreeHeight,
      0
    ) +
    siblingGap * (nodes.length - 1)
  );
}

function measureNode(node: NodeData, nodeMaxWidth: number): NodeMetrics {
  const lines = wrapTopic(node.topic, nodeMaxWidth);
  const longestLineWidth = Math.max(...lines.map(estimateTextWidth));
  const width = Math.min(
    nodeMaxWidth,
    Math.max(NODE_MIN_WIDTH, longestLineWidth + NODE_HORIZONTAL_PADDING * 2)
  );
  const height = Math.max(
    NODE_MIN_HEIGHT,
    NODE_VERTICAL_PADDING * 2 +
      lines.length * NODE_LINE_HEIGHT +
      getNodeLinkCount(node) * NODE_LINK_HEIGHT
  );

  return { width, height, lines };
}

function visibleChildren(node: NodeData): NodeData[] {
  return node.collapsed ? [] : node.children ?? [];
}

function getConnectionY(
  node: NodeData,
  y: number,
  metrics: NodeMetrics,
  depth: number
): number {
  if (depth === 0) return y + metrics.height / 2;

  const topicHeight = metrics.lines.length * NODE_LINE_HEIGHT;
  const linkHeight = getNodeLinkCount(node) * NODE_LINK_HEIGHT;
  const contentTop = Math.max(
    0,
    (metrics.height - topicHeight - linkHeight) / 2
  );
  return y + contentTop + topicHeight + 1;
}

function getNodeLinkCount(node: NodeData): number {
  return Number(Boolean(node.hyperLink)) + Number(Boolean(node.externalLink));
}

function estimateTextWidth(text: string): number {
  return Array.from(text).reduce(
    (width, character) => width + estimateCharacterWidth(character),
    0
  );
}

function estimateCharacterWidth(character: string): number {
  if (/\s/.test(character)) return 4;
  if (/[\u2e80-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(character)) {
    return 16;
  }
  return 8.5;
}
