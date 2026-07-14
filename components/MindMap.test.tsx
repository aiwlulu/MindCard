import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MindMap from "./MindMap";
import { MindmapContext } from "@/lib/store/mindmap-context";
import type { MindmapContextValue, MindmapData } from "@/lib/types";

const mockRouterPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("./Card", () => () => null);
jest.mock("./ShortcutGuide", () => () => null);

const data: MindmapData = {
  nodeData: {
    id: "root",
    root: true,
    topic: "Root",
    children: [
      {
        id: "child",
        topic: "Child",
        hyperLink: "linked-map",
        children: [{ id: "grandchild", topic: "Grandchild" }],
      },
    ],
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

function StatefulMindMap({ context }: { context: MindmapContextValue }) {
  const [currentData, setCurrentData] = React.useState(data);
  const value: MindmapContextValue = {
    ...context,
    mindmapData: currentData,
    updateMindmapData: (updater) => {
      context.updateMindmapData(updater);
      setCurrentData((current) =>
        typeof updater === "function" ? updater(current) ?? current : updater
      );
    },
  };

  return (
    <MindmapContext.Provider value={value}>
      <MindMap id="map-1" />
    </MindmapContext.Provider>
  );
}

describe("MindMap editor", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
  });

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

  it("uses Enter on the root to create a child instead of an invalid sibling", () => {
    const context = createContext();
    context.selectedNode = data.nodeData;
    renderMindMap(context);

    fireEvent.keyDown(screen.getByRole("application", { name: "Mind map editor" }), {
      key: "Enter",
    });

    const update = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    expect(update(data).nodeData.children).toHaveLength(2);
  });

  it("navigates from the root to its first child with ArrowRight", () => {
    const context = createContext();
    context.selectedNode = data.nodeData;
    renderMindMap(context);

    fireEvent.keyDown(screen.getByRole("application", { name: "Mind map editor" }), {
      key: "ArrowRight",
    });

    expect(context.setSelectedNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: "child" })
    );
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

  it("opens a linked mind map from the node link action", () => {
    renderMindMap();

    fireEvent.click(screen.getByRole("link", { name: "Open linked mind map" }));

    expect(mockRouterPush).toHaveBeenCalledWith("/mindmap/linked-map");
  });

  it("collapses the selected branch from the command bar", () => {
    const context = createContext();
    context.selectedNode = data.nodeData.children?.[0] ?? null;
    renderMindMap(context);

    fireEvent.click(screen.getByRole("button", { name: "Collapse branch" }));

    const update = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    expect(update(data).nodeData.children?.[0].collapsed).toBe(true);
  });

  it("collapses a child subtree from its inline branch control", () => {
    const context = createContext();
    renderMindMap(context);

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse Child branch" })
    );

    const update = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    expect(update(data).nodeData.children?.[0].collapsed).toBe(true);
  });

  it("selects the New Topic placeholder so typing replaces it", () => {
    const context = createContext();
    render(<StatefulMindMap context={context} />);

    fireEvent.contextMenu(screen.getByRole("button", { name: "Child" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Add child" }));

    const input = screen.getByDisplayValue("New Topic") as HTMLInputElement;
    fireEvent.focus(input);

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("New Topic".length);
  });

  it("keeps editing while a Chinese IME composition is active", () => {
    const context = createContext();
    renderMindMap(context);

    fireEvent.doubleClick(screen.getByRole("button", { name: "Child" }));
    const input = screen.getByDisplayValue("Child");
    const updateMock = context.updateMindmapData as jest.Mock;
    const callsBeforeComposition = updateMock.mock.calls.length;

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "中文" } });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229, isComposing: true });

    expect(screen.getByDisplayValue("中文")).toBeInTheDocument();
    expect(updateMock).toHaveBeenCalledTimes(callsBeforeComposition);

    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(updateMock.mock.calls.length).toBeGreaterThan(
      callsBeforeComposition
    );
  });

  it("offers image and Markdown export directly on the canvas", () => {
    const context = createContext();
    renderMindMap(context);

    fireEvent.click(screen.getByRole("button", { name: "Export image" }));
    fireEvent.click(screen.getByRole("button", { name: "Export Markdown" }));

    expect(context.exportMindMap).toHaveBeenNthCalledWith(1, "svg");
    expect(context.exportMindMap).toHaveBeenNthCalledWith(2, "markdown");
  });

  it("provides a dedicated control to center the map", () => {
    renderMindMap();

    expect(
      screen.getByRole("button", { name: "Center map" })
    ).toBeInTheDocument();
  });
});
