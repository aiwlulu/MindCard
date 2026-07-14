import type { NodeData } from "@/lib/types";
import {
  convertToMarkdown,
  parseMindmapMarkdown,
  reconcileMarkdownTree,
} from "./markdown";

describe("mind map Markdown editing", () => {
  const root: NodeData = {
    id: "root",
    root: true,
    topic: "Product plan",
    children: [
      {
        id: "research",
        topic: "Research",
        collapsed: true,
        hyperLink: "card-1",
        children: [
          {
            id: "reference",
            topic: "Reference",
            externalLink: "https://example.com/guide",
            children: [
              { id: "note", topic: "Read later" },
            ],
          },
        ],
      },
    ],
  };

  it("round-trips headings, deep bullets, and external links", () => {
    const markdown = convertToMarkdown(root);
    const result = parseMindmapMarkdown(markdown);

    expect(result.error).toBeNull();
    expect(result.root).toMatchObject({
      topic: "Product plan",
      children: [
        {
          topic: "Research",
          children: [
            {
              topic: "Reference",
              externalLink: "https://example.com/guide",
              children: [{ topic: "Read later" }],
            },
          ],
        },
      ],
    });
  });

  it("accepts a compact bullet list beneath the root", () => {
    const result = parseMindmapMarkdown(
      "# Product plan\n- Research\n  - Interviews\n- Delivery\n"
    );

    expect(result.root?.children?.map((node) => node.topic)).toEqual([
      "Research",
      "Delivery",
    ]);
    expect(result.root?.children?.[0].children?.[0].topic).toBe("Interviews");
  });

  it("preserves node identity and non-Markdown metadata while applying edits", () => {
    const parsed = parseMindmapMarkdown(
      "# Product plan\n## Updated research\n### [Docs](https://example.com/docs)\n"
    ).root;

    expect(parsed).not.toBeNull();
    const reconciled = reconcileMarkdownTree(parsed as NodeData, root);

    expect(reconciled.id).toBe("root");
    expect(reconciled.children?.[0]).toMatchObject({
      id: "research",
      topic: "Updated research",
      collapsed: true,
      hyperLink: "card-1",
    });
    expect(reconciled.children?.[0].children?.[0]).toMatchObject({
      id: "reference",
      topic: "Docs",
      externalLink: "https://example.com/docs",
    });
  });

  it("reports incomplete Markdown without inventing a replacement root", () => {
    expect(parseMindmapMarkdown("## Child without root")).toMatchObject({
      root: null,
      error: expect.stringContaining("root"),
    });
  });
});
