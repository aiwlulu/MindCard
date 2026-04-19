"use client";
import React, { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import MindMapList from "@/components/MindMapList";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { authContext } from "@/lib/store/auth-context";
import { MindmapContext } from "@/lib/store/mindmap-context";
import type { MindmapListItem } from "@/lib/types";

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHour = hours % 12 || 12;
  return `${year}/${month}/${day}, ${formattedHour}:${minutes}:${seconds} ${ampm}`;
};

export default function MindmapPage() {
  const router = useRouter();
  const { user } = useContext(authContext);
  const { loadMindmap, getAllMindmaps } = useContext(MindmapContext);
  const [mindMaps, setMindMaps] = useState<MindmapListItem[]>([]);

  useEffect(() => {
    if (user) {
      getAllMindmaps().then((maps) => {
        const formattedMaps: MindmapListItem[] = maps.map((map) => ({
          ...map,
          description: map.createdAt
            ? formatDate(new Date(map.createdAt.seconds * 1000))
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
        createdAt: serverTimestamp(),
      });
      router.push(`/mindmap/${docRef.id}`);
    } else {
      alert("You must be logged in to create a new mind map.");
    }
  };

  const handleMindMapSelect = (id: string) => {
    void loadMindmap(id);
  };

  const deleteMindMap = async (id: string) => {
    const docRef = doc(db, "mindmaps", id);
    await deleteDoc(docRef);
    setMindMaps((prev) => prev.filter((map) => map.id !== id));
  };

  return (
    <MindMapList
      mindMaps={mindMaps}
      onMindMapCreate={() => void handleMindMapCreate()}
      onDeleteMindMap={(id) => void deleteMindMap(id)}
    />
  );
}
