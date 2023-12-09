import React, { useContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { MindmapContext } from "@/lib/store/mindmap-context";

function AutoSaveToggle() {
  const { saveMindmap } = useContext(MindmapContext);
  const [autoSave, setAutoSave] = useState(false);
  const autoSaveIntervalRef = useRef(null);

  const startAutoSave = () => {
    if (!autoSaveIntervalRef.current) {
      autoSaveIntervalRef.current = setInterval(() => {
        saveMindmap()
          .then(() => {})
          .catch((error) => {
            toast.error("Failed to save mindmap:", error);
          });
      }, 5000);
    }
  };

  const stopAutoSave = () => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (autoSave) {
      startAutoSave();
    } else {
      stopAutoSave();
    }
    return () => {
      stopAutoSave();
    };
  }, [autoSave, saveMindmap]);

  return (
    <div className="flex items-center">
      <label
        className={`${
          autoSave ? "bg-lime-600" : "bg-gray-400"
        } relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer`}
      >
        <input
          type="checkbox"
          checked={autoSave}
          onChange={() => setAutoSave(!autoSave)}
          className="opacity-0 w-0 h-0"
        />
        <span
          className={`${
            autoSave ? "translate-x-6" : "translate-x-1"
          } inline-block w-4 h-4 transform bg-white rounded-full`}
        />
      </label>
      <span className="text-sm text-lime-500 ml-2 mr-2 truncate">
        Auto Save (5s)
      </span>
    </div>
  );
}

export default AutoSaveToggle;
