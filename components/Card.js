import React, { useState, useEffect, useContext } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { BsFillInfoCircleFill } from "react-icons/bs";
import { MindmapContext } from "@/lib/store/mindmap-context";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const Card = ({ currentMindmapId, onDragEnd, removeHyperlink }) => {
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
      toast.error("Please select a node before delete hyperlink.", {
        autoClose: 1500,
      });
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        removeHyperlink();
        setSelectedNode(null);
      }
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
                <div className="p-4 mb-2 text-white bg-blue-500 bg-opacity-80 rounded">
                  <div className="space-y-2">
                    <p>
                      The card feature allows you to associate nodes from other
                      mind maps with the current document.
                    </p>
                    <p>
                      Create or Update Hyperlink: Select a node then drag & drop
                      a card.
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

              <Droppable droppableId="mindmaps">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="w-80 p-4 overflow-auto bg-gray-800 rounded-md shadow-lg"
                    style={{ maxHeight: "calc(100vh - 5rem)" }}
                  >
                    {mindmaps.map((map, index) => (
                      <Draggable
                        key={map.id}
                        draggableId={map.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-2 p-3 bg-gray-700 rounded shadow cursor-pointer"
                          >
                            <h3 className="text-white text-lg">{map.title}</h3>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}
        </div>
      </div>
    </DragDropContext>
  );
};

export default Card;
