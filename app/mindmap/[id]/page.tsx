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
  const { currentMindmapTitle } = useContext(MindmapContext);

  useEffect(() => {
    document.title = currentMindmapTitle
      ? `${currentMindmapTitle} | MindCard`
      : "MindCard";
    return () => {
      document.title = "MindCard";
    };
  }, [currentMindmapTitle]);

  return <DynamicMindmap id={id} />;
}
