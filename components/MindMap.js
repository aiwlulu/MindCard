import { useState, useEffect, useRef, useContext } from "react";
import { MindmapContext } from "@/lib/store/mindmap-context";
import ShortcutGuide from "./ShortcutGuide";
import Card from "./Card";
import { toast } from "react-toastify";

const GuideBanner = ({ onClose }) => {
  return (
    <div className="absolute top-0 left-0 w-full bg-blue-900 bg-opacity-30 text-blue-100 py-2 px-4 flex justify-between items-center text-sm md:text-base z-50">
      <span>
        Right-click on a node to interact with it. Double-click on a node to
        edit its content. Or use the "Show Shortcuts" button for more tips.
      </span>
      <button onClick={onClose} className="text-blue-100 text-2xl leading-none">
        ×
      </button>
    </div>
  );
};

const MindMap = ({ id }) => {
  const mapRef = useRef(null);
  const [showBanner, setShowBanner] = useState(
    localStorage.getItem("hideGuideBanner") !== "true"
  );
  const { loadMindmap, selectedNode, setSelectedNode, updateNodeHyperlink } =
    useContext(MindmapContext);

  useEffect(() => {
    if (id) {
      if (mapRef.current) {
        mapRef.current.innerHTML = "";
      }
      loadMindmap(id, mapRef.current);
    }
  }, [id, loadMindmap]);

  const handleCloseBanner = () => {
    setShowBanner(false);
    localStorage.setItem("hideGuideBanner", "true");
  };

  const onDragEnd = (result) => {
    const draggedCardId = result.draggableId;
    const hyperlink = `${window.location.origin}/mindmap/${draggedCardId}`;

    if (selectedNode) {
      updateNodeHyperlink(hyperlink);
      setSelectedNode(null);
    } else {
      toast.error("Please select a node before dragging a card.", {
        autoClose: 1500,
      });
    }
  };

  const removeHyperlink = () => {
    if (selectedNode && selectedNode.id) {
      updateNodeHyperlink("");
    } else {
      toast.error("Please select a node first", { autoClose: 1500 });
    }
  };

  return (
    <div className="relative bg-gray-900 text-gray-200">
      {showBanner && <GuideBanner onClose={handleCloseBanner} />}
      <div className="showcase">
        <div className="block">
          <div
            ref={mapRef}
            id="map"
            style={{ height: "90vh", width: "100%" }}
          ></div>
        </div>
        <ShortcutGuide />
        <Card
          currentMindmapId={id}
          onDragEnd={onDragEnd}
          removeHyperlink={removeHyperlink}
        />
      </div>
    </div>
  );
};

export default MindMap;
