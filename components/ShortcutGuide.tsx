import React, { useState } from "react";

const ShortcutGuide: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="mindmap-shortcut-guide">
      <button
        onClick={() => setShowGuide((prev) => !prev)}
        className="mindmap-floating-trigger"
        aria-expanded={showGuide}
      >
        {showGuide ? "Close shortcuts" : "Shortcuts"}
      </button>
      {showGuide && (
        <div className="mindmap-shortcut-popover">
          <ul>
            <li><kbd>Enter</kbd><span>Add sibling topic</span></li>
            <li><kbd>Tab</kbd><span>Add child topic</span></li>
            <li><kbd>F2</kbd><span>Edit topic</span></li>
            <li><kbd>Space</kbd><span>Collapse or expand branch</span></li>
            <li><kbd>Delete</kbd><span>Delete topic</span></li>
            <li><kbd>Alt ↑ / ↓</kbd><span>Reorder siblings</span></li>
            <li><kbd>↑ / ↓</kbd><span>Move between siblings</span></li>
            <li><kbd>← / →</kbd><span>Move to parent or first child</span></li>
            <li><kbd>⌘ / Ctrl Z</kbd><span>Undo</span></li>
            <li><kbd>⌘ / Ctrl S</kbd><span>Save</span></li>
            <li><kbd>⌘ / Ctrl E</kbd><span>Toggle Markdown mode</span></li>
            <li><kbd>⌘ / Ctrl C / V</kbd><span>Copy or paste topics</span></li>
            <li><kbd>⌘ / Ctrl Click</kbd><span>Select multiple topics</span></li>
            <li><kbd>Left drag</kbd><span>Marquee select topics</span></li>
            <li><kbd>Drag topics</kbd><span>Move below target</span></li>
            <li><kbd>Paste lines</kbd><span>Create child branches</span></li>
            <li><kbd>Right / middle drag</kbd><span>Pan canvas</span></li>
            <li><kbd>⌘ / Ctrl + / −</kbd><span>Zoom</span></li>
            <li><kbd>⌘ / Ctrl 0</kbd><span>Center map</span></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShortcutGuide;
