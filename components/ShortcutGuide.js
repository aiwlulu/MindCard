import { useState } from "react";

const ShortcutGuide = () => {
  const [showGuide, setShowGuide] = useState(false);

  const toggleGuide = () => {
    setShowGuide(!showGuide);
  };

  return (
    <div className="fixed bottom-6 left-5">
      <button
        onClick={toggleGuide}
        className="text-white transition duration-150 ease-in-out  font-semi py-2 px-4 rounded"
        style={{ backgroundColor: "rgb(45, 55, 72)" }}
      >
        {showGuide ? "Hide Shortcuts" : "Show Shortcuts"}
      </button>
      {showGuide && (
        <div className="mt-4 p-4 bg-gray-800 text-white rounded-lg shadow-xl">
          <ul className="list-disc list-inside space-y-2">
            <li className="font-medium">Enter - Insert Sibling Node</li>
            <li className="font-medium">Tab - Insert Child Node</li>
            <li className="font-medium">F1 - Center the Map</li>
            <li className="font-medium">F2 - Edit Selected Node</li>
            <li className="font-medium">Del - Delete Selected Node</li>
            <li className="font-medium">
              ↑ - Select the Previous Sibling Node
            </li>
            <li className="font-medium">↓ - Select the Next Sibling Node</li>
            <li className="font-medium">
              ← / → - Select Parent or First Child
            </li>
            <li className="font-medium">PageUp / Alt + ↑ - Move Up Node</li>
            <li className="font-medium">PageDown / Alt + ↓ - Move Down Node</li>
            <li className="font-medium">Ctrl + S - Save Mind Map</li>
            <li className="font-medium">Ctrl + C - Copy Selected Node</li>
            <li className="font-medium">Ctrl + V - Paste the Copied Node</li>
            <li className="font-medium">Ctrl + “+”- Zoom In Mind Map</li>
            <li className="font-medium">Ctrl + “-” - Zoom Out Mind Map</li>
            <li className="font-medium">Ctrl + 0 - Reset Zoom Level</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShortcutGuide;
