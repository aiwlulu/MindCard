import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ShortcutGuide from "./ShortcutGuide";

describe("ShortcutGuide", () => {
  it("shows shortcut descriptions in English", () => {
    render(<ShortcutGuide />);

    fireEvent.click(screen.getByRole("button", { name: "Shortcuts" }));

    expect(screen.getByText("Add sibling topic")).toBeInTheDocument();
    expect(screen.getByText("Collapse or expand branch")).toBeInTheDocument();
    expect(screen.getByText("Center map")).toBeInTheDocument();
    expect(screen.getByText("Select multiple topics")).toBeInTheDocument();
    expect(screen.getByText("Move below target")).toBeInTheDocument();
    expect(screen.getByText("Create child branches")).toBeInTheDocument();
    expect(screen.getByText("Pan canvas")).toBeInTheDocument();
    expect(screen.getByText("Move between siblings")).toBeInTheDocument();
    expect(screen.getByText("Move to parent or first child")).toBeInTheDocument();
  });
});
