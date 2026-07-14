"use client";

import React, { use, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore/lite";
import PublicMindMapViewer from "@/components/PublicMindMapViewer";
import { db } from "@/lib/firebase";
import { normalizeMindmapData } from "@/lib/mindmap/tree";
import type { MindmapData } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

type PublicMapState =
  | { status: "loading" }
  | { status: "ready"; data: MindmapData }
  | { status: "unavailable" };

export default function PublicMindMapPage({ params }: PageProps) {
  const { id } = use(params);
  const [state, setState] = useState<PublicMapState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    getDoc(doc(db, "publicMindmaps", id))
      .then((snapshot) => {
        if (!active || !snapshot.exists()) return setState({ status: "unavailable" });
        const stored = snapshot.data() as { data?: unknown; isPublic?: boolean };
        if (stored.isPublic !== true) {
          setState({ status: "unavailable" });
          return;
        }
        const data = normalizeMindmapData(stored.data);
        document.title = `${data.nodeData.topic} | MindCard public view`;
        setState({ status: "ready", data });
      })
      .catch(() => {
        if (active) setState({ status: "unavailable" });
      });

    return () => {
      active = false;
      document.title = "MindCard";
    };
  }, [id]);

  if (state.status === "loading") {
    return (
      <main className="public-share-state" role="status">
        <span aria-hidden="true" />
        Loading public mind map…
      </main>
    );
  }

  if (state.status === "unavailable") {
    return (
      <main className="public-share-state">
        <p>Private or unavailable</p>
        <h1>This shared mind map is no longer public.</h1>
        <a href="/">Go to MindCard</a>
      </main>
    );
  }

  return <PublicMindMapViewer root={state.data.root ?? state.data.nodeData} />;
}
