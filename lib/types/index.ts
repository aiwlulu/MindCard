import type { User } from "firebase/auth";
import type { Timestamp } from "firebase/firestore/lite";

// ─── Mind-Elixir node / data shapes ───────────────────────────────────────

export interface NodeData {
  id: string;
  topic: string;
  root?: boolean;
  hyperLink?: string;
  children?: NodeData[];
}

export interface MindmapData {
  nodeData: NodeData;
  /** Some versions expose root at the top level */
  root?: NodeData;
}

// Minimal surface of a MindElixir instance that we actually use
export interface MindElixirInstance {
  getData(): MindmapData;
  init(data: MindmapData): void;
  refresh(): void;
  exportSvg(): Promise<Blob>;
  nodeData: NodeData;
  bus: {
    addListener(event: string, handler: (node: NodeData) => void): void;
  };
}

// ─── Firestore document shapes ─────────────────────────────────────────────

export interface FirestoreMindmapDoc {
  id: string;
  title: string;
  createdAt: Timestamp | null;
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

export interface MindmapContextValue {
  mindmapInstance: MindElixirInstance | null;
  setMindmapInstance: React.Dispatch<
    React.SetStateAction<MindElixirInstance | null>
  >;
  saveMindmap: () => Promise<void>;
  loadMindmap: (id: string, element?: HTMLElement | null) => Promise<void>;
  currentMindmapId: string | null;
  setCurrentMindmapId: React.Dispatch<React.SetStateAction<string | null>>;
  currentMindmapTitle: string | null;
  getAllMindmaps: (excludeId?: string) => Promise<FirestoreMindmapDoc[]>;
  selectedNode: NodeData | null;
  setSelectedNode: React.Dispatch<React.SetStateAction<NodeData | null>>;
  updateNodeHyperlink: (
    nodeId: string,
    hyperlinkData: HyperlinkData | ""
  ) => Promise<void>;
  exportMindMap: (format?: string) => Promise<void>;
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
