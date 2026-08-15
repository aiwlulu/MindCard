import type { MindmapData, NodeData } from "@/lib/types";
import {
  countDescendants,
  cloneNodeWithNewIds,
  createNode,
  findNode,
  findNodePath,
  formatHiddenDescendantCount,
  insertChild,
  insertSibling,
  moveNode,
  moveNodesAsChildren,
  moveNodesAsSiblings,
  normalizeMindmapData,
  removeNode,
  setAllBranchesCollapsed,
  serializeMindmapData,
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

  it("preserves collapsed branch state while normalizing stored data", () => {
    const data = normalizeMindmapData({
      nodeData: {
        id: "root",
        topic: "Root",
        children: [{ id: "branch", topic: "Branch", collapsed: true }],
      },
    });

    expect(data.nodeData.children?.[0].collapsed).toBe(true);
  });

  it("preserves external links while normalizing stored data", () => {
    const data = normalizeMindmapData({
      nodeData: {
        id: "root",
        topic: "Root",
        externalLink: "https://example.com/reference",
      },
    });

    expect(data.nodeData.externalLink).toBe("https://example.com/reference");
  });

  it("normalizes safe external links and drops unsafe protocols", () => {
    const data = normalizeMindmapData({
      nodeData: {
        id: "root",
        topic: "Root",
        children: [
          { id: "safe", topic: "Safe", externalLink: "example.com/guide" },
          { id: "unsafe", topic: "Unsafe", externalLink: "javascript:alert(1)" },
        ],
      },
    });

    expect(data.nodeData.children?.[0].externalLink).toBe(
      "https://example.com/guide"
    );
    expect(data.nodeData.children?.[1].externalLink).toBeUndefined();
  });

  it("serializes deep trees as a flat Firestore-safe node list", () => {
    let branch: NodeData = { id: "level-12", topic: "Level 12" };
    for (let level = 11; level >= 1; level -= 1) {
      branch = {
        id: `level-${level}`,
        topic: `Level ${level}`,
        children: [branch],
      };
    }
    const data: MindmapData = {
      nodeData: {
        id: "root",
        root: true,
        topic: "Deep map",
        children: [branch],
      },
    };

    const stored = serializeMindmapData(data);

    expect(stored).toMatchObject({ schemaVersion: 2, rootId: "root" });
    expect(stored.nodes).toHaveLength(13);
    expect(stored.nodes.every((node) => !("children" in node))).toBe(true);
    expect(findNode(normalizeMindmapData(stored).nodeData, "level-12")).toMatchObject({
      topic: "Level 12",
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

  it("counts every hidden descendant in a collapsed subtree", () => {
    expect(countDescendants(baseTree().children?.[0] as NodeData)).toBe(1);
    expect(countDescendants(baseTree())).toBe(3);
  });

  it("caps large collapsed-branch labels", () => {
    expect(formatHiddenDescendantCount(3)).toBe("+3");
    expect(formatHiddenDescendantCount(120)).toBe("99+");
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

  it("moves selected nodes before or after a target sibling", () => {
    const tree = baseTree();

    const before = moveNodesAsSiblings(tree, ["two"], "one", "before");
    const after = moveNodesAsSiblings(tree, ["one"], "two", "after");

    expect(before.children?.map((node) => node.id)).toEqual(["two", "one"]);
    expect(after.children?.map((node) => node.id)).toEqual(["two", "one"]);
    expect(moveNodesAsSiblings(tree, ["one"], "one-a", "before")).toEqual(tree);
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

  it("moves selected nodes below a new parent without creating cycles", () => {
    const tree: NodeData = {
      ...baseTree(),
      children: [...(baseTree().children ?? []), { id: "three", topic: "Three" }],
    };
    const moved = moveNodesAsChildren(tree, ["two", "three"], "one");

    expect(moved.children?.map((node) => node.id)).toEqual(["one"]);
    expect(findNode(moved, "one")?.children?.map((node) => node.id)).toEqual([
      "one-a",
      "two",
      "three",
    ]);
    expect(moveNodesAsChildren(tree, ["one"], "one-a")).toEqual(tree);
  });

  it("collapses every non-root branch and expands the complete tree", () => {
    const collapsed = setAllBranchesCollapsed(baseTree(), true);
    const expanded = setAllBranchesCollapsed(collapsed, false);

    expect(collapsed.collapsed).toBeUndefined();
    expect(findNode(collapsed, "one")?.collapsed).toBe(true);
    expect(findNode(expanded, "one")?.collapsed).toBe(false);
  });

  it("clones a subtree with unique ids for paste", () => {
    const cloned = cloneNodeWithNewIds(baseTree().children?.[0] as NodeData);

    expect(cloned.id).not.toBe("one");
    expect(cloned.children?.[0].id).not.toBe("one-a");
    expect(cloned.topic).toBe("One");
  });
});

it("returns the ancestor path down to a node", () => {
  expect(findNodePath(baseTree(), "one-a").map((node) => node.id)).toEqual([
    "root",
    "one",
    "one-a",
  ]);
  expect(findNodePath(baseTree(), "root").map((node) => node.id)).toEqual([
    "root",
  ]);
  expect(findNodePath(baseTree(), "missing")).toEqual([]);
});
