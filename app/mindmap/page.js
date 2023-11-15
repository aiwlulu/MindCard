"use client";
import React, { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import MindMapList from "@/components/MindMapList";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { authContext } from "@/lib/store/auth-context";
import { MindmapContext } from "@/lib/store/mindmap-context";

export default function MindmapPage() {
  const router = useRouter();
  const { user } = useContext(authContext);
  const { loadMindmap } = useContext(MindmapContext);
  const [mindMaps, setMindMaps] = useState([]);
  const [selectedMindMap, setSelectedMindMap] = useState(null);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "mindmaps"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const maps = [];
        querySnapshot.forEach((doc) => {
          const createdAt = doc.data().createdAt;
          maps.push({
            id: doc.id,
            title: doc.data().data.nodeData.topic,
            description: createdAt
              ? new Date(createdAt.seconds * 1000).toLocaleString("en-US")
              : "Not available",
          });
        });
        setMindMaps(maps);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleMindMapCreate = async () => {
    if (user) {
      const docRef = await addDoc(collection(db, "mindmaps"), {
        data: { nodeData: { id: "root", root: true, topic: "New Mind Map" } },
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setSelectedMindMap(docRef.id);
      router.push(`/mindmap/${docRef.id}`);
    } else {
      alert("You must be logged in to create a new mind map.");
    }
  };

  const handleMindMapSelect = (id) => {
    loadMindmap(id);
    setSelectedMindMap(id);
  };

  const deleteMindMap = async (id) => {
    const docRef = doc(db, "mindmaps", id);
    await deleteDoc(docRef);
    setMindMaps(mindMaps.filter((map) => map.id !== id));
  };

  return (
    <>
      <MindMapList
        mindMaps={mindMaps}
        onMindMapCreate={handleMindMapCreate}
        onMindMapSelect={handleMindMapSelect}
        onDeleteMindMap={deleteMindMap}
      />
    </>
  );
}
