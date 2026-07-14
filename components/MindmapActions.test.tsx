import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MindmapActions from "./MindmapActions";

beforeAll(() => {
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
});

describe("MindmapActions", () => {
  it("exports PNG from the navigation menu", async () => {
    const onExport = jest.fn();
    render(
      <MindmapActions
        onSave={jest.fn()}
        onNavigateToMindmap={jest.fn()}
        onExport={onExport}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Export as PNG" })
    );

    expect(onExport).toHaveBeenCalledWith("png");
  });
});
