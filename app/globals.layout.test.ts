import fs from "node:fs";
import path from "node:path";

const stylesheet = fs.readFileSync(
  path.join(process.cwd(), "app/globals.css"),
  "utf8"
);

function ruleBody(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = stylesheet.match(
    new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, "m")
  );

  if (!match) {
    throw new Error(`Could not find CSS rule: ${selector}`);
  }

  return match[1];
}

describe("zoom-resilient mind map editor layout", () => {
  it("allocates the editor around a wrapping command bar", () => {
    const editor = ruleBody(".mindmap-editor");
    const commandBar = ruleBody(".mindmap-commandbar");
    const showcase = ruleBody(".showcase");

    expect(editor).toMatch(/display:\s*flex/);
    expect(editor).toMatch(/flex-direction:\s*column/);
    expect(editor).toMatch(/overflow-y:\s*auto/);

    expect(commandBar).toMatch(/position:\s*relative/);
    expect(commandBar).toMatch(/flex:\s*0\s+0\s+auto/);
    expect(commandBar).not.toMatch(/position:\s*absolute/);

    expect(showcase).toMatch(/flex:\s*1\s+1\s+auto/);
    expect(showcase).toMatch(/height:\s*auto/);
    expect(showcase).toMatch(/min-height:\s*0/);
  });

  it("prevents a narrow command bar from creating horizontal editor overflow", () => {
    const editor = ruleBody(".mindmap-editor");
    const commandBar = ruleBody(".mindmap-commandbar");

    expect(editor).toMatch(/overflow-x:\s*hidden/);
    expect(editor).toMatch(/overflow-y:\s*auto/);
    expect(commandBar).toMatch(/min-width:\s*0/);
  });
});
