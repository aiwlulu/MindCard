import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Card from "./Card";
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
  it("renders without mindmaps and shows default message", async () => {
    (mockContext.getAllMindmaps as jest.Mock).mockResolvedValueOnce([]);
    await act(async () => {
      render(
        <MindmapContext.Provider value={mockContext as MindmapContextValue}>
          <Card currentMindmapId="test-id" removeHyperlink={jest.fn()} />
        </MindmapContext.Provider>
      );
    });

    fireEvent.click(screen.getByText("Card"));
    expect(
      screen.getByText(
        "This area will display your mind maps but does not include the current file."
      )
    ).toBeInTheDocument();
  });
});
