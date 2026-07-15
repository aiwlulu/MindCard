import React from "react";
import RootLayout from "./layout";

jest.mock("./globals.css", () => ({}));
jest.mock("./head", () => () => null);
jest.mock("@/components/ToastProvider", () => () => null);
jest.mock("@/components/Navigation", () => () => null);
jest.mock("@/lib/store/auth-context", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/lib/store/mindmap-context", () => ({
  MindmapProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

describe("RootLayout", () => {
  it("declares smooth scroll behavior for Next.js route transitions", () => {
    const layout = RootLayout({
      children: <main>Content</main>,
    }) as React.ReactElement<{ "data-scroll-behavior"?: string }>;

    expect(layout.props["data-scroll-behavior"]).toBe("smooth");
  });
});
