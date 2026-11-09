import React, { useState } from "react";
import { ClearIcon, KeyboardIcon } from "./Icons";

const SHORTCUT_GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Topics",
    items: [
      ["Enter", "Add sibling topic"],
      ["Tab", "Add child topic"],
      ["F2", "Edit topic"],
      ["Delete", "Delete topic"],
      ["Space", "Collapse or expand branch"],
      ["Shift + Space", "Expand or collapse entire subtree"],
      ["Alt ↑ / ↓", "Reorder siblings"],
      ["⌘ / Ctrl C / V", "Copy or paste topics"],
      ["Paste lines", "Create child branches"],
    ],
  },
  {
    title: "Navigate",
    items: [
      ["↑ / ↓", "Move between siblings"],
      ["← / →", "Move to parent or first child"],
      ["Right click", "Focus a node as the main topic"],
      ["Esc", "Exit focus mode"],
      ["⌘ / Ctrl Click", "Select multiple topics"],
      ["Left drag", "Marquee select topics"],
      ["Drag topics", "Move below target"],
    ],
  },
  {
    title: "Canvas",
    items: [
      ["H", "Toggle pan mode"],
      ["Right / middle drag", "Pan canvas"],
      ["⌘ / Ctrl + / −", "Zoom"],
      ["⌘ / Ctrl 0", "Center map"],
    ],
  },
  {
    title: "Document",
    items: [
      ["⌘ / Ctrl Z", "Undo"],
      ["⇧⌘Z / Ctrl Y", "Redo"],
      ["⌘ / Ctrl S", "Save"],
      ["⌘ / Ctrl E", "Toggle Markdown mode"],
      ["Enter / Tab", "Continue or nest Markdown lines"],
      ["⌘ / Ctrl B", "Bold topic in Markdown"],
    ],
  },
];

const ShortcutGuide: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="mindmap-shortcut-guide">
      <button
        type="button"
        onClick={() => setShowGuide((prev) => !prev)}
        className={`mindmap-floating-trigger${showGuide ? " is-active" : ""}`}
        aria-expanded={showGuide}
        aria-label={showGuide ? "Close shortcuts" : "Shortcuts"}
        title="Keyboard shortcuts"
      >
        {showGuide ? <ClearIcon size={15} /> : <KeyboardIcon size={16} />}
        <span>Shortcuts</span>
      </button>
      {showGuide && (
        <div className="mindmap-shortcut-popover floating-panel">
          <header className="floating-panel-header">
            <strong>Keyboard shortcuts</strong>
            <span>Work without leaving the keyboard</span>
          </header>
          <div className="mindmap-shortcut-groups">
            {SHORTCUT_GROUPS.map((group) => (
              <section key={group.title}>
                <h4>{group.title}</h4>
                <ul>
                  {group.items.map(([keys, label]) => (
                    <li key={`${group.title}-${keys}`}>
                      <kbd>{keys}</kbd>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortcutGuide;
