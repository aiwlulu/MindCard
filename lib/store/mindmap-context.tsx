"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore/lite";
import { toast } from "react-toastify";
import { db } from "@/lib/firebase";
import { authContext } from "./auth-context";
import {
  buildMindmapPng,
  buildMindmapSvg,
  convertToMarkdown,
  sanitizeFilename,
} from "@/lib/mindmap/export";
import {
  findNode,
  normalizeMindmapData,
  serializeMindmapData,
  updateNode,
} from "@/lib/mindmap/tree";
import type {
  FirestoreMindmapDoc,
  HyperlinkData,
  MindmapContextValue,
  MindmapData,
  MindmapExportFormat,
  NodeData,
  SaveMindmapOptions,
} from "@/lib/types";

export const MindmapContext = createContext<MindmapContextValue>({
  mindmapData: null,
  updateMindmapData: () => {},
  saveMindmap: async () => {},
  loadMindmap: async () => null,
  currentMindmapId: null,
  setCurrentMindmapId: () => {},
  currentMindmapTitle: null,
  getAllMindmaps: async () => [],
  selectedNode: null,
  setSelectedNode: () => {},
  updateNodeHyperlink: async () => {},
  exportMindMap: async () => {},
});

export function MindmapProvider({ children }: { children: React.ReactNode }) {
  const { user } = useContext(authContext);
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [currentMindmapId, setCurrentMindmapId] = useState<string | null>(null);
  const [currentMindmapTitle, setCurrentMindmapTitle] = useState<string | null>(
    null
  );
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const updateMindmapData = useCallback(
    (
      updater:
        | MindmapData
        | ((current: MindmapData | null) => MindmapData | null)
    ) => {
      setMindmapData((current) =>
        typeof updater === "function" ? updater(current) : updater
      );
      setIsDirty(true);
    },
    []
  );

  const saveMindmap = useCallback(
    async ({ silent = false }: SaveMindmapOptions = {}) => {
      if (!user) {
        if (!silent) toast.error("You must be logged in to save the mind map.");
        return;
      }

      if (!mindmapData) {
        if (!silent) {
          toast.error("Unable to save the mind map as no data was retrieved.");
        }
        return;
      }

      try {
        const storedData = serializeMindmapData(mindmapData);
        if (currentMindmapId) {
          await updateDoc(doc(db, "mindmaps", currentMindmapId), {
            data: storedData,
            updatedAt: serverTimestamp(),
          });
          if (!silent) {
            toast("Saved successfully!", {
              autoClose: 1000,
              toastId: "mindmap-save-success",
            });
          }
        } else {
          const docRef = await addDoc(collection(db, "mindmaps"), {
            data: storedData,
            userId: user.uid,
            createdAt: serverTimestamp(),
          });
          setCurrentMindmapId(docRef.id);
          if (!silent) {
            toast("Mind map created successfully", {
              toastId: "mindmap-save-success",
            });
          }
        }
        setIsDirty(false);
      } catch (error) {
        console.error("Failed to save mind map", error);
        if (!silent) toast.error(getMindmapSaveErrorMessage(error));
      }
    },
    [currentMindmapId, mindmapData, user]
  );

  useEffect(() => {
    if (!isDirty || !currentMindmapId || !mindmapData) return;

    const timeoutId = window.setTimeout(() => {
      void saveMindmap({ silent: true });
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [currentMindmapId, isDirty, mindmapData, saveMindmap]);

  const loadMindmap = useCallback(async (id: string): Promise<MindmapData | null> => {
    try {
      const snapshot = await getDoc(doc(db, "mindmaps", id));
      if (!snapshot.exists()) {
        setMindmapData(null);
        setCurrentMindmapId(null);
        setCurrentMindmapTitle(null);
        toast.error("Mind map not found.");
        return null;
      }

      const storedData = snapshot.data() as { data?: unknown };
      const normalized = normalizeMindmapData(storedData.data);
      setMindmapData(normalized);
      setCurrentMindmapId(id);
      setCurrentMindmapTitle(normalized.nodeData.topic);
      setSelectedNode(null);
      setIsDirty(false);
      return normalized;
    } catch {
      toast.error("Error loading mind map.");
      return null;
    }
  }, []);

  const getAllMindmaps = useCallback(
    async (excludeId?: string): Promise<FirestoreMindmapDoc[]> => {
      if (!user) return [];

      try {
        const mindmapsQuery = query(
          collection(db, "mindmaps"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(mindmapsQuery);

        return snapshot.docs
          .map((mindmapDoc) => {
            const data = mindmapDoc.data() as {
              data?: unknown;
              createdAt?: FirestoreMindmapDoc["createdAt"];
            };
            const normalized = normalizeMindmapData(data.data);
            return {
              id: mindmapDoc.id,
              title: normalized.nodeData.topic,
              createdAt: data.createdAt ?? null,
            };
          })
          .filter((mindmap) => mindmap.id !== excludeId);
      } catch {
        toast.error("Error fetching mind maps");
        return [];
      }
    },
    [user]
  );

  const updateNodeHyperlink = useCallback(
    async (nodeId: string, hyperlinkData: HyperlinkData | "") => {
      if (!mindmapData || !selectedNode || nodeId !== selectedNode.id) {
        toast.error(
          "Mindmap data is unavailable or no matching node has been selected"
        );
        return;
      }

      const updatedRoot = updateNode(mindmapData.nodeData, nodeId, (node) => {
        const nextNode = { ...node };
        if (hyperlinkData && hyperlinkData.id) {
          nextNode.hyperLink = hyperlinkData.id;
        } else {
          delete nextNode.hyperLink;
        }
        return nextNode;
      });

      if (updatedRoot === mindmapData.nodeData) {
        toast.error("Unable to find the specified node", { autoClose: 1500 });
        return;
      }

      const nextData = { ...mindmapData, nodeData: updatedRoot };
      updateMindmapData(nextData);
      setSelectedNode(findNode(updatedRoot, nodeId));
      toast(
        hyperlinkData && hyperlinkData.id
          ? `Hyperlink for node '${selectedNode.topic}' updated successfully`
          : `Hyperlink for node '${selectedNode.topic}' removed successfully`,
        { autoClose: 1500 }
      );
    },
    [mindmapData, selectedNode, updateMindmapData]
  );

  const exportMindMap = useCallback(
    async (format: MindmapExportFormat = "svg") => {
      if (!mindmapData || typeof document === "undefined") {
        toast.error("Mindmap data is not available.");
        return;
      }

      const root = mindmapData.root ?? mindmapData.nodeData;
      const safeTitle = sanitizeFilename(root.topic);

      try {
        if (format === "markdown") {
          downloadBlob(
            new Blob([convertToMarkdown(root)], { type: "text/markdown;charset=utf-8" }),
            `MindCard-${safeTitle}.md`
          );
          return;
        }

        if (format === "png") {
          downloadBlob(
            await buildMindmapPng(root),
            `MindCard-${safeTitle}.png`
          );
          return;
        }

        downloadBlob(
          new Blob([buildMindmapSvg(root)], { type: "image/svg+xml;charset=utf-8" }),
          `MindCard-${safeTitle}.svg`
        );
      } catch {
        toast.error("An error occurred during the export process.");
      }
    },
    [mindmapData]
  );

  const value = useMemo<MindmapContextValue>(
    () => ({
      mindmapData,
      updateMindmapData,
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
    }),
    [
      currentMindmapId,
      currentMindmapTitle,
      exportMindMap,
      getAllMindmaps,
      loadMindmap,
      mindmapData,
      saveMindmap,
      selectedNode,
      updateMindmapData,
      updateNodeHyperlink,
    ]
  );

  return (
    <MindmapContext.Provider value={value}>{children}</MindmapContext.Provider>
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getMindmapSaveErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code).replace(/^firestore\//, "")
      : "";

  if (code === "invalid-argument" || code === "resource-exhausted") {
    return "This mind map exceeds Firebase document limits.";
  }
  if (code === "permission-denied" || code === "unauthenticated") {
    return "You do not have permission to save this mind map.";
  }
  if (code === "unavailable") {
    return "Firebase is temporarily unavailable. Please try again.";
  }
  return "Error saving mind map.";
}
