import { toPublicMindmapData, toPublicMindmapNode } from "./public";

describe("public mind map sanitization", () => {
  it("removes private card links while preserving public external links", () => {
    const result = toPublicMindmapNode({
      id: "root",
      root: true,
      topic: "Root",
      hyperLink: "private-map",
      children: [
        {
          id: "child",
          topic: "Reference",
          hyperLink: "another-private-map",
          externalLink: "https://example.com",
        },
      ],
    });

    expect(result.hyperLink).toBeUndefined();
    expect(result.children?.[0]).toMatchObject({
      topic: "Reference",
      externalLink: "https://example.com",
    });
    expect(result.children?.[0].hyperLink).toBeUndefined();
  });

  it("builds a serializable snapshot without private card ids", () => {
    const result = toPublicMindmapData({
      nodeData: {
        id: "root",
        root: true,
        topic: "Root",
        hyperLink: "private-map",
        children: [
          {
            id: "child",
            topic: "Reference",
            hyperLink: "another-private-map",
            externalLink: "https://example.com",
          },
        ],
      },
    });

    expect(result).toMatchObject({ schemaVersion: 2, rootId: "root" });
    expect(JSON.stringify(result)).not.toContain("private-map");
    expect(JSON.stringify(result)).toContain("https://example.com");
  });
});
