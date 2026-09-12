"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
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

interface ResolvedPublicMap {
  id: string;
  state: PublicMapState;
}

export default function PublicMindMapPage({ params }: PageProps) {
  const { id } = use(params);
  const [resolved, setResolved] = useState<ResolvedPublicMap | null>(null);
  // A stale result from the previous id reads as loading until the new fetch lands.
  const state: PublicMapState =
    resolved?.id === id ? resolved.state : { status: "loading" };

  useEffect(() => {
    let active = true;

    getDoc(doc(db, "publicMindmaps", id))
      .then((snapshot) => {
        if (!active) return;
        if (!snapshot.exists()) {
          return setResolved({ id, state: { status: "unavailable" } });
        }
        const stored = snapshot.data() as { data?: unknown; isPublic?: boolean };
        if (stored.isPublic !== true) {
          setResolved({ id, state: { status: "unavailable" } });
          return;
        }
        const data = normalizeMindmapData(stored.data);
        document.title = `${data.nodeData.topic} | MindCard public view`;
        setResolved({ id, state: { status: "ready", data } });
      })
      .catch(() => {
        if (active) setResolved({ id, state: { status: "unavailable" } });
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
        <Link href="/">Go to MindCard</Link>
      </main>
    );
  }

  return <PublicMindMapViewer root={state.data.root ?? state.data.nodeData} />;
}
