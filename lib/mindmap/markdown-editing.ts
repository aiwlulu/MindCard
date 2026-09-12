// Keyboard editing helpers for the Markdown outline textarea.
// All functions are pure: they take the current value plus selection and
// return the next value plus selection, or null when the default browser
// behaviour should run instead.

export interface MarkdownEdit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

interface LineSpan {
  start: number;
  end: number;
  text: string;
}

type LineInfo =
  | { kind: "heading"; level: number; contentStart: number; content: string }
  | {
      kind: "bullet";
      indent: number;
      marker: string;
      contentStart: number;
      content: string;
    }
  | { kind: "plain" };

const HEADING_LINE = /^(#{1,6})(?=\s|$)[ \t]*(.*)$/;
const BULLET_LINE = /^([ \t]*)([-*+])(?=\s|$)[ \t]*(.*)$/;
const BOLD_CONTENT = /^\*\*((?:(?!\*\*)[\s\S])+)\*\*$/;
const INDENT_STEP = 2;

export function describeMarkdownLine(text: string): LineInfo {
  const heading = text.match(HEADING_LINE);
  if (heading) {
    return {
      kind: "heading",
      level: heading[1].length,
      contentStart: text.length - heading[2].length,
      content: heading[2],
    };
  }

  const bullet = text.match(BULLET_LINE);
  if (bullet) {
    return {
      kind: "bullet",
      indent: measureIndent(bullet[1]),
      marker: bullet[2],
      contentStart: text.length - bullet[3].length,
      content: bullet[3],
    };
  }

  return { kind: "plain" };
}

// Enter: split the current heading/bullet and continue it on the next line.
// An empty nested bullet outdents; an empty base item clears its marker.
export function continueMarkdownLine(
  value: string,
  selectionStart: number,
  selectionEnd: number
): MarkdownEdit | null {
  const text = `${value.slice(0, selectionStart)}${value.slice(selectionEnd)}`;
  const cursor = selectionStart;
  const line = lineAt(text, cursor);
  const info = describeMarkdownLine(line.text);
  if (info.kind === "plain") return null;

  if (!info.content.trim()) {
    if (info.kind === "bullet" && info.indent > 0) {
      const replacement = `${" ".repeat(Math.max(0, info.indent - INDENT_STEP))}${info.marker} `;
      return replaceLine(text, line, replacement, replacement.length);
    }
    return replaceLine(text, line, "", 0);
  }

  const splitAt = Math.max(cursor - line.start, info.contentStart);
  const before = line.text.slice(0, splitAt);
  const after = line.text.slice(splitAt).replace(/^[ \t]+/, "");
  const prefix =
    info.kind === "heading"
      ? `${"#".repeat(info.level === 1 ? 2 : info.level)} `
      : `${" ".repeat(info.indent)}${info.marker} `;
  const nextValue = `${text.slice(0, line.start)}${before}\n${prefix}${after}${text.slice(line.end)}`;
  const nextCursor = line.start + before.length + 1 + prefix.length;

  return { value: nextValue, selectionStart: nextCursor, selectionEnd: nextCursor };
}

// Tab: move the selected lines one level deeper. A bullet can only become a
// child of the line above it; the root heading never moves.
export function indentMarkdownLines(
  value: string,
  selectionStart: number,
  selectionEnd: number
): MarkdownEdit | null {
  return transformLines(value, selectionStart, selectionEnd, (line, index, lines, isFirst) => {
    const info = describeMarkdownLine(line);
    if (info.kind === "heading") {
      if (info.level === 1) return null;
      const prefix = info.level === 2 ? "### " : "- ";
      return `${prefix}${line.slice(info.contentStart)}`;
    }
    if (info.kind === "bullet") {
      // Lines inside a selection keep their relative depth; only the leading
      // line is checked against the line above it.
      if (isFirst) {
        const previous = previousOutlineLine(lines, index);
        if (!previous || previous.kind !== "bullet") return null;
        if (info.indent - previous.indent >= INDENT_STEP) return null;
      }
      return `${" ".repeat(info.indent + INDENT_STEP)}${line.slice(line.length - line.trimStart().length)}`;
    }
    return null;
  });
}

// Shift+Tab: move the selected lines one level up. A base bullet becomes a
// heading at the level of the nearest heading above it.
export function outdentMarkdownLines(
  value: string,
  selectionStart: number,
  selectionEnd: number
): MarkdownEdit | null {
  return transformLines(value, selectionStart, selectionEnd, (line, index, lines) => {
    const info = describeMarkdownLine(line);
    if (info.kind === "heading") {
      if (info.level <= 2) return null;
      return `${"#".repeat(info.level - 1)} ${line.slice(info.contentStart)}`;
    }
    if (info.kind === "bullet") {
      const body = line.slice(line.length - line.trimStart().length);
      if (info.indent >= INDENT_STEP) {
        return `${" ".repeat(info.indent - INDENT_STEP)}${body}`;
      }
      const heading = nearestHeadingAbove(lines, index);
      if (!heading || heading.level < 2) return null;
      return `${"#".repeat(heading.level)} ${line.slice(info.contentStart)}`;
    }
    return null;
  });
}

// Cmd/Ctrl+B: wrap the selection in ** or toggle whole-line bold.
export function toggleMarkdownBold(
  value: string,
  selectionStart: number,
  selectionEnd: number
): MarkdownEdit | null {
  const selected = value.slice(selectionStart, selectionEnd);
  if (selected && !selected.includes("\n")) {
    const inner = selected.match(BOLD_CONTENT);
    if (inner) {
      const nextValue = `${value.slice(0, selectionStart)}${inner[1]}${value.slice(selectionEnd)}`;
      return {
        value: nextValue,
        selectionStart,
        selectionEnd: selectionStart + inner[1].length,
      };
    }
    const wrappedBefore = value.slice(Math.max(0, selectionStart - 2), selectionStart);
    const wrappedAfter = value.slice(selectionEnd, selectionEnd + 2);
    if (wrappedBefore === "**" && wrappedAfter === "**") {
      const nextValue = `${value.slice(0, selectionStart - 2)}${selected}${value.slice(selectionEnd + 2)}`;
      return {
        value: nextValue,
        selectionStart: selectionStart - 2,
        selectionEnd: selectionEnd - 2,
      };
    }
    const nextValue = `${value.slice(0, selectionStart)}**${selected}**${value.slice(selectionEnd)}`;
    return {
      value: nextValue,
      selectionStart: selectionStart + 2,
      selectionEnd: selectionEnd + 2,
    };
  }

  const line = lineAt(value, selectionStart);
  const info = describeMarkdownLine(line.text);
  if (info.kind === "plain") return null;

  const content = info.content.trimEnd();
  const head = line.text.slice(0, info.contentStart);
  const bold = content.match(BOLD_CONTENT);
  if (bold) {
    return replaceLine(
      value,
      line,
      `${head}${bold[1]}`,
      Math.max(head.length, Math.min(selectionStart - line.start - 2, head.length + bold[1].length))
    );
  }
  if (!content) {
    return replaceLine(value, line, `${head}****`, head.length + 2);
  }
  return replaceLine(
    value,
    line,
    `${head}**${content}**`,
    Math.max(
      head.length + 2,
      Math.min(selectionStart - line.start + 2, head.length + content.length + 2)
    )
  );
}

// Applies an edit through execCommand when possible so the browser keeps its
// native undo stack, falling back to direct assignment (jsdom, old engines).
export function applyMarkdownEdit(
  textarea: HTMLTextAreaElement,
  edit: MarkdownEdit,
  onFallback: (value: string) => void
): void {
  const current = textarea.value;
  const limit = Math.min(current.length, edit.value.length);
  let prefix = 0;
  while (prefix < limit && current[prefix] === edit.value[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < limit - prefix &&
    current[current.length - 1 - suffix] === edit.value[edit.value.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const replacement = edit.value.slice(prefix, edit.value.length - suffix);

  let applied = false;
  try {
    textarea.setSelectionRange(prefix, current.length - suffix);
    applied = replacement
      ? document.execCommand("insertText", false, replacement)
      : document.execCommand("delete");
  } catch {
    applied = false;
  }

  if (!applied || textarea.value !== edit.value) {
    textarea.value = edit.value;
    onFallback(edit.value);
  }
  textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd);
}

function transformLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  transform: (
    line: string,
    index: number,
    lines: string[],
    isFirst: boolean
  ) => string | null
): MarkdownEdit | null {
  const lines = value.split("\n");
  const first = lineIndexAt(value, selectionStart);
  // A selection ending at a line start does not include that line.
  const lastOffset =
    selectionEnd > selectionStart && value[selectionEnd - 1] === "\n"
      ? selectionEnd - 1
      : selectionEnd;
  const last = lineIndexAt(value, lastOffset);

  // The leading line decides whether the block can move at all.
  if (lines[first].trim() && transform(lines[first], first, lines, true) === null) {
    return null;
  }

  let firstDelta = 0;
  let totalDelta = 0;
  let changed = false;
  const nextLines = lines.map((line, index) => {
    if (index < first || index > last || !line.trim()) return line;
    const next = transform(line, index, lines, index === first);
    if (next === null) return line;
    if (index === first) firstDelta = next.length - line.length;
    totalDelta += next.length - line.length;
    changed = true;
    return next;
  });

  if (!changed) return null;
  const firstStart = lineStartOffset(value, first);
  return {
    value: nextLines.join("\n"),
    selectionStart: Math.max(firstStart, selectionStart + firstDelta),
    selectionEnd: Math.max(firstStart, selectionEnd + totalDelta),
  };
}

function previousOutlineLine(lines: string[], index: number): LineInfo | null {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (!lines[cursor].trim()) continue;
    return describeMarkdownLine(lines[cursor]);
  }
  return null;
}

function nearestHeadingAbove(
  lines: string[],
  index: number
): { level: number } | null {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const info = describeMarkdownLine(lines[cursor]);
    if (info.kind === "heading") return { level: info.level };
  }
  return null;
}

function replaceLine(
  value: string,
  line: LineSpan,
  replacement: string,
  cursorInLine: number
): MarkdownEdit {
  const cursor = line.start + cursorInLine;
  return {
    value: `${value.slice(0, line.start)}${replacement}${value.slice(line.end)}`,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}

function lineAt(value: string, offset: number): LineSpan {
  const start = value.lastIndexOf("\n", offset - 1) + 1;
  const newline = value.indexOf("\n", offset);
  const end = newline === -1 ? value.length : newline;
  return { start, end, text: value.slice(start, end) };
}

function lineIndexAt(value: string, offset: number): number {
  let index = 0;
  for (let cursor = 0; cursor < offset && cursor < value.length; cursor += 1) {
    if (value[cursor] === "\n") index += 1;
  }
  return index;
}

function lineStartOffset(value: string, lineIndex: number): number {
  let offset = 0;
  for (let index = 0; index < lineIndex; index += 1) {
    offset = value.indexOf("\n", offset) + 1;
  }
  return offset;
}

function measureIndent(whitespace: string): number {
  return Array.from(whitespace).reduce(
    (total, character) => total + (character === "\t" ? 2 : 1),
    0
  );
}
