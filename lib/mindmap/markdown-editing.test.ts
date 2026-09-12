import {
  applyMarkdownEdit,
  continueMarkdownLine,
  indentMarkdownLines,
  outdentMarkdownLines,
  toggleMarkdownBold,
} from "./markdown-editing";

const cursorAt = (value: string, marker = "|") => {
  const offset = value.indexOf(marker);
  return { value: value.replace(marker, ""), offset };
};

describe("Markdown outline keyboard editing", () => {
  describe("Enter", () => {
    it("continues a bullet with the same indent and marker", () => {
      const { value, offset } = cursorAt("# Plan\n  - First|");
      expect(continueMarkdownLine(value, offset, offset)).toEqual({
        value: "# Plan\n  - First\n  - ",
        selectionStart: 21,
        selectionEnd: 21,
      });
    });

    it("splits the text at the cursor onto the new bullet", () => {
      const { value, offset } = cursorAt("# Plan\n- Read| the docs");
      const edit = continueMarkdownLine(value, offset, offset);
      expect(edit?.value).toBe("# Plan\n- Read\n- the docs");
      expect(edit?.selectionStart).toBe("# Plan\n- Read\n- ".length);
    });

    it("continues a heading at the same level and nests under the root", () => {
      const rootLine = cursorAt("# Plan|");
      expect(continueMarkdownLine(rootLine.value, rootLine.offset, rootLine.offset)?.value).toBe(
        "# Plan\n## "
      );
      const section = cursorAt("# Plan\n## Research|");
      expect(continueMarkdownLine(section.value, section.offset, section.offset)?.value).toBe(
        "# Plan\n## Research\n## "
      );
    });

    it("outdents an empty nested bullet and clears an empty base bullet", () => {
      const nested = cursorAt("# Plan\n- A\n  - |");
      expect(continueMarkdownLine(nested.value, nested.offset, nested.offset)).toEqual({
        value: "# Plan\n- A\n- ",
        selectionStart: 13,
        selectionEnd: 13,
      });
      const base = cursorAt("# Plan\n- A\n- |");
      expect(continueMarkdownLine(base.value, base.offset, base.offset)).toEqual({
        value: "# Plan\n- A\n",
        selectionStart: 11,
        selectionEnd: 11,
      });
    });

    it("replaces a selection before continuing the list", () => {
      const value = "# Plan\n- Read everything";
      const start = "# Plan\n- Read ".length;
      expect(continueMarkdownLine(value, start, value.length)?.value).toBe(
        "# Plan\n- Read \n- "
      );
    });

    it("leaves plain lines to the browser", () => {
      expect(continueMarkdownLine("just text", 9, 9)).toBeNull();
    });
  });

  describe("Tab", () => {
    it("indents a bullet beneath the bullet above it", () => {
      const { value, offset } = cursorAt("# Plan\n- A\n- B|");
      expect(indentMarkdownLines(value, offset, offset)).toEqual({
        value: "# Plan\n- A\n  - B",
        selectionStart: offset + 2,
        selectionEnd: offset + 2,
      });
    });

    it("refuses to skip a level or move the root", () => {
      const tooDeep = cursorAt("# Plan\n- A\n  - B|");
      expect(indentMarkdownLines(tooDeep.value, tooDeep.offset, tooDeep.offset)).toBeNull();
      const firstChild = cursorAt("# Plan\n- A|");
      expect(indentMarkdownLines(firstChild.value, firstChild.offset, firstChild.offset)).toBeNull();
      expect(indentMarkdownLines("# Plan", 3, 3)).toBeNull();
    });

    it("turns headings into deeper headings and then bullets", () => {
      expect(indentMarkdownLines("# Plan\n## A", 10, 10)?.value).toBe("# Plan\n### A");
      expect(indentMarkdownLines("# Plan\n### A", 11, 11)?.value).toBe("# Plan\n- A");
    });

    it("indents every selected line together", () => {
      const value = "# Plan\n- A\n- B\n  - C\n- D";
      const start = value.indexOf("- B");
      const end = value.indexOf("- D");
      expect(indentMarkdownLines(value, start, end)).toEqual({
        value: "# Plan\n- A\n  - B\n    - C\n- D",
        selectionStart: start + 2,
        selectionEnd: end + 4,
      });
    });
  });

  describe("Shift+Tab", () => {
    it("outdents a nested bullet", () => {
      const { value, offset } = cursorAt("# Plan\n- A\n  - B|");
      expect(outdentMarkdownLines(value, offset, offset)).toEqual({
        value: "# Plan\n- A\n- B",
        selectionStart: offset - 2,
        selectionEnd: offset - 2,
      });
    });

    it("promotes a base bullet to the heading level above it", () => {
      expect(outdentMarkdownLines("# Plan\n## A\n- B", 14, 14)?.value).toBe(
        "# Plan\n## A\n## B"
      );
      expect(outdentMarkdownLines("# Plan\n### A\n- B", 15, 15)?.value).toBe(
        "# Plan\n### A\n### B"
      );
      expect(outdentMarkdownLines("# Plan\n#### A", 12, 12)?.value).toBe("# Plan\n### A");
    });

    it("never creates a second root", () => {
      expect(outdentMarkdownLines("# Plan\n- B", 9, 9)).toBeNull();
      expect(outdentMarkdownLines("# Plan\n## B", 10, 10)).toBeNull();
    });
  });

  describe("Cmd+B", () => {
    it("wraps and unwraps a selection", () => {
      const value = "# Plan\n- Ship it";
      const start = value.indexOf("Ship");
      const wrapped = toggleMarkdownBold(value, start, value.length);
      expect(wrapped).toEqual({
        value: "# Plan\n- **Ship it**",
        selectionStart: start + 2,
        selectionEnd: value.length + 2,
      });
      expect(
        toggleMarkdownBold(wrapped!.value, wrapped!.selectionStart, wrapped!.selectionEnd)
      ).toEqual({ value, selectionStart: start, selectionEnd: value.length });
    });

    it("toggles the whole topic when nothing is selected", () => {
      const { value, offset } = cursorAt("# Plan\n- Ship| it");
      const bold = toggleMarkdownBold(value, offset, offset);
      expect(bold).toEqual({
        value: "# Plan\n- **Ship it**",
        selectionStart: offset + 2,
        selectionEnd: offset + 2,
      });
      expect(toggleMarkdownBold(bold!.value, bold!.selectionStart, bold!.selectionEnd)).toEqual({
        value,
        selectionStart: offset,
        selectionEnd: offset,
      });
    });

    it("opens an empty bold pair on an empty topic", () => {
      expect(toggleMarkdownBold("# Plan\n- ", 9, 9)).toEqual({
        value: "# Plan\n- ****",
        selectionStart: 11,
        selectionEnd: 11,
      });
    });
  });

  describe("applyMarkdownEdit", () => {
    it("falls back to direct assignment and restores the selection", () => {
      const textarea = document.createElement("textarea");
      textarea.value = "# Plan\n- A";
      const onFallback = jest.fn();

      applyMarkdownEdit(
        textarea,
        { value: "# Plan\n- A\n- ", selectionStart: 13, selectionEnd: 13 },
        onFallback
      );

      expect(textarea.value).toBe("# Plan\n- A\n- ");
      expect(onFallback).toHaveBeenCalledWith("# Plan\n- A\n- ");
      expect(textarea.selectionStart).toBe(13);
    });
  });
});
