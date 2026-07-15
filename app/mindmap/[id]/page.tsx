"use client";
import React, { useEffect, useContext, use } from "react";
import dynamic from "next/dynamic";
import { MindmapContext } from "@/lib/store/mindmap-context";

const DynamicMindmap = dynamic(() => import("@/components/MindMap"), {
  ssr: false,
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const { id } = use(params);
  const { mindmapData } = useContext(MindmapContext);
  const root = mindmapData?.root ?? mindmapData?.nodeData;
  const mindmapTitle = root?.topic ?? null;

  useEffect(() => {
    document.title = mindmapTitle
      ? `${mindmapTitle} | MindCard`
      : "MindCard";
    return () => {
      document.title = "MindCard";
    };
  }, [mindmapTitle]);

  return <DynamicMindmap id={id} />;
}
