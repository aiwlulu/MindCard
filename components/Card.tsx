import React, { useState, useEffect, useContext } from "react";
import { MindmapContext } from "@/lib/store/mindmap-context";
import SweetAlert from "./SweetAlert";
import { toast } from "react-toastify";
import { InfoIcon } from "./Icons";
import type { FirestoreMindmapDoc } from "@/lib/types";

interface CardProps {
  currentMindmapId: string | null;
  removeHyperlink: () => void;
}

const Card: React.FC<CardProps> = ({ currentMindmapId, removeHyperlink }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mindmaps, setMindmaps] = useState<FirestoreMindmapDoc[]>([]);
  const { getAllMindmaps, selectedNode, setSelectedNode } =
    useContext(MindmapContext);
  const [showInstruction, setShowInstruction] = useState(false);

  useEffect(() => {
    const fetchMindmaps = async () => {
      const allMindmaps = await getAllMindmaps(currentMindmapId ?? undefined);
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

    void SweetAlert({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      onConfirm: () => {
        removeHyperlink();
        setSelectedNode(null);
      },
    });
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    map: FirestoreMindmapDoc
  ) => {
    if (!selectedNode) {
      toast.error(
        "Please select a node before creating or updating a hyperlink.",
        { autoClose: 1500 }
      );
      return;
    }
    e.dataTransfer.setData("card/json", JSON.stringify({ id: map.id }));
  };

  return (
    <div className="mindmap-card-panel">
      <div className="mindmap-card-panel-inner">
        <div>
          <button
            className="mindmap-floating-trigger"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
          >
            {isOpen ? "關閉 Cards" : "Cards"}
          </button>
        </div>

        {isOpen && (
          <div className="mindmap-card-popover">
            <div className="mindmap-card-actions">
              <button
                className="mindmap-card-remove"
                onClick={handleRemoveHyperlinkClick}
              >
                移除連結
              </button>
              <button
                type="button"
                className="mindmap-card-info"
                aria-label="Card instructions"
                onClick={() => setShowInstruction((prev) => !prev)}
              >
                <InfoIcon size={18} />
              </button>
            </div>

            {showInstruction && (
              <div className="mindmap-card-instructions">
                <div>
                  <p>先選取節點，再將下方 Card 拖曳到畫布即可建立連結。</p>
                  <p>建立後可直接點節點下方的 Card link 開啟另一張心智圖。</p>
                  <button
                    onClick={() => setShowInstruction(false)}
                    className="mindmap-card-got-it"
                  >
                    知道了
                  </button>
                </div>
              </div>
            )}

            <div className="mindmap-card-list">
              {mindmaps.length === 0 ? (
                <div className="mindmap-card-empty">
                  <p>目前沒有其他可連結的心智圖。</p>
                </div>
              ) : (
                mindmaps.map((map) => (
                  <div
                    key={map.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, map)}
                    className="mindmap-card-item"
                  >
                    <h3>{map.title}</h3>
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
