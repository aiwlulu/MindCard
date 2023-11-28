import React, { useState, useEffect, useContext } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { MindmapContext } from "@/lib/store/mindmap-context";

const Card = ({ currentMindmapId, onDragEnd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mindmaps, setMindmaps] = useState([]);
  const { getAllMindmaps } = useContext(MindmapContext);

  useEffect(() => {
    const fetchMindmaps = async () => {
      const allMindmaps = await getAllMindmaps(currentMindmapId);
      setMindmaps(allMindmaps);
    };

    fetchMindmaps();
  }, [currentMindmapId, getAllMindmaps]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="fixed right-0 top-24">
        <button
          className="text-white px-4 py-2 bg-gray-700 rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Close" : "Card"}
        </button>

        {isOpen && (
          <Droppable droppableId="mindmaps">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="w-80 mt-4 p-4 overflow-auto bg-gray-800 rounded-md shadow-lg"
                style={{ maxHeight: "calc(100vh - 5rem)" }}
              >
                {mindmaps.map((map, index) => (
                  <Draggable key={map.id} draggableId={map.id} index={index}>
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
        )}
      </div>
    </DragDropContext>
  );
};

export default Card;
