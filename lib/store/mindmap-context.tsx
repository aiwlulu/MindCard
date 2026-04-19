"use client";
import React, { createContext, useState, useContext, useCallback } from "react";
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
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { authContext } from "./auth-context";
import { toast } from "react-toastify";
import type {
  MindmapContextValue,
  MindElixirInstance,
  NodeData,
  FirestoreMindmapDoc,
  HyperlinkData,
  MindmapData,
} from "@/lib/types";

export const MindmapContext = createContext<MindmapContextValue>({
  mindmapInstance: null,
  setMindmapInstance: () => {},
  saveMindmap: async () => {},
  loadMindmap: async () => {},
  currentMindmapId: null,
  setCurrentMindmapId: () => {},
  currentMindmapTitle: null,
  getAllMindmaps: async () => [],
  selectedNode: null,
  setSelectedNode: () => {},
  updateNodeHyperlink: async () => {},
  exportMindMap: async () => {},
});

export const MindmapProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mindmapInstance, setMindmapInstance] =
    useState<MindElixirInstance | null>(null);
  const [currentMindmapId, setCurrentMindmapId] = useState<string | null>(null);
  const [currentMindmapTitle, setCurrentMindmapTitle] = useState<
    string | null
  >(null);
  const { user } = useContext(authContext);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

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
        toast("Saved successfully!", { autoClose: 1000 });
      } else {
        const docRef = await addDoc(collection(db, "mindmaps"), {
          data: mindmapData,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        setCurrentMindmapId(docRef.id);
        toast("Mind map created successfully");
      }
    } catch {
      toast.error("Error saving mind map.");
    }
  };

  const loadMindmap = useCallback(
    async (id: string, element?: HTMLElement | null) => {
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

      if (docSnap.exists()) {
        const data = docSnap.data() as {
          data?: { nodeData?: { topic?: string } };
        };
        setCurrentMindmapTitle(data.data?.nodeData?.topic ?? null);
      }

      if (docSnap.exists() && element && typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const MindElixirCtor = (await import("mind-elixir")).default as any;

        const mindmapData = (
          docSnap.data() as { data: MindmapData }
        ).data;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const ME = new MindElixirCtor({
          el: element,
          theme: options.theme,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          direction: MindElixirCtor.RIGHT,
          contextMenu: true,
          nodeMenu: false,
          allowUndo: true,
          newTopicName: "New Topic",
        }) as MindElixirInstance;

        ME.init(mindmapData);

        ME.bus.addListener("selectNode", (node: NodeData) => {
          setSelectedNode(node);
        });

        setMindmapInstance(ME);
        setCurrentMindmapId(id);
      }
    },
    [setMindmapInstance, setCurrentMindmapId]
  );

  const getAllMindmaps = useCallback(
    async (excludeId?: string): Promise<FirestoreMindmapDoc[]> => {
      if (!user) return [];

      try {
        const q = query(
          collection(db, "mindmaps"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
          .map((d) => {
            const data = d.data() as {
              data?: { nodeData?: { topic?: string } };
              createdAt?: FirestoreMindmapDoc["createdAt"];
            };
            return {
              id: d.id,
              title: data.data?.nodeData?.topic ?? "",
              createdAt: data.createdAt ?? null,
            };
          })
          .filter((map) => map.id !== excludeId);
      } catch {
        toast.error("Error fetching mind maps");
        return [];
      }
    },
    [user]
  );

  const updateNodeHyperlink = async (
    nodeId: string,
    hyperlinkData: HyperlinkData | ""
  ) => {
    if (!mindmapInstance || !selectedNode || nodeId !== selectedNode.id) {
      toast.error(
        "Mindmap instance is undefined or no matching node has been selected"
      );
      return;
    }

    const updatedNodeData: NodeData = { ...mindmapInstance.nodeData };

    const updateNode = (node: NodeData): boolean => {
      if (node.id === nodeId) {
        node.hyperLink =
          hyperlinkData && (hyperlinkData as HyperlinkData).id
            ? (hyperlinkData as HyperlinkData).id
            : "";
        return true;
      }
      return node.children?.some(updateNode) ?? false;
    };

    if (updateNode(updatedNodeData)) {
      mindmapInstance.nodeData = updatedNodeData;
      mindmapInstance.refresh();
      if (hyperlinkData && (hyperlinkData as HyperlinkData).id) {
        toast(
          `Hyperlink for node '${selectedNode.topic}' updated successfully`,
          { autoClose: 1500 }
        );
      } else {
        toast(
          `Hyperlink for node '${selectedNode.topic}' removed successfully`,
          { autoClose: 1500 }
        );
      }
    } else {
      toast.error("Unable to find the specified node", { autoClose: 1500 });
    }
  };

  const exportMindMap = async (format = "svg") => {
    if (!mindmapInstance) {
      toast.error("Mindmap instance is not available.");
      return;
    }

    try {
      const data = mindmapInstance.getData();
      const rootNode = data.root ?? data.nodeData;
      const title = rootNode.topic || "MindMap";

      if (format === "svg") {
        const blob = await mindmapInstance.exportSvg();
        const reader = new FileReader();
        reader.onloadend = function () {
          const result = reader.result as string;
          let svgContent = result.replace(/&nbsp;/g, " ");
          const svgBlob = new Blob([svgContent], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(svgBlob);
          const a = document.createElement("a");
          const safeTitle = title
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
            .replace(/\s+/g, "-");
          a.href = url;
          a.download = `MindCard-${safeTitle}.svg`;
          a.click();
          URL.revokeObjectURL(url);
        };
        reader.readAsText(blob);
      } else if (format === "markdown") {
        const markdownContent = convertToMarkdown(rootNode);
        const mdBlob = new Blob([markdownContent], {
          type: "text/markdown;charset=utf-8",
        });
        const url = URL.createObjectURL(mdBlob);
        const a = document.createElement("a");
        const safeTitle = title
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
          .replace(/\s+/g, "-");
        a.href = url;
        a.download = `MindCard-${safeTitle}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      toast.error("An error occurred during the export process.");
    }
  };

  const convertToMarkdown = (node: NodeData, depth = 0): string => {
    let markdown: string;
    if (depth <= 2) {
      markdown = `${"#".repeat(depth + 1)} ${node.topic}\n`;
    } else {
      markdown = `${"  ".repeat(depth - 2)}- ${node.topic}\n`;
    }
    if (node.children) {
      node.children.forEach((child) => {
        markdown += convertToMarkdown(child, depth + 1);
      });
    }
    return markdown;
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
        currentMindmapTitle,
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
