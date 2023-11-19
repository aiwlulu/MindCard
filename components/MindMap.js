import { useEffect, useRef, useContext } from "react";
import { MindmapContext } from "@/lib/store/mindmap-context";
import ShortcutGuide from "./ShortcutGuide";
import Card from "./Card";

const MindMap = ({ id }) => {
  const mapRef = useRef(null);
  const { loadMindmap } = useContext(MindmapContext);

  useEffect(() => {
    if (id) {
      if (mapRef.current) {
        mapRef.current.innerHTML = "";
      }
      loadMindmap(id, mapRef.current);
    }
  }, [id, loadMindmap]);

  return (
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
  );
};

export default MindMap;
