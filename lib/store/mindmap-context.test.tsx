import React, { useContext, useEffect } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authContext } from "./auth-context";
import { MindmapContext, MindmapProvider } from "./mindmap-context";

const mockBatchUpdate = jest.fn();
const mockBatchSet = jest.fn();
const mockBatchCommit = jest.fn().mockResolvedValue(undefined);

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("react-firebase-hooks/auth", () => ({
  useAuthState: jest.fn(() => [null, false]),
}));

jest.mock("firebase/firestore/lite", () => ({
  addDoc: jest.fn().mockResolvedValue({ id: "created-map" }),
  collection: jest.fn(),
  doc: jest.fn((_database, collectionName, id) => ({ collectionName, id })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  updateDoc: jest.fn(),
  where: jest.fn(),
  writeBatch: jest.fn(() => ({
    update: mockBatchUpdate,
    set: mockBatchSet,
    commit: mockBatchCommit,
  })),
}));

jest.mock("@/lib/firebase", () => ({ db: {} }));
jest.mock("react-toastify", () => {
  const toast = Object.assign(jest.fn(), {
    error: jest.fn(),
    success: jest.fn(),
  });
  return { toast };
});

const mockAddDoc = (jest.requireMock("firebase/firestore/lite") as {
  addDoc: jest.Mock;
}).addDoc;
const mockGetDoc = (jest.requireMock("firebase/firestore/lite") as {
  getDoc: jest.Mock;
}).getDoc;
const mockToast = (jest.requireMock("react-toastify") as {
  toast: jest.Mock & { error: jest.Mock };
}).toast;

function Harness() {
  const { mindmapData, saveStatus, updateMindmapData, saveMindmap } = useContext(MindmapContext);

  useEffect(() => {
    updateMindmapData((current) =>
      current ?? {
        nodeData: { id: "root", root: true, topic: "Typed map" },
      }
    );
  }, [updateMindmapData]);

  return (
    <>
      <output>{mindmapData?.nodeData.topic ?? "empty"}</output>
      <output aria-label="Save status">{saveStatus}</output>
      <button onClick={() => void saveMindmap()}>Save</button>
    </>
  );
}

function ExistingMapHarness() {
  const {
    mindmapData,
    loadMindmap,
    updateMindmapData,
    saveMindmap,
  } = useContext(MindmapContext);

  return (
    <>
      <output>{mindmapData?.nodeData.topic ?? "empty"}</output>
      <button onClick={() => void loadMindmap("public-map")}>Load</button>
      <button
        onClick={() =>
          updateMindmapData((current) =>
            current
              ? {
                  ...current,
                  nodeData: { ...current.nodeData, topic: "Updated public map" },
                }
              : current
          )
        }
      >
        Edit
      </button>
      <button onClick={() => void saveMindmap()}>Save existing</button>
    </>
  );
}


function FocusExportHarness() {
  const {
    mindmapData,
    updateMindmapData,
    focusedNodeId,
    setFocusedNodeId,
    exportMindMap,
  } = useContext(MindmapContext);

  useEffect(() => {
    updateMindmapData((current) =>
      current ?? {
        nodeData: {
          id: "root",
          root: true,
          topic: "Whole map",
          children: [
            {
              id: "branch",
              topic: "Branch",
              children: [{ id: "leaf", topic: "Leaf" }],
            },
          ],
        },
      }
    );
  }, [updateMindmapData]);

  return (
    <>
      <output aria-label="Focus">{focusedNodeId ?? "none"}</output>
      <output aria-label="Topic">{mindmapData?.nodeData.topic ?? "empty"}</output>
      <button onClick={() => setFocusedNodeId("branch")}>Focus branch</button>
      <button onClick={() => void exportMindMap("markdown")}>Export</button>
      <button
        onClick={() =>
          updateMindmapData((current) =>
            current
              ? { ...current, nodeData: { ...current.nodeData, children: [] } }
              : current
          )
        }
      >
        Drop branch
      </button>
    </>
  );
}

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("MindmapProvider", () => {
  beforeEach(() => {
    mockAddDoc.mockReset().mockResolvedValue({ id: "created-map" });
    mockGetDoc.mockReset();
    mockBatchUpdate.mockClear();
    mockBatchSet.mockClear();
    mockBatchCommit.mockClear().mockResolvedValue(undefined);
    mockToast.mockClear();
    mockToast.error.mockClear();
  });

  it("stores typed data and saves a new map for the authenticated user", async () => {
    await act(async () => {
      render(
        <authContext.Provider value={{ user: { uid: "user-1" } as never, loading: false } as never}>
          <MindmapProvider>
            <Harness />
          </MindmapProvider>
        </authContext.Provider>
      );
    });

    await waitFor(() => expect(screen.getByText("Typed map")).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalled());
    expect(screen.getByLabelText("Save status")).toHaveTextContent("saved");
    expect(mockAddDoc.mock.calls[0][1]).toMatchObject({
      data: {
        schemaVersion: 2,
        rootId: "root",
        nodes: [
          {
            id: "root",
            topic: "Typed map",
            parentId: null,
            order: 0,
          },
        ],
      },
      userId: "user-1",
    });
  });

  it("shows an actionable message when Firebase rejects document limits", async () => {
    mockAddDoc.mockRejectedValueOnce({
      code: "invalid-argument",
      message: "maximum depth exceeded",
    });
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      await act(async () => {
        render(
          <authContext.Provider value={{ user: { uid: "user-1" } as never, loading: false } as never}>
            <MindmapProvider>
              <Harness />
            </MindmapProvider>
          </authContext.Provider>
        );
      });

      await waitFor(() => expect(screen.getByText("Typed map")).toBeInTheDocument());
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });

      await waitFor(() =>
        expect(mockToast.error).toHaveBeenCalledWith(
          "This mind map exceeds Firebase document limits."
        )
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("updates the sanitized public snapshot when a public map is saved", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        isPublic: true,
        data: {
          nodeData: {
            id: "root",
            root: true,
            topic: "Public map",
            children: [
              {
                id: "child",
                topic: "Reference",
                hyperLink: "private-card-id",
                externalLink: "https://example.com",
              },
            ],
          },
        },
      }),
    });

    render(
      <authContext.Provider
        value={{ user: { uid: "user-1" } as never, loading: false } as never}
      >
        <MindmapProvider>
          <ExistingMapHarness />
        </MindmapProvider>
      </authContext.Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Load" }));
    await screen.findByText("Public map");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await screen.findByText("Updated public map");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save existing" }));
    });

    await waitFor(() => expect(mockBatchCommit).toHaveBeenCalledTimes(1));
    expect(mockBatchSet).toHaveBeenCalledWith(
      { collectionName: "publicMindmaps", id: "public-map" },
      expect.objectContaining({
        isPublic: true,
        data: expect.objectContaining({ schemaVersion: 2, rootId: "root" }),
      })
    );
    const publicSnapshot = mockBatchSet.mock.calls[0][1];
    expect(JSON.stringify(publicSnapshot)).not.toContain("private-card-id");
    expect(JSON.stringify(publicSnapshot)).toContain("https://example.com");
  });
  it("exports only the focused subtree and clears a focus that disappears", async () => {
    const downloads: string[] = [];
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function mockClick(this: HTMLAnchorElement) {
        downloads.push(this.download);
      });
    const blobs: Blob[] = [];
    const createObjectURL = jest.fn((blob: Blob) => {
      blobs.push(blob);
      return "blob:mock";
    });
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL as never;
    URL.revokeObjectURL = jest.fn() as never;

    try {
      render(
        <authContext.Provider
          value={{ user: { uid: "user-1" } as never, loading: false } as never}
        >
          <MindmapProvider>
            <FocusExportHarness />
          </MindmapProvider>
        </authContext.Provider>
      );

      await screen.findByText("Whole map");
      fireEvent.click(screen.getByRole("button", { name: "Focus branch" }));
      expect(screen.getByLabelText("Focus")).toHaveTextContent("branch");

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Export" }));
      });

      await waitFor(() => expect(blobs).toHaveLength(1));
      const markdown = await readBlobText(blobs[0]);
      expect(markdown).toContain("Branch");
      expect(markdown).toContain("Leaf");
      expect(markdown).not.toContain("Whole map");
      expect(downloads).toEqual(["MindCard-Branch.md"]);

      fireEvent.click(screen.getByRole("button", { name: "Drop branch" }));
      await waitFor(() =>
        expect(screen.getByLabelText("Focus")).toHaveTextContent("none")
      );
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });
});
