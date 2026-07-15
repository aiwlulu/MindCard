import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import MindmapPage from "./page";
import { authContext } from "@/lib/store/auth-context";
import { MindmapContext } from "@/lib/store/mindmap-context";
import type { MindmapContextValue } from "@/lib/types";

const mockBatchUpdate = jest.fn();
const mockBatchSet = jest.fn();
const mockBatchDelete = jest.fn();
const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("firebase/firestore/lite", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn((_database, collectionName, id) => ({ collectionName, id })),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(() => ({
    update: mockBatchUpdate,
    set: mockBatchSet,
    delete: mockBatchDelete,
    commit: mockBatchCommit,
  })),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "database" } }));
jest.mock("@/components/MindMapList", () =>
  function MockMindMapList({
    mindMaps,
    isLoading,
    onTogglePublic,
  }: {
    mindMaps: Array<{ id: string; isPublic?: boolean }>;
    isLoading: boolean;
    onTogglePublic: (id: string, isPublic: boolean) => void;
  }) {
    if (isLoading) return <div role="status">Loading mind maps…</div>;

    return mindMaps.length ? (
      <button onClick={() => onTogglePublic(mindMaps[0].id, true)}>
        Publish test map
      </button>
    ) : (
      <div>No maps</div>
    );
  }
);

const context: MindmapContextValue = {
  mindmapData: null,
  updateMindmapData: jest.fn(),
  saveMindmap: jest.fn(),
  loadMindmap: jest.fn(),
  currentMindmapId: null,
  setCurrentMindmapId: jest.fn(),
  currentMindmapTitle: null,
  getAllMindmaps: jest.fn().mockResolvedValue([
    {
      id: "map-1",
      title: "Test map",
      createdAt: { seconds: 1 } as never,
      isPublic: false,
    },
  ]),
  selectedNode: null,
  setSelectedNode: jest.fn(),
  updateNodeHyperlink: jest.fn(),
  exportMindMap: jest.fn(),
};

describe("Mindmap folder public sharing", () => {
  beforeEach(() => {
    mockBatchUpdate.mockClear();
    mockBatchSet.mockClear();
    mockBatchDelete.mockClear();
    mockBatchCommit.mockClear().mockResolvedValue(undefined);
    mockGetDoc.mockReset().mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: "user-1",
        data: {
          nodeData: {
            id: "root",
            root: true,
            topic: "Test map",
            children: [
              { id: "child", topic: "Private card", hyperLink: "secret-map" },
            ],
          },
        },
      }),
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  it("publishes a sanitized snapshot instead of exposing the private document", async () => {
    await act(async () => {
      render(
        <authContext.Provider
          value={{ user: { uid: "user-1" } as never, loading: false } as never}
        >
          <MindmapContext.Provider value={context}>
            <MindmapPage />
          </MindmapContext.Provider>
        </authContext.Provider>
      );
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByRole("button", { name: "Publish test map" })
      );
    });

    await waitFor(() => expect(mockBatchCommit).toHaveBeenCalledTimes(1));
    expect(mockBatchSet).toHaveBeenCalledWith(
      { collectionName: "publicMindmaps", id: "map-1" },
      expect.objectContaining({
        isPublic: true,
        data: expect.objectContaining({ schemaVersion: 2, rootId: "root" }),
      })
    );
    expect(JSON.stringify(mockBatchSet.mock.calls[0][1])).not.toContain(
      "secret-map"
    );
  });

  it("shows a loading state while mind maps are being fetched", async () => {
    const loadingContext = {
      ...context,
      getAllMindmaps: jest.fn().mockReturnValue(new Promise<never>(() => {})),
    };

    await act(async () => {
      render(
        <authContext.Provider
          value={{ user: { uid: "user-1" } as never, loading: false } as never}
        >
          <MindmapContext.Provider value={loadingContext}>
            <MindmapPage />
          </MindmapContext.Provider>
        </authContext.Provider>
      );
    });

    expect(screen.getByRole("status")).toHaveTextContent("Loading mind maps");
    expect(screen.queryByText("No maps")).not.toBeInTheDocument();
  });
});
