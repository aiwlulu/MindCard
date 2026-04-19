"use client";
import React, { useEffect, useState, useContext, useCallback } from "react";
import dynamic from "next/dynamic";
import { MindmapContext } from "@/lib/store/mindmap-context";
import silenceConsole from "@/lib/utils/silenceConsole";

const options = {
  blackList: [
    "ME_version",
    "layout",
    "linkDiv",
    "selectNode",
    "selectNodes",
    "addChild",
    "editTopic",
    "New Topic",
    "insertSibling_DOM",
    "FindEle: Node",
    "DrawCustomLink",
  ],
};

silenceConsole(options);

const DynamicMindmap = dynamic(() => import("@/components/MindMap"), {
  ssr: false,
});

interface PageProps {
  params: { id: string };
}

export default function Page({ params }: PageProps) {
  const { loadMindmap, currentMindmapTitle } = useContext(MindmapContext);
  const [selectedMindMap, setSelectedMindMap] = useState<string | null>(null);

  const handleMindMapSelect = useCallback(
    (id: string) => {
      void loadMindmap(id);
      setSelectedMindMap(id);
    },
    [loadMindmap]
  );

  useEffect(() => {
    if (params.id) {
      handleMindMapSelect(params.id);
    }
  }, [params.id, handleMindMapSelect]);

  useEffect(() => {
    document.title = currentMindmapTitle
      ? `${currentMindmapTitle} | MindCard`
      : "MindCard";
    return () => {
      document.title = "MindCard";
    };
  }, [currentMindmapTitle]);

  return <DynamicMindmap id={selectedMindMap} />;
}
