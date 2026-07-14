import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Card from "./Card";
import SweetAlert from "./SweetAlert";
import { MindmapContext } from "@/lib/store/mindmap-context";
import { toast } from "react-toastify";
import type { MindmapContextValue } from "@/lib/types";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn().mockResolvedValue(true),
  })),
}));

toast.error = jest.fn();

const mockContext: Pick<
  MindmapContextValue,
  "getAllMindmaps" | "selectedNode" | "setSelectedNode"
> & Omit<MindmapContextValue, "getAllMindmaps" | "selectedNode" | "setSelectedNode"> = {
  getAllMindmaps: jest.fn(),
  selectedNode: null,
  setSelectedNode: jest.fn(),
  mindmapData: null,
  updateMindmapData: jest.fn(),
  saveMindmap: jest.fn(),
  loadMindmap: jest.fn(),
  currentMindmapId: null,
  setCurrentMindmapId: jest.fn(),
  currentMindmapTitle: null,
  updateNodeHyperlink: jest.fn(),
  exportMindMap: jest.fn(),
};

jest.mock("./SweetAlert", () => jest.fn());

describe("Card", () => {
  beforeEach(() => {
    (SweetAlert as jest.Mock).mockClear();
    (mockContext.setSelectedNode as jest.Mock).mockClear();
  });

  it("renders without mindmaps and shows default message", async () => {
    (mockContext.getAllMindmaps as jest.Mock).mockResolvedValueOnce([]);
    await act(async () => {
      render(
        <MindmapContext.Provider value={mockContext as MindmapContextValue}>
          <Card currentMindmapId="test-id" removeHyperlink={jest.fn()} />
        </MindmapContext.Provider>
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Cards" }));
    expect(
      screen.getByText("No other mind maps are available to link.")
    ).toBeInTheDocument();
  });

  it("shows card instructions in English", async () => {
    (mockContext.getAllMindmaps as jest.Mock).mockResolvedValueOnce([]);
    await act(async () => {
      render(
        <MindmapContext.Provider value={mockContext as MindmapContextValue}>
          <Card currentMindmapId="test-id" removeHyperlink={jest.fn()} />
        </MindmapContext.Provider>
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Cards" }));
    fireEvent.click(screen.getByRole("button", { name: "Card instructions" }));

    expect(
      screen.getByText(/Select a node, then drag a card onto the canvas/)
    ).toBeInTheDocument();
  });

  it("closes the card picker after a link is completed", async () => {
    (mockContext.getAllMindmaps as jest.Mock).mockResolvedValue([]);
    const { rerender } = await act(async () =>
      render(
        <MindmapContext.Provider value={mockContext as MindmapContextValue}>
          <Card
            currentMindmapId="test-id"
            removeHyperlink={jest.fn()}
            linkCompletedVersion={0}
          />
        </MindmapContext.Provider>
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Cards" }));
    expect(
      screen.getByText("No other mind maps are available to link.")
    ).toBeInTheDocument();

    rerender(
      <MindmapContext.Provider value={mockContext as MindmapContextValue}>
        <Card
          currentMindmapId="test-id"
          removeHyperlink={jest.fn()}
          linkCompletedVersion={1}
        />
      </MindmapContext.Provider>
    );

    expect(screen.getByRole("button", { name: "Cards" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(
      screen.queryByText("No other mind maps are available to link.")
    ).not.toBeInTheDocument();
  });

  it("keeps the topic selected and closes Cards after removing a link", async () => {
    (mockContext.getAllMindmaps as jest.Mock).mockResolvedValue([]);
    const removeHyperlink = jest.fn();
    const context = {
      ...mockContext,
      selectedNode: { id: "node-1", topic: "Linked topic" },
    } as MindmapContextValue;

    await act(async () => {
      render(
        <MindmapContext.Provider value={context}>
          <Card
            currentMindmapId="test-id"
            removeHyperlink={removeHyperlink}
          />
        </MindmapContext.Provider>
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Cards" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove link" }));
    const confirmation = (SweetAlert as jest.Mock).mock.calls[0][0] as {
      onConfirm: () => void;
    };
    act(() => confirmation.onConfirm());

    expect(removeHyperlink).toHaveBeenCalledTimes(1);
    expect(context.setSelectedNode).not.toHaveBeenCalledWith(null);
    expect(screen.getByRole("button", { name: "Cards" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
});
