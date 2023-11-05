"use client";
import dynamic from "next/dynamic";

const DynamicMindmap = dynamic(() => import("@/components/Mindmap"), {
  ssr: false,
});

export default function Mindmap() {
  return <DynamicMindmap />;
}
