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
            <li className="font-normal">Enter - Insert Sibling Node</li>
            <li className="font-normal">Tab - Insert Child Node</li>
            <li className="font-normal">Del - Delete Selected Node</li>
            <li className="font-normal">PageUp / Alt + ↑ - Move Up Node</li>
            <li className="font-normal">PageDown / Alt + ↓ - Move Down Node</li>
            <li className="font-normal">Ctrl + Z - Undo</li>
            <li className="font-normal">Ctrl + S - Save Mind Map</li>
            <li className="font-normal">Ctrl + C - Copy Selected Node</li>
            <li className="font-normal">Ctrl + V - Paste the Copied Node</li>
            <p className="font-normal text-red-300">
              Please avoid copying and pasting the root node (it can't be
              deleted).
            </p>
            <li className="font-normal">Ctrl + “+” - Zoom In Mind Map</li>
            <li className="font-normal">Ctrl + “-” - Zoom Out Mind Map</li>
            <li className="font-normal">Ctrl + 0 - Reset Zoom Level</li>
            <li className="font-normal">F1 - Center the Map</li>
            <li className="font-normal">F2 - Edit Selected Node</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShortcutGuide;
