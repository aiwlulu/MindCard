import React, { Suspense } from "react";
import { act, render, waitFor } from "@testing-library/react";
import Page from "./page";
import { MindmapContext } from "@/lib/store/mindmap-context";
import type { MindmapContextValue } from "@/lib/types";

jest.mock("next/dynamic", () => () => function MockMindMap() {
  return null;
});

function createContext(topic: string): MindmapContextValue {
  return {
    mindmapData: {
      nodeData: { id: "root", root: true, topic },
    },
    updateMindmapData: jest.fn(),
    saveMindmap: jest.fn().mockResolvedValue(undefined),
    loadMindmap: jest.fn().mockResolvedValue(null),
    currentMindmapId: "map-1",
    setCurrentMindmapId: jest.fn(),
    currentMindmapTitle: "Initial topic",
    getAllMindmaps: jest.fn().mockResolvedValue([]),
    selectedNode: null,
    setSelectedNode: jest.fn(),
    focusedNodeId: null,
    setFocusedNodeId: jest.fn(),
    updateNodeHyperlink: jest.fn().mockResolvedValue(undefined),
    exportMindMap: jest.fn().mockResolvedValue(undefined),
  };
}

describe("Mind map page document title", () => {
  it("updates the browser title when the root topic changes", async () => {
    const params = Promise.resolve({ id: "map-1" });
    const initialContext = createContext("Initial topic");
    let view: ReturnType<typeof render>;
    await act(async () => {
      view = render(
        <Suspense fallback={null}>
          <MindmapContext.Provider value={initialContext}>
            <Page params={params} />
          </MindmapContext.Provider>
        </Suspense>
      );
    });

    await waitFor(() =>
      expect(document.title).toBe("Initial topic | MindCard")
    );

    const updatedContext = createContext("Renamed topic");
    await act(async () => {
      view.rerender(
        <Suspense fallback={null}>
          <MindmapContext.Provider value={updatedContext}>
            <Page params={params} />
          </MindmapContext.Provider>
        </Suspense>
      );
    });

    await waitFor(() =>
      expect(document.title).toBe("Renamed topic | MindCard")
    );
  });
});
