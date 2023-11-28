import React, { useState, useEffect, useContext } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { MindmapContext } from "@/lib/store/mindmap-context";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const Card = ({ currentMindmapId, onDragEnd, removeHyperlink }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mindmaps, setMindmaps] = useState([]);
  const { getAllMindmaps, selectedNode, setSelectedNode } =
    useContext(MindmapContext);

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
            <>
              <div className="mb-2">
                <button
                  className="mt-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 hover:scale-105"
                  onClick={handleRemoveHyperlinkClick}
                >
                  Remove Hyperlink
                </button>
              </div>

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
            </>
          )}
        </div>
      </div>
    </DragDropContext>
  );
};

export default Card;
