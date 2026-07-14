import type { NodeData } from "@/lib/types";
import { buildMindmapSvg, convertToMarkdown, sanitizeFilename } from "./export";

const root: NodeData = {
  id: "root",
  topic: "A < Root >",
  children: [
    { id: "child", topic: "Child & detail", hyperLink: "map-2" },
    { id: "deep", topic: "Deep", children: [{ id: "leaf", topic: "Leaf" }] },
  ],
};

describe("mind map exports", () => {
  it("serializes nested topics as Markdown headings and lists", () => {
    expect(convertToMarkdown(root)).toBe(
      "# A < Root >\n## Child & detail\n## Deep\n### Leaf\n"
    );
  });

  it("serializes an escaped SVG with connectors and card links", () => {
    const svg = buildMindmapSvg(root);

    expect(svg).toContain("A &lt; Root &gt;");
    expect(svg).toContain("Child &amp; detail");
    expect(svg).toContain('href="/mindmap/map-2"');
    expect(svg).toContain("Open linked mind map");
    expect(svg).toContain('role="img"');
    expect(svg).toContain("path");
  });

  it("exports the visible canvas while keeping collapsed descendants in Markdown", () => {
    const collapsedRoot: NodeData = {
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
    };

    expect(buildMindmapSvg(collapsedRoot)).not.toContain("Hidden");
    expect(convertToMarkdown(collapsedRoot)).toContain("### Hidden");
  });

  it("sanitizes a downloaded filename", () => {
    expect(sanitizeFilename('a:/bad*title? "map"')).toBe("a_bad_title_map");
  });
});
