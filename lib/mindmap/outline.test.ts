import { parsePastedOutline } from "./outline";

describe("pasted outline parsing", () => {
  it("turns line-separated text into sibling topics", () => {
    const nodes = parsePastedOutline("Research\nDraft\nPublish");

    expect(nodes.map((node) => node.topic)).toEqual([
      "Research",
      "Draft",
      "Publish",
    ]);
  });

  it("preserves nested bullet-list indentation", () => {
    const nodes = parsePastedOutline(
      "- Research\n  - Interviews\n  - Survey\n- Draft report"
    );

    expect(nodes.map((node) => node.topic)).toEqual(["Research", "Draft report"]);
    expect(nodes[0].children?.map((node) => node.topic)).toEqual([
      "Interviews",
      "Survey",
    ]);
  });

  it("turns a single plain-text line into one topic", () => {
    expect(parsePastedOutline("Just one line")).toMatchObject([
      { topic: "Just one line" },
    ]);
  });

  it("turns a pasted URL into a compact external-link node", () => {
    const nodes = parsePastedOutline(
      "https://medium.com/example/a-very-long-article-url"
    );

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      topic: "medium.com",
      externalLink: "https://medium.com/example/a-very-long-article-url",
    });
  });
});
