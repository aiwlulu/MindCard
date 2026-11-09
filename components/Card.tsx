import React, { useState, useEffect, useContext } from "react";
import { MindmapContext } from "@/lib/store/mindmap-context";
import SweetAlert from "./SweetAlert";
import { toast } from "react-toastify";
import { ClearIcon, InfoIcon, LayersIcon, MapIcon, UnlinkIcon } from "./Icons";
import type { FirestoreMindmapDoc } from "@/lib/types";

interface CardProps {
  currentMindmapId: string | null;
  removeHyperlink: () => void;
  linkCompletedVersion?: number;
}

const Card: React.FC<CardProps> = ({
  currentMindmapId,
  removeHyperlink,
  linkCompletedVersion = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mindmaps, setMindmaps] = useState<FirestoreMindmapDoc[]>([]);
  const { getAllMindmaps, selectedNode } = useContext(MindmapContext);
  const [showInstruction, setShowInstruction] = useState(false);
  const [handledLinkVersion, setHandledLinkVersion] = useState(linkCompletedVersion);

  // A completed link closes the picker; reset while rendering, not in an effect.
  if (linkCompletedVersion !== handledLinkVersion) {
    setHandledLinkVersion(linkCompletedVersion);
    setIsOpen(false);
    setShowInstruction(false);
  }

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
      title: "Remove this card link?",
      text: "The topic stays. Only the link to the other mind map is removed.",
      icon: "warning",
      confirmButtonText: "Remove link",
      onConfirm: () => {
        removeHyperlink();
        setIsOpen(false);
        setShowInstruction(false);
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
        <button
          type="button"
          className={`mindmap-floating-trigger${isOpen ? " is-active" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close Cards" : "Cards"}
          title="Link another mind map as a card"
        >
          {isOpen ? <ClearIcon size={15} /> : <LayersIcon size={16} />}
          <span>Cards</span>
        </button>

        {isOpen && (
          <div className="mindmap-card-popover floating-panel">
            <header className="floating-panel-header">
              <strong>Link a card</strong>
              <span>
                {selectedNode
                  ? `Drag a map onto the canvas to link it to "${selectedNode.topic}"`
                  : "Select a topic first, then drag a map onto the canvas"}
              </span>
            </header>
            <div className="mindmap-card-actions">
              <button
                type="button"
                className="mindmap-card-remove"
                onClick={handleRemoveHyperlinkClick}
              >
                <UnlinkIcon size={14} />
                Remove link
              </button>
              <button
                type="button"
                className="mindmap-card-info icon-button"
                aria-label="Card instructions"
                aria-pressed={showInstruction}
                onClick={() => setShowInstruction((prev) => !prev)}
              >
                <InfoIcon size={16} />
              </button>
            </div>

            {showInstruction && (
              <div className="mindmap-card-instructions">
                <p>Select a node, then drag a card onto the canvas to create a link.</p>
                <p>Use the card link below the node to open the linked mind map.</p>
                <button
                  type="button"
                  onClick={() => setShowInstruction(false)}
                  className="mindmap-card-got-it"
                >
                  Got it
                </button>
              </div>
            )}

            <div className="mindmap-card-list">
              {mindmaps.length === 0 ? (
                <div className="mindmap-card-empty">
                  <p>No other mind maps are available to link.</p>
                </div>
              ) : (
                mindmaps.map((map) => (
                  <div
                    key={map.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, map)}
                    className="mindmap-card-item"
                  >
                    <MapIcon size={15} />
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
