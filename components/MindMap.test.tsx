import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MindMap from "./MindMap";
import { MindmapContext } from "@/lib/store/mindmap-context";
import type { MindmapContextValue, MindmapData } from "@/lib/types";

jest.mock("./Card", () => () => null);
jest.mock("./ShortcutGuide", () => () => null);

const data: MindmapData = {
  nodeData: {
    id: "root",
    root: true,
    topic: "Root",
    children: [{ id: "child", topic: "Child" }],
  },
};

function createContext(): MindmapContextValue {
  return {
    mindmapData: data,
    updateMindmapData: jest.fn(),
    saveMindmap: jest.fn().mockResolvedValue(undefined),
    loadMindmap: jest.fn().mockResolvedValue(data),
    currentMindmapId: "map-1",
    setCurrentMindmapId: jest.fn(),
    currentMindmapTitle: "Root",
    getAllMindmaps: jest.fn().mockResolvedValue([]),
    selectedNode: null,
    setSelectedNode: jest.fn(),
    updateNodeHyperlink: jest.fn().mockResolvedValue(undefined),
    exportMindMap: jest.fn().mockResolvedValue(undefined),
  };
}

function renderMindMap(context = createContext()) {
  return {
    context,
    ...render(
      <MindmapContext.Provider value={context}>
        <MindMap id="map-1" />
      </MindmapContext.Provider>
    ),
  };
}

describe("MindMap editor", () => {
  it("selects a node when it is clicked", () => {
    const context = createContext();
    renderMindMap(context);

    fireEvent.click(screen.getByRole("button", { name: "Child" }));

    expect(context.setSelectedNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: "child", topic: "Child" })
    );
  });

  it("enters inline editing on double click and commits the new topic", () => {
    const context = createContext();
    renderMindMap(context);

    fireEvent.doubleClick(screen.getByRole("button", { name: "Child" }));
    const input = screen.getByDisplayValue("Child");
    fireEvent.change(input, { target: { value: "Renamed child" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(context.updateMindmapData).toHaveBeenCalledWith(expect.any(Function));
  });

  it("adds a child from the node context menu", () => {
    const context = createContext();
    renderMindMap(context);

    fireEvent.contextMenu(screen.getByRole("button", { name: "Child" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Add child" }));

    expect(context.updateMindmapData).toHaveBeenCalledWith(expect.any(Function));
  });

  it("inserts a sibling with the Enter shortcut", () => {
    const context = createContext();
    context.selectedNode = data.nodeData.children?.[0] ?? null;
    renderMindMap(context);

    fireEvent.keyDown(screen.getByRole("application", { name: "Mind map editor" }), {
      key: "Enter",
    });

    expect(context.updateMindmapData).toHaveBeenCalledWith(expect.any(Function));
  });

  it("saves directly with the Ctrl+S shortcut", () => {
    const context = createContext();
    renderMindMap(context);

    fireEvent.keyDown(screen.getByRole("application", { name: "Mind map editor" }), {
      key: "s",
      ctrlKey: true,
    });

    expect(context.saveMindmap).toHaveBeenCalledWith();
  });
});
