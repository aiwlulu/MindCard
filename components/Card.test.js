import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Card from "./Card";
import { MindmapContext } from "@/lib/store/mindmap-context";
import { toast } from "react-toastify";
import { act } from "react-dom/test-utils";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn().mockResolvedValue(true),
  })),
}));

toast.error = jest.fn();

const mockContext = {
  getAllMindmaps: jest.fn(),
  selectedNode: null,
  setSelectedNode: jest.fn(),
};

jest.mock("./SweetAlert", () => jest.fn());

describe("Card", () => {
  it("renders without mindmaps and shows default message", async () => {
    mockContext.getAllMindmaps.mockResolvedValueOnce([]);
    await act(async () => {
      render(
        <MindmapContext.Provider value={mockContext}>
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
