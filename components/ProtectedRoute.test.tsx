import React from "react";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute";
import { authContext } from "@/lib/store/auth-context";

const mockRouterPush = jest.fn();
let mockPathname = "/";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("./Authentication", () => function MockAuthentication() {
  return <div>Authentication form</div>;
});

jest.mock("@/app/loading", () => function MockLoading() {
  return <div>Loading</div>;
});

const anonymousAuth = {
  user: null,
  loading: false,
  googleLoginHandler: jest.fn(),
  registerWithEmailAndPassword: jest.fn(),
  loginWithEmailAndPassword: jest.fn(),
  logout: jest.fn(),
};

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockPathname = "/";
    mockRouterPush.mockReset();
  });

  it("lets signed-out visitors view the landing page", () => {
    render(
      <authContext.Provider value={anonymousAuth}>
        <ProtectedRoute>
          <div>Public landing</div>
        </ProtectedRoute>
      </authContext.Provider>
    );

    expect(screen.getByText("Public landing")).toBeInTheDocument();
    expect(screen.queryByText("Authentication form")).not.toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("continues to protect the private editor", () => {
    mockPathname = "/mindmap";
    render(
      <authContext.Provider value={anonymousAuth}>
        <ProtectedRoute>
          <div>Private editor</div>
        </ProtectedRoute>
      </authContext.Provider>
    );

    expect(screen.getByText("Authentication form")).toBeInTheDocument();
    expect(screen.queryByText("Private editor")).not.toBeInTheDocument();
    expect(mockRouterPush).toHaveBeenCalledWith("/");
  });
});
