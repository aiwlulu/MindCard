import type { NodeData } from "@/lib/types";
import { layoutMindmap, NODE_MAX_WIDTH, NODE_MIN_HEIGHT } from "./layout";

describe("mind map layout", () => {
  it("places every branch to the right of its parent", () => {
    const root: NodeData = {
      id: "root",
      topic: "Root",
      children: [
        { id: "one", topic: "One", children: [{ id: "one-a", topic: "One A" }] },
        { id: "two", topic: "Two" },
      ],
    };

    const layout = layoutMindmap(root);
    const rootLayout = layout.nodes.find((item) => item.node.id === "root");
    const oneLayout = layout.nodes.find((item) => item.node.id === "one");
    const oneA = layout.nodes.find((item) => item.node.id === "one-a");
    const twoLayout = layout.nodes.find((item) => item.node.id === "two");

    expect(rootLayout?.x).toBeLessThan(oneLayout?.x ?? 0);
    expect(oneLayout?.x).toBeLessThan(oneA?.x ?? 0);
    expect(rootLayout?.x).toBeLessThan(twoLayout?.x ?? 0);
    expect(oneLayout?.side).toBe("right");
    expect(twoLayout?.side).toBe("right");
    expect(oneLayout?.branchIndex).toBe(0);
    expect(oneA?.branchIndex).toBe(0);
    expect(twoLayout?.branchIndex).toBe(1);
    expect(layout.edges.map((edge) => edge.branchIndex)).toEqual([0, 0, 1]);
    const rootToOne = layout.edges.find((edge) => edge.childId === "one");
    const oneToChild = layout.edges.find((edge) => edge.childId === "one-a");
    expect(rootToOne?.endY).toBe(oneLayout?.connectionY);
    expect(oneToChild?.startY).toBe(oneLayout?.connectionY);
    expect(oneToChild?.endY).toBe(oneA?.connectionY);
    expect(layout.edges).toHaveLength(3);
    expect(layout.width).toBeGreaterThan(layout.nodes[0].width);
    expect(layout.height).toBeGreaterThan(layout.nodes[0].height);
  });

  it("handles a root-only map with a bounded canvas", () => {
    const layout = layoutMindmap({ id: "root", topic: "Root" });

    expect(layout.nodes).toHaveLength(1);
    expect(layout.edges).toHaveLength(0);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it("wraps long topics into bounded multi-line nodes", () => {
    const layout = layoutMindmap({
      id: "root",
      topic: "這是一段很長的中文節點內容，用來確認畫布不會再讓文字超出節點或畫面範圍。",
    });
    const node = layout.nodes[0];

    expect(node.lines.length).toBeGreaterThan(1);
    expect(node.width).toBeLessThanOrEqual(NODE_MAX_WIDTH);
    expect(node.height).toBeGreaterThan(NODE_MIN_HEIGHT);
  });

  it("does not lay out descendants of a collapsed branch", () => {
    const layout = layoutMindmap({
      id: "root",
      topic: "Root",
      children: [
        {
          id: "branch",
          topic: "Branch",
          collapsed: true,
          children: [{ id: "hidden", topic: "Hidden" }],
        },
      ],
    });

    expect(layout.nodes.map((node) => node.node.id)).toEqual(["root", "branch"]);
    expect(layout.edges).toHaveLength(1);
  });
});
