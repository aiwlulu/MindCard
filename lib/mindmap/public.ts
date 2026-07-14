import { serializeMindmapData } from "./tree";
import type { MindmapData, NodeData } from "@/lib/types";

/** Removes private MindCard links before a tree reaches a public viewer/export. */
export function toPublicMindmapNode(node: NodeData): NodeData {
  const publicNode: NodeData = {
    id: node.id,
    topic: node.topic,
    ...(node.root ? { root: true } : {}),
    ...(node.externalLink ? { externalLink: node.externalLink } : {}),
    ...(node.collapsed ? { collapsed: true } : {}),
  };

  if (node.children?.length) {
    publicNode.children = node.children.map(toPublicMindmapNode);
  }

  return publicNode;
}

/** Builds the only mind-map payload that may be stored in a public document. */
export function toPublicMindmapData(data: MindmapData) {
  const root = data.root ?? data.nodeData;
  return serializeMindmapData({ nodeData: toPublicMindmapNode(root) });
}
