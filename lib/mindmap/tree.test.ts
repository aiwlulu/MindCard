import type { MindmapData, NodeData } from "@/lib/types";
import {
  cloneNodeWithNewIds,
  createNode,
  findNode,
  insertChild,
  insertSibling,
  moveNode,
  normalizeMindmapData,
  removeNode,
  updateNode,
} from "./tree";

const baseTree = (): NodeData => ({
  id: "root",
  root: true,
  topic: "Root",
  children: [
    {
      id: "one",
      topic: "One",
      children: [{ id: "one-a", topic: "One A" }],
    },
    { id: "two", topic: "Two" },
  ],
});

describe("mind map tree operations", () => {
  it("normalizes legacy data into a safe root node", () => {
    const data = normalizeMindmapData({
      root: { id: "legacy-root", topic: "Legacy" },
    });

    expect(data).toEqual({
      nodeData: { id: "legacy-root", topic: "Legacy", root: true },
    });
  });

  it("creates a node with a generated id and empty children omitted", () => {
    const node = createNode("New Topic");

    expect(node.topic).toBe("New Topic");
    expect(node.id).toEqual(expect.any(String));
    expect(node.children).toBeUndefined();
  });

  it("finds a nested node", () => {
    expect(findNode(baseTree(), "one-a")).toMatchObject({
      id: "one-a",
      topic: "One A",
    });
  });

  it("updates one node without mutating the original tree", () => {
    const original = baseTree();
    const updated = updateNode(original, "one", (node) => ({
      ...node,
      topic: "Renamed",
      hyperLink: "map-2",
    }));

    expect(findNode(updated, "one")).toMatchObject({
      topic: "Renamed",
      hyperLink: "map-2",
    });
    expect(findNode(original, "one")).toMatchObject({ topic: "One" });
  });

  it("inserts children and siblings at the selected node position", () => {
    const tree = baseTree();
    const withChild = insertChild(tree, "two", {
      id: "two-a",
      topic: "Two A",
    });
    const withSibling = insertSibling(withChild, "one", {
      id: "between",
      topic: "Between",
    });

    expect(withSibling.children?.map((node) => node.id)).toEqual([
      "one",
      "between",
      "two",
    ]);
    expect(findNode(withSibling, "two")?.children?.[0].id).toBe("two-a");
  });

  it("removes a non-root node but protects the root", () => {
    const tree = baseTree();
    const removed = removeNode(tree, "one-a");
    const protectedRoot = removeNode(tree, "root");

    expect(removed.removed).toBe(true);
    expect(findNode(removed.root, "one-a")).toBeNull();
    expect(protectedRoot.removed).toBe(false);
    expect(protectedRoot.root).toEqual(tree);
  });

  it("moves a node within its sibling list", () => {
    const tree = baseTree();

    expect(moveNode(tree, "two", "up").children?.map((node) => node.id)).toEqual([
      "two",
      "one",
    ]);
    expect(moveNode(tree, "one", "down").children?.map((node) => node.id)).toEqual([
      "two",
      "one",
    ]);
  });

  it("clones a subtree with unique ids for paste", () => {
    const cloned = cloneNodeWithNewIds(baseTree().children?.[0] as NodeData);

    expect(cloned.id).not.toBe("one");
    expect(cloned.children?.[0].id).not.toBe("one-a");
    expect(cloned.topic).toBe("One");
  });
});
