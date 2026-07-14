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
        {showGuide ? "關閉快捷鍵" : "快捷鍵"}
      </button>
      {showGuide && (
        <div className="mindmap-shortcut-popover">
          <ul>
            <li><kbd>Enter</kbd><span>新增同層節點</span></li>
            <li><kbd>Tab</kbd><span>新增子節點</span></li>
            <li><kbd>F2</kbd><span>編輯節點</span></li>
            <li><kbd>Space</kbd><span>摺疊／展開分支</span></li>
            <li><kbd>Delete</kbd><span>刪除節點</span></li>
            <li><kbd>Alt ↑ / ↓</kbd><span>移動同層順序</span></li>
            <li><kbd>⌘ / Ctrl Z</kbd><span>復原</span></li>
            <li><kbd>⌘ / Ctrl S</kbd><span>儲存</span></li>
            <li><kbd>⌘ / Ctrl C / V</kbd><span>複製／貼上節點</span></li>
            <li><kbd>⌘ / Ctrl + / −</kbd><span>縮放</span></li>
            <li><kbd>⌘ / Ctrl 0</kbd><span>回到中心</span></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShortcutGuide;
