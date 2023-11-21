import { useState, useEffect, useRef, useContext } from "react";
import { MindmapContext } from "@/lib/store/mindmap-context";
import ShortcutGuide from "./ShortcutGuide";
import Card from "./Card";

const GuideBanner = ({ onClose }) => {
  return (
    <div className="absolute top-0 left-0 w-full bg-blue-900 bg-opacity-30 text-blue-100 py-2 px-4 flex justify-between items-center text-sm md:text-base z-50">
      <span>
        Right-click on a node to interact with it, or use the "Show Shortcuts"
        button for more tips.
      </span>
      <button onClick={onClose} className="text-blue-100 text-2xl leading-none">
        ×
      </button>
    </div>
  );
};

const MindMap = ({ id }) => {
  const mapRef = useRef(null);
  const { loadMindmap } = useContext(MindmapContext);
  const [showBanner, setShowBanner] = useState(
    localStorage.getItem("hideGuideBanner") !== "true"
  );

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
        <Card currentMindmapId={id} />
      </div>
    </div>
  );
};

export default MindMap;
