import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import PublicMindMapViewer from "./PublicMindMapViewer";

describe("PublicMindMapViewer", () => {
  it("renders a collapsible read-only map without Markdown or private card links", () => {
    render(
      <PublicMindMapViewer
        root={{
          id: "root",
          root: true,
          topic: "Public plan",
          children: [
            {
              id: "child",
              topic: "Research",
              hyperLink: "private-map",
              externalLink: "https://example.com",
              children: [{ id: "grandchild", topic: "Interview users" }],
            },
          ],
        }}
      />
    );

    expect(screen.getByRole("img", { name: "Public mind map: Public plan" })).toBeInTheDocument();
    expect(screen.getByText("Interview users")).toBeInTheDocument();
    expect(screen.queryByText(/Open linked mind map/)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Markdown/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open external link for Research" })).toHaveAttribute(
      "target",
      "_blank"
    );

    fireEvent.click(screen.getByRole("button", { name: "Collapse Research branch" }));
    expect(screen.queryByText("Interview users")).not.toBeInTheDocument();
  });
});
