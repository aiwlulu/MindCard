import React, { Suspense } from "react";
import { act, render, screen } from "@testing-library/react";
import PublicMindMapPage from "./page";

const mockDoc = jest.fn((database, collectionName, id) => ({
  database,
  collectionName,
  id,
}));
const mockGetDoc = jest.fn().mockResolvedValue({
  exists: () => true,
  data: () => ({
    isPublic: true,
    data: {
      nodeData: { id: "root", root: true, topic: "Public topic" },
    },
  }),
});

jest.mock("firebase/firestore/lite", () => ({
  doc: (database: unknown, collectionName: string, id: string) =>
    mockDoc(database, collectionName, id),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "database" } }));
jest.mock("@/components/PublicMindMapViewer", () =>
  function MockPublicMindMapViewer({ root }: { root: { topic: string } }) {
    return <div>Viewer: {root.topic}</div>;
  }
);

describe("PublicMindMapPage", () => {
  beforeEach(() => {
    mockDoc.mockClear();
    mockGetDoc.mockClear();
  });

  it("loads the sanitized public snapshot instead of the private source document", async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Suspended</div>}>
          <PublicMindMapPage params={Promise.resolve({ id: "public-map" })} />
        </Suspense>
      );
    });

    expect(await screen.findByText("Viewer: Public topic")).toBeInTheDocument();
    expect(mockDoc).toHaveBeenCalledWith(
      { name: "database" },
      "publicMindmaps",
      "public-map"
    );
    expect(mockDoc).not.toHaveBeenCalledWith(
      { name: "database" },
      "mindmaps",
      "public-map"
    );
  });
});
