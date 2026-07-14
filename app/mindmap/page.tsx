"use client";
import React, { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import MindMapList from "@/components/MindMapList";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore/lite";
import { toast } from "react-toastify";
import { db } from "@/lib/firebase";
import { authContext } from "@/lib/store/auth-context";
import { MindmapContext } from "@/lib/store/mindmap-context";
import { normalizeMindmapData } from "@/lib/mindmap/tree";
import { toPublicMindmapData } from "@/lib/mindmap/public";
import type { MindmapListItem } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const formatDate = (date: Date): string => dateFormatter.format(date).replace(/,([^,]*)$/, " ·$1");

export default function MindmapPage() {
  const router = useRouter();
  const { user } = useContext(authContext);
  const { getAllMindmaps } = useContext(MindmapContext);
  const [mindMaps, setMindMaps] = useState<MindmapListItem[]>([]);

  useEffect(() => {
    if (user) {
      getAllMindmaps().then((maps) => {
        const formattedMaps: MindmapListItem[] = maps.map((map) => ({
          ...map,
          description: (map.updatedAt ?? map.createdAt)
            ? `Updated ${formatDate(new Date((map.updatedAt ?? map.createdAt)!.seconds * 1000))}`
            : "Not available",
        }));
        setMindMaps(formattedMaps);
      });
    }
  }, [user, getAllMindmaps]);

  const handleMindMapCreate = async () => {
    if (user) {
      const docRef = await addDoc(collection(db, "mindmaps"), {
        data: { nodeData: { id: "root", root: true, topic: "New Mind Map" } },
        userId: user.uid,
        isPublic: false,
        createdAt: serverTimestamp(),
      });
      router.push(`/mindmap/${docRef.id}`);
    } else {
      alert("You must be logged in to create a new mind map.");
    }
  };

  const deleteMindMap = async (id: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "publicMindmaps", id));
    batch.delete(doc(db, "mindmaps", id));
    await batch.commit();
    setMindMaps((prev) => prev.filter((map) => map.id !== id));
  };

  const publicUrl = (id: string) => `${window.location.origin}/share/${id}`;

  const copyPublicLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(publicUrl(id));
      toast("Public link copied.", { autoClose: 1200 });
    } catch {
      toast.error("Unable to copy the public link.");
    }
  };

  const togglePublicSharing = async (id: string, isPublic: boolean) => {
    try {
      const sourceRef = doc(db, "mindmaps", id);
      const publicRef = doc(db, "publicMindmaps", id);
      const updatedAt = serverTimestamp();
      const batch = writeBatch(db);

      if (isPublic) {
        const source = await getDoc(sourceRef);
        if (!source.exists()) throw new Error("Mind map not found");
        const stored = source.data() as { data?: unknown };
        const normalized = normalizeMindmapData(stored.data);
        batch.update(sourceRef, { isPublic: true, updatedAt });
        batch.set(publicRef, {
          data: toPublicMindmapData(normalized),
          isPublic: true,
          updatedAt,
        });
      } else {
        batch.update(sourceRef, { isPublic: false, updatedAt });
        batch.delete(publicRef);
      }

      await batch.commit();
      setMindMaps((current) =>
        current.map((map) => (map.id === id ? { ...map, isPublic } : map))
      );
      if (isPublic) {
        await copyPublicLink(id);
      } else {
        toast("Public access disabled.", { autoClose: 1200 });
      }
    } catch {
      toast.error("Unable to update public sharing.");
    }
  };

  return (
    <MindMapList
      mindMaps={mindMaps}
      onMindMapCreate={() => void handleMindMapCreate()}
      onDeleteMindMap={(id) => void deleteMindMap(id)}
      onTogglePublic={(id, isPublic) => void togglePublicSharing(id, isPublic)}
      onCopyPublicLink={(id) => void copyPublicLink(id)}
    />
  );
}
