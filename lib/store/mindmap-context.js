"use client";
import { createContext, useState, useContext, useCallback } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { authContext } from "./auth-context";
import { toast } from "react-toastify";

export const MindmapContext = createContext({
  mindmapInstance: null,
  setMindmapInstance: () => {},
  saveMindmap: () => {},
  loadMindmap: () => {},
  currentMindmapId: null,
  setCurrentMindmapId: () => {},
  getAllMindmaps: async () => {},
});

export const MindmapProvider = ({ children }) => {
  const [mindmapInstance, setMindmapInstance] = useState(null);
  const [currentMindmapId, setCurrentMindmapId] = useState(null);
  const { user } = useContext(authContext);

  const saveMindmap = async () => {
    if (!user) {
      alert("You must be logged in to save the mind map.");
      return;
    }

    const mindmapData = mindmapInstance ? mindmapInstance.getData() : null;

    if (!mindmapData) {
      console.error("Failed to retrieve mind map data; data is undefined.");
      alert("Unable to save the mind map as no data was retrieved.");
      return;
    }

    try {
      if (currentMindmapId) {
        const docRef = doc(db, "mindmaps", currentMindmapId);
        await updateDoc(docRef, {
          data: mindmapData,
          updatedAt: serverTimestamp(),
        });
        toast("Saved successfully!", {
          autoClose: 1500,
        });
      } else {
        const docRef = await addDoc(collection(db, "mindmaps"), {
          data: mindmapData,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        setCurrentMindmapId(docRef.id);
        toast("Mind map created successfully");
      }
    } catch (e) {
      toast.error("Error saving mind map: ", e);
    }
  };

  const loadMindmap = useCallback(
    async (id, element) => {
      const docRef = doc(db, "mindmaps", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && element) {
        let MindElixir;
        if (typeof window !== "undefined") {
          MindElixir = (await import("mind-elixir")).default;
        }
        if (MindElixir) {
          const mindmapData = docSnap.data().data;
          const ME = new MindElixir({
            el: element,
            direction: MindElixir.RIGHT,
            contextMenu: true,
            nodeMenu: false,
            allowUndo: false,
            newTopicName: "New Topic",
          });
          ME.init(mindmapData);
          setMindmapInstance(ME);
          setCurrentMindmapId(id);
        }
      } else {
        console.log("No such document or element does not exist!");
      }
    },
    [setMindmapInstance, setCurrentMindmapId]
  );

  const getAllMindmaps = useCallback(
    async (excludeId) => {
      if (!user) return [];

      try {
        const q = query(
          collection(db, "mindmaps"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            title: doc.data().data.nodeData.topic,
            createdAt: doc.data().createdAt,
          }))
          .filter((map) => map.id !== excludeId);
      } catch (error) {
        console.error("Error fetching mind maps: ", error);
        return [];
      }
    },
    [user?.uid]
  );

  return (
    <MindmapContext.Provider
      value={{
        mindmapInstance,
        setMindmapInstance,
        saveMindmap,
        loadMindmap,
        currentMindmapId,
        setCurrentMindmapId,
        getAllMindmaps,
      }}
    >
      {children}
    </MindmapContext.Provider>
  );
};
