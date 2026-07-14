import type { NodeData } from "@/lib/types";

export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 58;
export const LEVEL_GAP = 100;
export const SIBLING_GAP = 24;
export const CANVAS_PADDING = 80;

export interface LayoutNode {
  node: NodeData;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface LayoutEdge {
  parentId: string;
  childId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface MindmapLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  levelGap?: number;
  siblingGap?: number;
  padding?: number;
}

export function layoutMindmap(
  root: NodeData,
  options: LayoutOptions = {}
): MindmapLayout {
  const nodeWidth = options.nodeWidth ?? NODE_WIDTH;
  const nodeHeight = options.nodeHeight ?? NODE_HEIGHT;
  const levelGap = options.levelGap ?? LEVEL_GAP;
  const siblingGap = options.siblingGap ?? SIBLING_GAP;
  const padding = options.padding ?? CANVAS_PADDING;
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const totalHeight = measureHeight(root, nodeHeight, siblingGap);
  const canvasHeight = Math.max(totalHeight + padding * 2, 360);
  const startY = padding + (canvasHeight - padding * 2 - totalHeight) / 2;

  assignLayout(root, startY, padding, 0);

  const maxX = nodes.reduce(
    (current, item) => Math.max(current, item.x + item.width),
    0
  );

  return {
    nodes,
    edges,
    width: maxX + padding,
    height: canvasHeight,
  };

  function assignLayout(
    node: NodeData,
    subtreeTop: number,
    x: number,
    depth: number,
    parent?: LayoutNode
  ): LayoutNode {
    const subtreeHeight = measureHeight(node, nodeHeight, siblingGap);
    const layoutNode: LayoutNode = {
      node,
      x,
      y: subtreeTop + (subtreeHeight - nodeHeight) / 2,
      width: nodeWidth,
      height: nodeHeight,
      depth,
    };
    nodes.push(layoutNode);

    if (parent) {
      edges.push({
        parentId: parent.node.id,
        childId: node.id,
        startX: parent.x + parent.width,
        startY: parent.y + parent.height / 2,
        endX: layoutNode.x,
        endY: layoutNode.y + layoutNode.height / 2,
      });
    }

    let childTop = subtreeTop;
    for (const child of node.children ?? []) {
      assignLayout(
        child,
        childTop,
        x + nodeWidth + levelGap,
        depth + 1,
        layoutNode
      );
      childTop += measureHeight(child, nodeHeight, siblingGap) + siblingGap;
    }

    return layoutNode;
  }
}

function measureHeight(
  node: NodeData,
  nodeHeight: number,
  siblingGap: number
): number {
  const children = node.children ?? [];
  if (!children.length) return nodeHeight;

  const childrenHeight = children.reduce(
    (total, child) => total + measureHeight(child, nodeHeight, siblingGap),
    0
  );
  return Math.max(nodeHeight, childrenHeight + siblingGap * (children.length - 1));
}
