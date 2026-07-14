import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "./page";
import { authContext } from "@/lib/store/auth-context";

const mockRouterPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("@/components/Authentication", () => function MockAuthentication() {
  return <div id="get-started">Authentication form</div>;
});

const anonymousAuth = {
  user: null,
  loading: false,
  googleLoginHandler: jest.fn(),
  registerWithEmailAndPassword: jest.fn(),
  loginWithEmailAndPassword: jest.fn(),
  logout: jest.fn(),
};

describe("MindCard landing page", () => {
  beforeEach(() => mockRouterPush.mockReset());

  it("shows the product promise, primary CTA, and animated proof", () => {
    render(
      <authContext.Provider value={anonymousAuth}>
        <Home />
      </authContext.Provider>
    );

    expect(
      screen.getByRole("heading", { name: "Turn thought into structure." })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start mapping" })).toHaveAttribute(
      "href",
      "#get-started"
    );
    expect(
      screen.getByRole("img", {
        name: "MindCard turns Markdown into a live mind map",
      })
    ).toHaveAttribute("src", expect.stringContaining("mindcard-product-demo.gif"));
    expect(screen.getByText("Authentication form")).toBeInTheDocument();
  });
});
