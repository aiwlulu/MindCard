import React, { useState, useEffect, useRef, useContext } from "react";
import dynamic from "next/dynamic";
import { MindmapContext } from "@/lib/store/mindmap-context";
import { toast } from "react-toastify";

const ShortcutGuide = dynamic(() => import("./ShortcutGuide"), { ssr: false });
const Card = dynamic(() => import("./Card"), { ssr: false });

interface GuideBannerProps {
  onClose: () => void;
}

const GuideBanner: React.FC<GuideBannerProps> = ({ onClose }) => (
  <div className="absolute top-0 left-0 w-full bg-blue-900 bg-opacity-30 text-blue-100 py-2 px-4 justify-between items-center text-sm md:text-base z-50 flex">
    <span className="lg:flex hidden">
      Right-click on a node to interact with it. Double-click on a node to edit
      its content. Or use the &quot;Show Shortcuts&quot; button for more tips.
    </span>
    <span className="lg:hidden">
      Double-click on a node to edit its content.
    </span>
    <button onClick={onClose} className="text-blue-100 text-2xl">
      ×
    </button>
  </div>
);

interface MindMapProps {
  id: string | null;
}

const MindMap: React.FC<MindMapProps> = ({ id }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [showBanner, setShowBanner] = useState(
    typeof window !== "undefined" &&
      localStorage.getItem("hideGuideBanner") !== "true"
  );
  const { loadMindmap, selectedNode, setSelectedNode, updateNodeHyperlink } =
    useContext(MindmapContext);

  useEffect(() => {
    if (id) {
      if (mapRef.current) {
        mapRef.current.innerHTML = "";
      }
      void loadMindmap(id, mapRef.current);
    }
  }, [id, loadMindmap]);

  const handleCloseBanner = () => {
    setShowBanner(false);
    localStorage.setItem("hideGuideBanner", "true");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("card/json")) return;

    const jsonData = e.dataTransfer.getData("card/json");
    let cardData: { id?: string };
    try {
      cardData = JSON.parse(jsonData) as { id?: string };
    } catch {
      toast.error("Invalid card data.", { autoClose: 1500 });
      return;
    }

    if (selectedNode && cardData.id) {
      void updateNodeHyperlink(selectedNode.id, { id: cardData.id });
      setSelectedNode(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("card/json")) {
      e.preventDefault();
    }
  };

  const removeHyperlink = () => {
    if (selectedNode?.id) {
      void updateNodeHyperlink(selectedNode.id, "");
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
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        </div>
        <div className="hidden lg:block">
          <ShortcutGuide />
        </div>
        <div className="hidden lg:block">
          <Card currentMindmapId={id} removeHyperlink={removeHyperlink} />
        </div>
      </div>
    </div>
  );
};

export default MindMap;
