"use client";

import React, { useMemo } from "react";
import { buildMindmapSvg } from "@/lib/mindmap/export";
import { convertToMarkdown } from "@/lib/mindmap/markdown";
import { useTheme } from "@/lib/store/theme-context";
import type { NodeData } from "@/lib/types";

const DEMO_TREE: NodeData = {
  id: "demo-root",
  root: true,
  topic: "Product launch",
  children: [
    {
      id: "demo-research",
      topic: "Research",
      children: [
        { id: "demo-interviews", topic: "Interview 12 users" },
        { id: "demo-competitors", topic: "Competitor teardown" },
      ],
    },
    {
      id: "demo-build",
      topic: "Build",
      children: [
        { id: "demo-mvp", topic: "Scope the MVP" },
        { id: "demo-beta", topic: "Private beta" },
      ],
    },
    {
      id: "demo-launch",
      topic: "Launch",
      children: [
        { id: "demo-story", topic: "Tell the story" },
        { id: "demo-measure", topic: "Measure retention", bold: true },
      ],
    },
  ],
};

// Renders the real map engine so the landing page always matches the product.
export default function LandingPreview() {
  const { theme } = useTheme();
  const svg = useMemo(() => buildMindmapSvg(DEMO_TREE, { theme }), [theme]);
  const markdown = useMemo(() => convertToMarkdown(DEMO_TREE), []);

  return (
    <div
      className="landing-preview"
      role="img"
      aria-label="MindCard turns Markdown into a live mind map"
    >
      <div className="landing-preview-chrome" aria-hidden="true">
        <span />
        <span />
        <span />
        <em>Product launch</em>
      </div>
      <div className="landing-preview-body" aria-hidden="true">
        <pre className="landing-preview-markdown">{markdown}</pre>
        <div
          className="landing-preview-map"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
