import { parseInlineBold, stripBoldMarkers } from "./richtext";
import { wrapTopicSegments } from "./layout";

describe("inline bold parsing", () => {
  it("splits a leading bold run from the rest of the line", () => {
    expect(parseInlineBold("**價**：股價往哪裡走")).toEqual([
      { text: "價", bold: true },
      { text: "：股價往哪裡走", bold: false },
    ]);
  });

  it("keeps multiple bold runs separate", () => {
    expect(parseInlineBold("a **b** c **d**")).toEqual([
      { text: "a ", bold: false },
      { text: "b", bold: true },
      { text: " c ", bold: false },
      { text: "d", bold: true },
    ]);
  });

  it("leaves unpaired markers untouched", () => {
    expect(parseInlineBold("2 ** 3")).toEqual([{ text: "2 ** 3", bold: false }]);
  });

  it("strips markers for plain text", () => {
    expect(stripBoldMarkers("**量**：市場交易有多積極")).toBe(
      "量：市場交易有多積極"
    );
  });
});

describe("wrapTopicSegments", () => {
  it("carries the bold flag across wrapped lines", () => {
    const lines = wrapTopicSegments("**整體判讀**：價、量、籌碼搭配，比單看股價更完整", 300);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[0][0]).toEqual({ text: "整體判讀", bold: true });
    expect(lines.flat().map((segment) => segment.text).join("")).not.toContain("*");
  });

  it("splits on explicit newlines", () => {
    expect(wrapTopicSegments("one\ntwo", 300)).toEqual([
      [{ text: "one", bold: false }],
      [{ text: "two", bold: false }],
    ]);
  });
});
