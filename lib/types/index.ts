import type { User } from "firebase/auth";
import type { Timestamp } from "firebase/firestore/lite";

// ─── Mind map node / data shapes ──────────────────────────────────────────

export interface NodeData {
  id: string;
  topic: string;
  root?: boolean;
  bold?: boolean;
  hyperLink?: string;
  externalLink?: string;
  collapsed?: boolean;
  children?: NodeData[];
}

export interface MindmapData {
  nodeData: NodeData;
  /** Legacy documents can also expose the root at the top level. */
  root?: NodeData;
}

// ─── Firestore document shapes ─────────────────────────────────────────────

export interface FirestoreMindmapDoc {
  id: string;
  title: string;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
  isPublic?: boolean;
}

export interface MindmapListItem extends FirestoreMindmapDoc {
  description: string;
}

// ─── Auth context ──────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null | undefined;
  loading: boolean;
  googleLoginHandler: () => Promise<void>;
  registerWithEmailAndPassword: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  loginWithEmailAndPassword: (
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

// ─── Mindmap context ───────────────────────────────────────────────────────

export interface HyperlinkData {
  id: string;
}

export type MindmapExportFormat = "svg" | "png" | "markdown";

export interface SaveMindmapOptions {
  silent?: boolean;
}

export type MindmapSaveStatus =
  | "idle"
  | "unsaved"
  | "saving"
  | "saved"
  | "error";

export interface MindmapContextValue {
  mindmapData: MindmapData | null;
  updateMindmapData: (
    updater: MindmapData | ((current: MindmapData | null) => MindmapData | null)
  ) => void;
  saveMindmap: (options?: SaveMindmapOptions) => Promise<void>;
  saveStatus?: MindmapSaveStatus;
  loadMindmap: (id: string) => Promise<MindmapData | null>;
  currentMindmapId: string | null;
  setCurrentMindmapId: React.Dispatch<React.SetStateAction<string | null>>;
  currentMindmapTitle: string | null;
  getAllMindmaps: (excludeId?: string) => Promise<FirestoreMindmapDoc[]>;
  selectedNode: NodeData | null;
  setSelectedNode: React.Dispatch<React.SetStateAction<NodeData | null>>;
  /** Node the canvas and exports are scoped to, or null for the whole map. */
  focusedNodeId: string | null;
  setFocusedNodeId: (nodeId: string | null) => void;
  updateNodeHyperlink: (
    nodeId: string,
    hyperlinkData: HyperlinkData | ""
  ) => Promise<void>;
  exportMindMap: (format?: MindmapExportFormat) => Promise<void>;
}

// ─── SweetAlert ────────────────────────────────────────────────────────────

export interface SweetAlertOptions {
  title: string;
  text: string;
  icon: "warning" | "error" | "success" | "info" | "question";
  onConfirm?: () => void;
  onCancel?: () => void;
}

// ─── SilenceConsole ────────────────────────────────────────────────────────

export interface SilenceConsoleOptions {
  blackList: string[];
}
