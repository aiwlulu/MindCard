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
jest.mock("react-toastify", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

const mockAddDoc = (jest.requireMock("firebase/firestore/lite") as {
  addDoc: jest.Mock;
}).addDoc;

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
    mockAddDoc.mockClear();
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
      data: { nodeData: { id: "root", topic: "Typed map" } },
      userId: "user-1",
    });
  });
});
