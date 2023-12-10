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
  updateNodeHyperlink: () => {},
  exportMindMap: () => {},
});

export const MindmapProvider = ({ children }) => {
  const [mindmapInstance, setMindmapInstance] = useState(null);
  const [currentMindmapId, setCurrentMindmapId] = useState(null);
  const { user } = useContext(authContext);
  const [selectedNode, setSelectedNode] = useState(null);

  const saveMindmap = async () => {
    if (!user) {
      toast.error("You must be logged in to save the mind map.");
      return;
    }

    const mindmapData = mindmapInstance ? mindmapInstance.getData() : null;

    if (!mindmapData) {
      toast.error("Unable to save the mind map as no data was retrieved.");
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
          autoClose: 1000,
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
      toast.error("Error saving mind map.");
    }
  };

  const loadMindmap = useCallback(
    async (id, element) => {
      const docRef = doc(db, "mindmaps", id);
      const docSnap = await getDoc(docRef);
      const options = {
        theme: {
          name: "Dark",
          palette: [
            "#848FA0",
            "#748BE9",
            "#D2F9FE",
            "#4145A5",
            "#789AFA",
            "#706CF4",
            "#EF987F",
            "#775DD5",
            "#FCEECF",
            "#DA7FBC",
          ],
          cssVar: {
            "--main-color": "#ffffff",
            "--main-bgcolor": "#4c4f69",
            "--color": "#cccccc",
            "--bgcolor": "#252526",
            "--panel-color": "#ffffff",
            "--panel-bgcolor": "#2d3748",
            "--panel-border-color": "#696969",
          },
        },
      };
      setSelectedNode(null);
      if (docSnap.exists() && element) {
        let MindElixir;
        if (typeof window !== "undefined") {
          MindElixir = (await import("mind-elixir")).default;
        }
        if (MindElixir) {
          const mindmapData = docSnap.data().data;
          const ME = new MindElixir({
            el: element,
            theme: options.theme,
            direction: MindElixir.RIGHT,
            contextMenu: true,
            nodeMenu: false,
            allowUndo: true,
            newTopicName: "New Topic",
          });
          ME.init(mindmapData);

          ME.bus.addListener("selectNode", (node) => {
            setSelectedNode(node);
          });

          setMindmapInstance(ME);
          setCurrentMindmapId(id);
        }
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
        toast.error("Error fetching mind maps: ", error);
        return [];
      }
    },
    [user?.uid]
  );

  const updateNodeHyperlink = async (nodeId, hyperlinkData) => {
    if (!mindmapInstance || !selectedNode || nodeId !== selectedNode.id) {
      toast.error(
        "Mindmap instance is undefined or no matching node has been selected"
      );
      return;
    }

    const updatedNodeData = {
      ...mindmapInstance.nodeData,
    };

    const updateNode = (node) => {
      if (node.id === nodeId) {
        node.hyperLink =
          hyperlinkData && hyperlinkData.id ? hyperlinkData.id : "";
        return true;
      }
      if (node.children) {
        return node.children.some(updateNode);
      }
      return false;
    };

    if (updateNode(updatedNodeData)) {
      mindmapInstance.nodeData = updatedNodeData;
      mindmapInstance.refresh();
      if (hyperlinkData && hyperlinkData.id) {
        toast(
          `Hyperlink for node '${selectedNode.topic}' updated successfully`,
          {
            autoClose: 1500,
          }
        );
      } else {
        toast(
          `Hyperlink for node '${selectedNode.topic}' removed successfully`,
          {
            autoClose: 1500,
          }
        );
      }
    } else {
      toast.error("Unable to find the specified node", {
        autoClose: 1500,
      });
    }
  };

  const exportMindMap = async () => {
    if (!mindmapInstance) {
      toast.error("Mindmap instance is not available.");
      return;
    }

    try {
      const data = mindmapInstance.getData();
      const rootNode = data.root || data.nodeData;
      const title = rootNode.topic || "MindMap";
      const blob = await mindmapInstance.exportSvg();
      if (!blob) return;

      const reader = new FileReader();
      reader.onloadend = function () {
        let svgContent = reader.result.replace(/&nbsp;/g, " ");

        const blob = new Blob([svgContent], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeTitle = title
          .replace(/[<>:"\/\\|?*\x00-\x1F]/g, "_")
          .replace(/\s+/g, "-");
        a.href = url;
        a.download = `MindCard-${safeTitle}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      };
      reader.readAsText(blob);
    } catch (error) {
      toast.error("An error occurred during the export process.");
    }
  };

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
        selectedNode,
        setSelectedNode,
        updateNodeHyperlink,
        exportMindMap,
      }}
    >
      {children}
    </MindmapContext.Provider>
  );
};
