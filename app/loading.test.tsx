import React from "react";
import { render, screen } from "@testing-library/react";
import Loading from "./loading";

describe("Route loading state", () => {
  it("uses the branded mind map animation instead of the legacy bar loader", () => {
    render(<Loading />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Preparing your workspace"
    );
    expect(screen.getByTestId("mindmap-loader-graphic")).toBeInTheDocument();
  });

  it("starts a repeating SVG motion cue immediately", () => {
    render(<Loading />);

    const graphic = screen.getByTestId("mindmap-loader-graphic");
    const motion = graphic.querySelector("animateMotion");
    expect(motion).toBeInTheDocument();
    expect(motion).toHaveAttribute("repeatCount", "indefinite");
  });
});
