"use client";
import React, { useEffect, useState, useContext } from "react";
import dynamic from "next/dynamic";
import { MindmapContext } from "@/lib/store/mindmap-context";

const DynamicMindmap = dynamic(() => import("@/components/MindMap"), {
  ssr: false,
});

export default function Page({ params }) {
  const { loadMindmap } = useContext(MindmapContext);
  const [selectedMindMap, setSelectedMindMap] = useState(null);

  const handleMindMapSelect = (id) => {
    loadMindmap(id);
    setSelectedMindMap(id);
  };

  useEffect(() => {
    if (params.id) {
      handleMindMapSelect(params.id);
    }
  }, [params.id]);

  return (
    <>
      <DynamicMindmap id={selectedMindMap} />
    </>
  );
}
