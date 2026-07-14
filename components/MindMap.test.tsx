import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MindMap from "./MindMap";
import { MindmapContext } from "@/lib/store/mindmap-context";
import type { MindmapContextValue, MindmapData } from "@/lib/types";

const mockRouterPush = jest.fn();
const pointerEventDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "PointerEvent"
);

class TestPointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
    this.pointerType = init.pointerType ?? "mouse";
  }
}

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
  const [currentSelection, setCurrentSelection] = React.useState(
    context.selectedNode
  );
  const value: MindmapContextValue = {
    ...context,
    mindmapData: currentData,
    selectedNode: currentSelection,
    setSelectedNode: (node) => {
      context.setSelectedNode(node);
      setCurrentSelection(node);
    },
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
  beforeAll(() => {
    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: TestPointerEvent,
    });
  });

  afterAll(() => {
    if (pointerEventDescriptor) {
      Object.defineProperty(window, "PointerEvent", pointerEventDescriptor);
    } else {
      Reflect.deleteProperty(window, "PointerEvent");
    }
  });

  beforeEach(() => {
    mockRouterPush.mockReset();
    jest.restoreAllMocks();
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
    expect(input.tagName).toBe("TEXTAREA");
    expect(input).toHaveAttribute("wrap", "soft");
    fireEvent.change(input, { target: { value: "Renamed child" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(context.updateMindmapData).toHaveBeenCalledWith(expect.any(Function));
  });

  it("keeps the multiline editor open when Shift+Enter is pressed", () => {
    renderMindMap();

    fireEvent.doubleClick(screen.getByRole("button", { name: "Child" }));
    const editor = screen.getByDisplayValue("Child");
    fireEvent.keyDown(editor, { key: "Enter", shiftKey: true });

    expect(screen.getByDisplayValue("Child")).toBeInTheDocument();
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

  it("uses ArrowUp and ArrowDown only between sibling topics", () => {
    const navigationData: MindmapData = {
      nodeData: {
        id: "root",
        root: true,
        topic: "Root",
        children: [
          {
            id: "branch-a",
            topic: "Branch A",
            children: [
              { id: "a-1", topic: "A 1" },
              { id: "a-2", topic: "A 2" },
            ],
          },
          { id: "branch-b", topic: "Branch B" },
        ],
      },
    };
    const context = createContext();
    context.mindmapData = navigationData;
    context.selectedNode = navigationData.nodeData.children?.[0] ?? null;
    renderMindMap(context);
    const editor = screen.getByRole("application", { name: "Mind map editor" });

    fireEvent.keyDown(editor, { key: "ArrowDown" });
    expect(context.setSelectedNode).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "branch-b" })
    );
  });

  it("uses ArrowLeft for the parent and ArrowRight for the first child", () => {
    const context = createContext();
    context.selectedNode = data.nodeData.children?.[0]?.children?.[0] ?? null;
    const { rerender } = renderMindMap(context);
    const editor = screen.getByRole("application", { name: "Mind map editor" });

    fireEvent.keyDown(editor, { key: "ArrowLeft" });
    expect(context.setSelectedNode).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "child" })
    );

    context.selectedNode = data.nodeData.children?.[0] ?? null;
    rerender(
      <MindmapContext.Provider value={context}>
        <MindMap id="map-1" />
      </MindmapContext.Provider>
    );
    fireEvent.keyDown(editor, { key: "ArrowRight" });
    expect(context.setSelectedNode).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "grandchild" })
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

  it("opens a linked mind map in a new tab", () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    renderMindMap();

    fireEvent.click(screen.getByRole("link", { name: "Open linked mind map" }));

    expect(open).toHaveBeenCalledWith(
      "/mindmap/linked-map",
      "_blank",
      "noopener,noreferrer"
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("keeps the linked topic selected after a card is dropped", () => {
    const context = createContext();
    context.selectedNode = data.nodeData.children?.[0] ?? null;
    render(<StatefulMindMap context={context} />);

    fireEvent.drop(
      screen.getByRole("application", { name: "Mind map editor" }),
      {
        dataTransfer: {
          types: ["card/json"],
          getData: () => JSON.stringify({ id: "target-map" }),
        },
      }
    );

    expect(context.updateNodeHyperlink).toHaveBeenCalledWith("child", {
      id: "target-map",
    });
    expect(context.setSelectedNode).not.toHaveBeenCalledWith(null);
    expect(document.querySelectorAll(".mindmap-node-selection")).toHaveLength(1);
  });

  it("adds and opens an external URL without replacing the current page", () => {
    const context = createContext();
    context.selectedNode = data.nodeData.children?.[0] ?? null;
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    const { rerender } = renderMindMap(context);

    fireEvent.click(screen.getByRole("button", { name: "Add external link" }));
    fireEvent.change(screen.getByRole("textbox", { name: "External URL" }), {
      target: { value: "example.com/reference" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save external link" }));

    const update = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    const updated = update(data);
    expect(updated.nodeData.children?.[0].externalLink).toBe(
      "https://example.com/reference"
    );

    rerender(
      <MindmapContext.Provider value={{ ...context, mindmapData: updated }}>
        <MindMap id="map-1" />
      </MindmapContext.Provider>
    );
    fireEvent.click(screen.getByRole("link", { name: "Open external link" }));
    expect(open).toHaveBeenCalledWith(
      "https://example.com/reference",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("lets the external URL input handle paste without creating a child", () => {
    const context = createContext();
    context.selectedNode = data.nodeData.children?.[0] ?? null;
    renderMindMap(context);

    fireEvent.click(screen.getByRole("button", { name: "Add external link" }));
    fireEvent.paste(screen.getByRole("textbox", { name: "External URL" }), {
      clipboardData: {
        getData: () => "https://example.com/reference",
      },
    });

    expect(context.updateMindmapData).not.toHaveBeenCalled();
  });

  it("does not start node dragging when an external link is pressed", () => {
    const context = createContext();
    context.mindmapData = {
      nodeData: {
        ...data.nodeData,
        children: data.nodeData.children?.map((node) => ({
          ...node,
          externalLink: "https://example.com/reference",
        })),
      },
    };
    const setPointerCapture = jest.fn();
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      SVGElement.prototype,
      "setPointerCapture"
    );
    Object.defineProperty(SVGElement.prototype, "setPointerCapture", {
      configurable: true,
      value: setPointerCapture,
    });

    try {
      renderMindMap(context);
      fireEvent.pointerDown(
        screen.getByRole("link", { name: "Open external link" }),
        { button: 0, pointerId: 8 }
      );

      expect(
        screen.getByRole("link", { name: "Open external link" })
      ).toHaveAttribute("data-node-control", "true");
      expect(setPointerCapture).not.toHaveBeenCalled();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(
          SVGElement.prototype,
          "setPointerCapture",
          originalDescriptor
        );
      } else {
        Reflect.deleteProperty(SVGElement.prototype, "setPointerCapture");
      }
    }
  });

  it("removes an external link without deleting the topic", () => {
    const linkedChild = {
      ...(data.nodeData.children?.[0] as NonNullable<
        typeof data.nodeData.children
      >[number]),
      externalLink: "https://example.com/reference",
    };
    const linkedData: MindmapData = {
      nodeData: {
        ...data.nodeData,
        children: [linkedChild],
      },
    };
    const context = createContext();
    context.mindmapData = linkedData;
    context.selectedNode = linkedChild;
    renderMindMap(context);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove external link" })
    );

    const update = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    const updatedChild = update(linkedData).nodeData.children?.[0];
    expect(updatedChild).toMatchObject({ id: "child", topic: "Child" });
    expect(updatedChild?.externalLink).toBeUndefined();
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

  it("does not start node dragging when the collapse control is pressed", () => {
    const context = createContext();
    const setPointerCapture = jest.fn();
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      SVGElement.prototype,
      "setPointerCapture"
    );
    Object.defineProperty(SVGElement.prototype, "setPointerCapture", {
      configurable: true,
      value: setPointerCapture,
    });

    try {
      renderMindMap(context);
      const collapseControl = screen.getByRole("button", {
        name: "Collapse Child branch",
      });

      fireEvent.pointerDown(collapseControl, { button: 0, pointerId: 7 });

      expect(collapseControl).toHaveAttribute("data-node-control", "true");
      expect(setPointerCapture).not.toHaveBeenCalled();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(
          SVGElement.prototype,
          "setPointerCapture",
          originalDescriptor
        );
      } else {
        Reflect.deleteProperty(SVGElement.prototype, "setPointerCapture");
      }
    }
  });

  it("shows the total hidden descendant count on a collapsed branch", () => {
    const context = createContext();
    context.mindmapData = {
      nodeData: {
        ...data.nodeData,
        children: data.nodeData.children?.map((node) => ({
          ...node,
          collapsed: true,
        })),
      },
    };

    renderMindMap(context);

    const count = screen.getByText("+1");
    expect(count).toHaveClass("mindmap-collapse-count");
    expect(count.previousElementSibling).toHaveAttribute("height", "16");
  });

  it("uses a muted branch color consistently across a branch", () => {
    renderMindMap();

    const edges = document.querySelectorAll(".mindmap-edge");
    const underline = document.querySelector(
      '[data-node-depth="2"] .mindmap-node-underline'
    );

    expect(edges[0]).toHaveAttribute("stroke", "#c98286");
    expect(edges[0]).toHaveAttribute("stroke-width", "3");
    expect(edges[1]).toHaveAttribute("stroke", "#b9777c");
    expect(edges[1]).toHaveAttribute("stroke-width", "2");
    expect(underline).toHaveAttribute("stroke", "#b9777c");
    expect(underline).toHaveAttribute("stroke-width", "2");
  });

  it("shows concise English actions without a duplicate guide banner", () => {
    renderMindMap();

    expect(screen.queryByText(/Double-click to edit/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Press H for pan/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Export image" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open linked mind map" })).toHaveTextContent(
      "Open card link"
    );
  });

  it("returns focus to the selected node flow after committing an edit", () => {
    const context = createContext();
    render(<StatefulMindMap context={context} />);

    fireEvent.doubleClick(screen.getByRole("button", { name: "Child" }));
    const input = screen.getByDisplayValue("Child");
    fireEvent.change(input, { target: { value: "Updated child" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const editor = screen.getByRole("application", { name: "Mind map editor" });
    expect(editor).toHaveFocus();

    fireEvent.keyDown(editor, { key: "Enter" });
    expect(screen.getByDisplayValue("New Topic")).toBeInTheDocument();
  });

  it("pastes a bullet outline as nested children of the selected node", () => {
    const context = createContext();
    context.selectedNode = data.nodeData.children?.[0] ?? null;
    renderMindMap(context);

    fireEvent.paste(screen.getByRole("application", { name: "Mind map editor" }), {
      clipboardData: {
        getData: () => "- Research\n  - Interviews\n  - Survey\n- Draft report",
      },
    });

    const update = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    const children = update(data).nodeData.children?.[0].children;

    expect(children?.map((node) => node.topic)).toEqual([
      "Grandchild",
      "Research",
      "Draft report",
    ]);
    expect(children?.[1].children?.map((node) => node.topic)).toEqual([
      "Interviews",
      "Survey",
    ]);
  });

  it("pastes a single line as a child of the selected topic", () => {
    const context = createContext();
    context.selectedNode = data.nodeData.children?.[0] ?? null;
    renderMindMap(context);

    fireEvent.paste(screen.getByRole("application", { name: "Mind map editor" }), {
      clipboardData: {
        getData: () => "Pasted reference",
      },
    });

    const update = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    expect(
      update(data).nodeData.children?.[0].children?.map((node) => node.topic)
    ).toEqual(["Grandchild", "Pasted reference"]);
  });

  it("pastes a copied MindCard topic as a child instead of a sibling", () => {
    const context = createContext();
    context.selectedNode = data.nodeData.children?.[0] ?? null;
    renderMindMap(context);

    fireEvent.paste(screen.getByRole("application", { name: "Mind map editor" }), {
      clipboardData: {
        getData: () => JSON.stringify({ id: "copied", topic: "Copied topic" }),
      },
    });

    const update = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    const updated = update(data);
    expect(updated.nodeData.children).toHaveLength(1);
    expect(
      updated.nodeData.children?.[0].children?.map((node) => node.topic)
    ).toEqual(["Grandchild", "Copied topic"]);
  });

  it("collapses and expands all descendant branches", () => {
    const context = createContext();
    renderMindMap(context);

    fireEvent.click(screen.getByRole("button", { name: "Collapse all branches" }));
    const collapseUpdate = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    expect(collapseUpdate(data).nodeData.collapsed).toBeUndefined();
    expect(collapseUpdate(data).nodeData.children?.[0].collapsed).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Expand all branches" }));
    const expandUpdate = (context.updateMindmapData as jest.Mock).mock.calls.at(-1)?.[0] as (
      current: MindmapData
    ) => MindmapData;
    expect(expandUpdate(collapseUpdate(data)).nodeData.children?.[0].collapsed).toBe(false);
  });

  it("offers visible Undo and Redo controls without losing history", () => {
    const context = createContext();
    render(<StatefulMindMap context={context} />);
    const undoButton = screen.getByRole("button", { name: "Undo last change" });
    const redoButton = screen.getByRole("button", { name: "Redo last change" });

    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Collapse Child branch" }));
    expect(screen.queryByRole("button", { name: "Grandchild" })).not.toBeInTheDocument();
    expect(undoButton).toBeEnabled();

    fireEvent.click(undoButton);
    expect(screen.getByRole("button", { name: "Grandchild" })).toBeInTheDocument();
    expect(redoButton).toBeEnabled();

    fireEvent.click(redoButton);
    expect(screen.queryByRole("button", { name: "Grandchild" })).not.toBeInTheDocument();
  });

  it("does not pan the canvas with a left-button background drag", () => {
    renderMindMap();
    const svg = screen.getByRole("img", { name: "Mind map" });
    const background = svg.querySelector("[data-canvas-background]") as SVGRectElement;
    const content = svg.querySelector("g") as SVGGElement;
    Object.defineProperty(svg, "setPointerCapture", { value: jest.fn() });

    fireEvent.pointerDown(background, {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(svg, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 220,
      clientY: 180,
    });

    expect(content).toHaveAttribute("transform", "translate(0 0) scale(1)");
  });

  it("pans the canvas with a right-button drag", () => {
    renderMindMap();
    const svg = screen.getByRole("img", { name: "Mind map" });
    const background = svg.querySelector("[data-canvas-background]") as SVGRectElement;
    const content = svg.querySelector("g") as SVGGElement;
    Object.defineProperty(svg, "setPointerCapture", { value: jest.fn() });
    Object.defineProperty(svg, "releasePointerCapture", { value: jest.fn() });

    fireEvent.pointerDown(background, {
      button: 2,
      pointerId: 2,
      pointerType: "mouse",
      clientX: 100,
      clientY: 100,
    });
    expect(svg).toHaveClass("is-panning");

    fireEvent.pointerMove(svg, {
      button: 2,
      pointerId: 2,
      pointerType: "mouse",
      clientX: 160,
      clientY: 140,
    });

    expect(content).not.toHaveAttribute("transform", "translate(0 0) scale(1)");

    fireEvent.pointerUp(svg, {
      button: 2,
      pointerId: 2,
      pointerType: "mouse",
      clientX: 160,
      clientY: 140,
    });
    expect(svg).not.toHaveClass("is-panning");
  });

  it("suppresses the browser context menu anywhere on the canvas", () => {
    renderMindMap();
    const svg = screen.getByRole("img", { name: "Mind map" });
    const background = svg.querySelector("[data-canvas-background]") as SVGRectElement;

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    background.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("offers a temporary pan mode that returns to selection with Escape", () => {
    renderMindMap();
    const svg = screen.getByRole("img", { name: "Mind map" });
    const topic = screen.getByRole("button", { name: "Child" });
    const panMode = screen.getByRole("button", { name: "Enable pan mode" });
    Object.defineProperty(svg, "setPointerCapture", { value: jest.fn() });
    Object.defineProperty(svg, "releasePointerCapture", { value: jest.fn() });

    fireEvent.click(panMode);
    expect(panMode).toHaveAttribute("aria-pressed", "true");
    expect(svg).toHaveClass("is-pan-mode");

    fireEvent.pointerDown(topic, {
      button: 0,
      pointerId: 12,
      pointerType: "mouse",
      clientX: 100,
      clientY: 100,
    });
    expect(svg).toHaveClass("is-panning");
    fireEvent.pointerUp(svg, {
      button: 0,
      pointerId: 12,
      pointerType: "mouse",
      clientX: 100,
      clientY: 100,
    });

    fireEvent.keyDown(screen.getByRole("application", { name: "Mind map editor" }), {
      key: "Escape",
    });
    expect(panMode).toHaveAttribute("aria-pressed", "false");
    expect(svg).not.toHaveClass("is-pan-mode");
  });

  it("starts right-button canvas panning from a topic without opening its menu", () => {
    renderMindMap();
    const svg = screen.getByRole("img", { name: "Mind map" });
    const topic = screen.getByRole("button", { name: "Child" });
    const content = svg.querySelector("g") as SVGGElement;
    Object.defineProperty(svg, "setPointerCapture", { value: jest.fn() });
    Object.defineProperty(svg, "releasePointerCapture", { value: jest.fn() });

    fireEvent.pointerDown(topic, {
      button: 2,
      pointerId: 3,
      pointerType: "mouse",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(svg, {
      button: 2,
      pointerId: 3,
      pointerType: "mouse",
      clientX: 150,
      clientY: 125,
    });
    fireEvent.pointerUp(svg, {
      button: 2,
      pointerId: 3,
      pointerType: "mouse",
      clientX: 150,
      clientY: 125,
    });
    fireEvent.contextMenu(topic, { clientX: 150, clientY: 125 });

    expect(content).not.toHaveAttribute("transform", "translate(0 0) scale(1)");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("selects multiple topics with a left-button marquee drag", () => {
    renderMindMap();
    const svg = screen.getByRole("img", { name: "Mind map" });
    const background = svg.querySelector("[data-canvas-background]") as SVGRectElement;
    const [, , viewBoxWidth, viewBoxHeight] = (svg.getAttribute("viewBox") ?? "")
      .split(" ")
      .map(Number);
    Object.defineProperty(svg, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        right: viewBoxWidth,
        bottom: viewBoxHeight,
        width: viewBoxWidth,
        height: viewBoxHeight,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperty(svg, "setPointerCapture", { value: jest.fn() });
    Object.defineProperty(svg, "releasePointerCapture", { value: jest.fn() });

    fireEvent.pointerDown(background, {
      button: 0,
      pointerId: 4,
      pointerType: "mouse",
      clientX: 1,
      clientY: 1,
    });
    fireEvent.pointerMove(svg, {
      button: 0,
      pointerId: 4,
      pointerType: "mouse",
      clientX: viewBoxWidth - 1,
      clientY: viewBoxHeight - 1,
    });

    expect(svg).toHaveClass("is-selecting");
    expect(document.querySelectorAll(".mindmap-node-selection")).toHaveLength(2);
    expect(document.querySelector(".mindmap-root-shape")).toHaveClass(
      "is-selected"
    );

    fireEvent.pointerUp(svg, {
      button: 0,
      pointerId: 4,
      pointerType: "mouse",
      clientX: viewBoxWidth - 1,
      clientY: viewBoxHeight - 1,
    });
    expect(svg).not.toHaveClass("is-selecting");
  });

  it("supports additive node selection with Ctrl or Command click", () => {
    const context = createContext();
    render(<StatefulMindMap context={context} />);

    fireEvent.click(screen.getByRole("button", { name: "Child" }));
    fireEvent.click(screen.getByRole("button", { name: "Grandchild" }), {
      ctrlKey: true,
    });

    expect(document.querySelectorAll(".mindmap-node-selection")).toHaveLength(2);
  });

  it("keeps a multi-selection after dragging the selected topics", () => {
    const context = createContext();
    render(<StatefulMindMap context={context} />);

    fireEvent.click(screen.getByRole("button", { name: "Child" }));
    fireEvent.click(screen.getByRole("button", { name: "Grandchild" }), {
      ctrlKey: true,
    });
    const child = screen.getByRole("button", { name: "Child" });
    Object.defineProperty(child, "setPointerCapture", { value: jest.fn() });
    Object.defineProperty(child, "releasePointerCapture", { value: jest.fn() });

    fireEvent.pointerDown(child, {
      button: 0,
      pointerId: 5,
      pointerType: "mouse",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(child, {
      button: 0,
      pointerId: 5,
      pointerType: "mouse",
      clientX: 130,
      clientY: 125,
    });
    fireEvent.pointerUp(child, {
      button: 0,
      pointerId: 5,
      pointerType: "mouse",
      clientX: 130,
      clientY: 125,
    });
    fireEvent.click(child);

    expect(document.querySelectorAll(".mindmap-node-selection")).toHaveLength(2);
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

  it("does not duplicate navigation export actions on the canvas", () => {
    const context = createContext();
    renderMindMap(context);

    expect(
      screen.queryByRole("button", { name: "Export image" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Export Markdown" })
    ).not.toBeInTheDocument();
    expect(context.exportMindMap).not.toHaveBeenCalled();
  });

  it("provides a dedicated control to center the map", () => {
    renderMindMap();

    expect(
      screen.getByRole("button", { name: "Center map" })
    ).toBeInTheDocument();
  });

  it("allows zooming beyond 250 percent for large maps", () => {
    renderMindMap();
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });

    for (let index = 0; index < 20; index += 1) {
      fireEvent.click(zoomIn);
    }

    expect(screen.getByText("300%")).toBeInTheDocument();
  });

  it("switches to Markdown editing and syncs valid changes to the mind map", () => {
    const context = createContext();
    render(<StatefulMindMap context={context} />);

    fireEvent.click(screen.getByRole("button", { name: "Markdown mode" }));
    const editor = screen.getByRole("textbox", { name: "Mind map Markdown" });
    expect(editor).toHaveValue(
      "# Root\n## Child\n### Grandchild\n"
    );

    fireEvent.change(editor, {
      target: {
        value: "# Updated root\n## First branch\n### Nested topic\n",
      },
    });
    expect(context.updateMindmapData).toHaveBeenCalledWith(expect.any(Function));

    fireEvent.click(screen.getByRole("button", { name: "Mind map mode" }));
    expect(screen.getByRole("button", { name: "Updated root" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "First branch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nested topic" })).toBeInTheDocument();
  });

  it("edits Markdown beside a live mind map in split view", () => {
    const context = createContext();
    render(<StatefulMindMap context={context} />);

    fireEvent.click(screen.getByRole("button", { name: "Split view mode" }));

    const editor = screen.getByRole("textbox", { name: "Mind map Markdown" });
    expect(editor).toHaveValue("# Root\n## Child\n### Grandchild\n");
    expect(screen.getByRole("img", { name: "Mind map" })).toBeInTheDocument();

    fireEvent.change(editor, {
      target: {
        value: "# Product plan\n## Research\n### Interview users\n## Build\n",
      },
    });

    expect(screen.getByRole("button", { name: "Product plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Research" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Interview users" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Build" })).toBeInTheDocument();
  });

  it("keeps the last valid map when Markdown is temporarily incomplete", () => {
    const context = createContext();
    render(<StatefulMindMap context={context} />);

    fireEvent.click(screen.getByRole("button", { name: "Markdown mode" }));
    const editor = screen.getByRole("textbox", { name: "Mind map Markdown" });
    fireEvent.change(editor, { target: { value: "## Missing root" } });

    expect(screen.getByText(/Start with a level-one/)).toHaveTextContent(/root/i);
    expect(context.updateMindmapData).not.toHaveBeenCalled();
  });

  it("does not flash the previous mind map while a new route is loading", () => {
    const context = createContext();
    context.currentMindmapId = "previous-map";

    renderMindMap(context);

    expect(screen.queryByRole("button", { name: "Root" })).not.toBeInTheDocument();
    expect(screen.getByText("Loading mind map…")).toBeInTheDocument();
  });
});
