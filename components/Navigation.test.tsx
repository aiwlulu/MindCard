import React from "react";
import { fireEvent, render } from "@testing-library/react";
import Navigation from "./Navigation";
import { authContext } from "@/lib/store/auth-context";
import { MindmapContext } from "@/lib/store/mindmap-context";
import type { MindmapContextValue } from "@/lib/types";

jest.mock("next/navigation", () => ({
  usePathname: () => "/mindmap/map-1",
  useRouter: () => ({ push: jest.fn() }),
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
});
