import React from "react";
import { render, act, screen, fireEvent } from "@testing-library/react";
import AutoSaveToggle from "./AutoSaveToggle";
import { MindmapContext } from "@/lib/store/mindmap-context";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn().mockResolvedValue(true),
  })),
}));

const mockSaveMindmap = jest.fn().mockResolvedValue();

beforeEach(() => {
  jest.useFakeTimers();
  mockSaveMindmap.mockClear();
});

describe("AutoSaveToggle", () => {
  it("toggles autoSave state and calls saveMindmap", () => {
    render(
      <MindmapContext.Provider value={{ saveMindmap: mockSaveMindmap }}>
        <AutoSaveToggle />
      </MindmapContext.Provider>
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(mockSaveMindmap).toHaveBeenCalled();
  });
});
