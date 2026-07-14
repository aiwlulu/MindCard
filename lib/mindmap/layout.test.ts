import type { NodeData } from "@/lib/types";
import { layoutMindmap } from "./layout";

describe("mind map layout", () => {
  it("places descendants to the right and keeps sibling branches ordered", () => {
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
    expect(oneLayout?.y).toBeLessThan(twoLayout?.y ?? 0);
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
});
