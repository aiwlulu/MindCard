import React, { useContext, useEffect } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authContext } from "./auth-context";
import { MindmapContext, MindmapProvider } from "./mindmap-context";

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
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  updateDoc: jest.fn(),
  where: jest.fn(),
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
const mockToast = (jest.requireMock("react-toastify") as {
  toast: jest.Mock & { error: jest.Mock };
}).toast;

function Harness() {
  const { mindmapData, updateMindmapData, saveMindmap } = useContext(MindmapContext);

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
      <button onClick={() => void saveMindmap()}>Save</button>
    </>
  );
}

describe("MindmapProvider", () => {
  beforeEach(() => {
    mockAddDoc.mockReset().mockResolvedValue({ id: "created-map" });
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
});
