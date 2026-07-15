import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Navigation from "./Navigation";
import { authContext } from "@/lib/store/auth-context";
import { MindmapContext } from "@/lib/store/mindmap-context";
import type { MindmapContextValue } from "@/lib/types";

let mockPathname = "/mindmap/map-1";
const mockRouterPush = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

jest.mock("next/dynamic", () => () => () => null);

describe("Navigation save shortcut ownership", () => {
  beforeEach(() => {
    mockPathname = "/mindmap/map-1";
    mockRouterPush.mockReset();
  });

  it("does not register a second global Ctrl+S handler", () => {
    const saveMindmap = jest.fn().mockResolvedValue(undefined);
    const context = {
      saveMindmap,
      exportMindMap: jest.fn(),
    } as unknown as MindmapContextValue;

    render(
      <authContext.Provider
        value={
          {
            user: { uid: "user-1", displayName: "Lulu" },
            loading: false,
            logout: jest.fn(),
          } as never
        }
      >
        <MindmapContext.Provider value={context}>
          <Navigation />
        </MindmapContext.Provider>
      </authContext.Provider>
    );

    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    expect(saveMindmap).not.toHaveBeenCalled();
  });

  it("loads the above-the-fold logo eagerly", () => {
    const context = {
      saveMindmap: jest.fn(),
      exportMindMap: jest.fn(),
    } as unknown as MindmapContextValue;

    render(
      <authContext.Provider
        value={
          {
            user: null,
            loading: false,
            logout: jest.fn(),
          } as never
        }
      >
        <MindmapContext.Provider value={context}>
          <Navigation />
        </MindmapContext.Provider>
      </authContext.Provider>
    );

    expect(screen.getByAltText("MindCard logo")).toHaveAttribute(
      "loading",
      "eager"
    );
  });

  it("hides account and private workspace actions on public share routes", () => {
    mockPathname = "/share/public-map";
    const context = {
      saveMindmap: jest.fn(),
      exportMindMap: jest.fn(),
    } as unknown as MindmapContextValue;

    render(
      <authContext.Provider
        value={
          {
            user: { uid: "user-1", displayName: "Lulu" },
            loading: false,
            logout: jest.fn(),
          } as never
        }
      >
        <MindmapContext.Provider value={context}>
          <Navigation />
        </MindmapContext.Provider>
      </authContext.Provider>
    );

    expect(screen.getByText("MindCard")).toBeInTheDocument();
    expect(screen.queryByText(/Hi, Lulu/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sign out/i })).not.toBeInTheDocument();
  });

  it("returns public visitors directly to the landing page from the brand", () => {
    mockPathname = "/share/public-map";
    const context = {
      saveMindmap: jest.fn(),
      exportMindMap: jest.fn(),
    } as unknown as MindmapContextValue;

    render(
      <authContext.Provider
        value={
          {
            user: null,
            loading: false,
            logout: jest.fn(),
          } as never
        }
      >
        <MindmapContext.Provider value={context}>
          <Navigation />
        </MindmapContext.Provider>
      </authContext.Provider>
    );

    fireEvent.click(screen.getByText("MindCard"));
    expect(mockRouterPush).toHaveBeenCalledWith("/");
    expect(mockRouterPush).not.toHaveBeenCalledWith("/mindmap");
  });
});
