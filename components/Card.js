import React, { useState, useEffect, useContext } from "react";
import { BsFillInfoCircleFill } from "react-icons/bs";
import { MindmapContext } from "@/lib/store/mindmap-context";
import SweetAlert from "./SweetAlert";
import { toast } from "react-toastify";

const Card = ({ currentMindmapId, removeHyperlink }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mindmaps, setMindmaps] = useState([]);
  const { getAllMindmaps, selectedNode, setSelectedNode } =
    useContext(MindmapContext);
  const [showInstruction, setShowInstruction] = useState(false);

  useEffect(() => {
    const fetchMindmaps = async () => {
      const allMindmaps = await getAllMindmaps(currentMindmapId);
      setMindmaps(allMindmaps);
    };

    fetchMindmaps();
  }, [currentMindmapId, getAllMindmaps]);

  const handleRemoveHyperlinkClick = () => {
    if (!selectedNode) {
      toast.error("Please select a node before deleting a hyperlink.", {
        autoClose: 1500,
      });
      return;
    }

    SweetAlert({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      onConfirm: () => {
        removeHyperlink();
        setSelectedNode(null);
      },
    });
  };

  const handleDragStart = (e, map) => {
    if (!selectedNode) {
      toast.error(
        "Please select a node before creating or updating a hyperlink.",
        {
          autoClose: 1500,
        }
      );
      return;
    }
    const cardData = JSON.stringify({ id: map.id, title: map.title });
    e.dataTransfer.setData("card/json", cardData);
  };

  return (
    <div className="fixed right-0 top-24">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className="mb-2">
          <button
            className="text-white px-4 py-2 bg-gray-700 rounded-md"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Close" : "Card"}
          </button>
        </div>

        {isOpen && (
          <div className="flex flex-col items-start">
            <div className="mb-2 flex items-center">
              <button
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 hover:scale-105"
                onClick={handleRemoveHyperlinkClick}
              >
                Remove Hyperlink
              </button>
              <BsFillInfoCircleFill
                onClick={() => setShowInstruction(!showInstruction)}
                className="text-white ml-4 cursor-pointer"
                size={24}
              />
            </div>

            {showInstruction && (
              <div className="p-4 mb-2 text-white bg-blue-500 bg-opacity-60 rounded">
                <div className="space-y-2">
                  <p>
                    The card feature allows you to associate nodes from other
                    mind maps with the current document.
                  </p>
                  <p>
                    Create or Update Hyperlink: Select a node then drag & drop a
                    card.
                  </p>
                  <p>
                    Remove Hyperlink: Select the node and click "Remove
                    Hyperlink" button.
                  </p>
                  <button
                    onClick={() => setShowInstruction(false)}
                    className="mt-2 py-1 px-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg hover:scale-105"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}

            <div
              className="w-80 p-4 overflow-auto bg-gray-800 rounded-md shadow-lg"
              style={{ maxHeight: "calc(100vh - 12rem)" }}
            >
              {mindmaps.length === 0 ? (
                <div className="text-white text-center p-4">
                  <p>
                    This area will display your mind maps but does not include
                    the current file.
                  </p>
                </div>
              ) : (
                mindmaps.map((map) => (
                  <div
                    key={map.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, map)}
                    className="mb-2 p-3 bg-gray-700 rounded shadow cursor-pointer"
                  >
                    <h3 className="text-white text-lg truncate">{map.title}</h3>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
