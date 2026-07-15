import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import MindMapList from "./MindMapList";
import type { MindmapListItem } from "@/lib/types";

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
let mockPage = "2";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
  useSearchParams: () => ({
    get: (name: string) => (name === "page" ? mockPage : null),
  }),
}));

jest.mock("./SweetAlert", () => jest.fn());

const mindMaps: MindmapListItem[] = Array.from({ length: 45 }, (_, index) => ({
  id: `map-${index + 1}`,
  title: `Map ${index + 1}`,
  description: `Updated Jul ${index + 1}, 2026 · 3:51 PM`,
  createdAt: null,
  isPublic: index === 20,
}));

describe("MindMapList pagination", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPage = "2";
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders a loading indicator instead of the empty state while loading", () => {
    render(
      <MindMapList
        mindMaps={[]}
        isLoading
        onMindMapCreate={jest.fn()}
        onDeleteMindMap={jest.fn()}
        onTogglePublic={jest.fn()}
        onCopyPublicLink={jest.fn()}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading mind maps");
    expect(screen.getByTestId("mindmap-loader-graphic")).toBeInTheDocument();
    expect(screen.queryByText("No mind maps found")).not.toBeInTheDocument();
  });

  it("sorts by creation time by default and can switch to last updated time", () => {
    mockPage = "1";
    const sortableMindMaps: MindmapListItem[] = [
      {
        ...mindMaps[0],
        id: "older-map",
        title: "Older map",
        createdAt: { seconds: 100 } as never,
        updatedAt: { seconds: 500 } as never,
      },
      {
        ...mindMaps[1],
        id: "newest-map",
        title: "Newest map",
        createdAt: { seconds: 300 } as never,
        updatedAt: { seconds: 350 } as never,
      },
      {
        ...mindMaps[2],
        id: "middle-map",
        title: "Middle map",
        createdAt: { seconds: 200 } as never,
        updatedAt: null,
      },
    ];

    render(
      <MindMapList
        mindMaps={sortableMindMaps}
        onMindMapCreate={jest.fn()}
        onDeleteMindMap={jest.fn()}
        onTogglePublic={jest.fn()}
        onCopyPublicLink={jest.fn()}
      />
    );

    const sortControl = screen.getByRole("combobox", {
      name: "Sort mind maps by",
    });
    const openMapNames = () =>
      screen
        .getAllByRole("button", { name: /^Open / })
        .map((button) => button.getAttribute("aria-label"));

    expect(sortControl).toHaveValue("created");
    expect(openMapNames()).toEqual([
      "Open Newest map",
      "Open Middle map",
      "Open Older map",
    ]);

    fireEvent.change(sortControl, { target: { value: "updated" } });

    expect(openMapNames()).toEqual([
      "Open Older map",
      "Open Newest map",
      "Open Middle map",
    ]);
  });

  it("keeps a stable paginated grid while moving from a full page to a shorter page", () => {
    render(
      <MindMapList
        mindMaps={mindMaps}
        onMindMapCreate={jest.fn()}
        onDeleteMindMap={jest.fn()}
        onTogglePublic={jest.fn()}
        onCopyPublicLink={jest.fn()}
      />
    );

    const grid = screen.getByTestId("mindmap-list-grid");
    expect(grid).toHaveClass("mindmap-list-grid", "is-paginated");
    expect(screen.getByText("Map 21")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New mind map" })).toBeInTheDocument();
    expect(screen.getByText("Updated Jul 21, 2026 · 3:51 PM")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(grid).toHaveAttribute("aria-busy", "true");
    expect(grid).toHaveClass("is-transitioning");

    act(() => {
      jest.advanceTimersByTime(180);
    });

    expect(screen.getByText("Map 41")).toBeInTheDocument();
    expect(screen.getByText("Map 45")).toBeInTheDocument();
    expect(screen.queryByText("Map 21")).not.toBeInTheDocument();
    expect(grid).toHaveClass("mindmap-list-grid", "is-paginated");
    expect(grid).toHaveAttribute("aria-busy", "false");
    expect(mockRouterPush).toHaveBeenCalledWith("/mindmap/?page=3");
  });

  it("returns to the last available page when the current page becomes empty", () => {
    const props = {
      onMindMapCreate: jest.fn(),
      onDeleteMindMap: jest.fn(),
      onTogglePublic: jest.fn(),
      onCopyPublicLink: jest.fn(),
    };
    const view = render(<MindMapList mindMaps={mindMaps} {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Go to page 3" }));
    act(() => {
      jest.advanceTimersByTime(180);
    });
    expect(screen.getByText("Map 41")).toBeInTheDocument();

    view.rerender(<MindMapList mindMaps={mindMaps.slice(0, 40)} {...props} />);

    expect(screen.getByText("Map 21")).toBeInTheDocument();
    expect(screen.queryByText("No mind maps found")).not.toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(mockRouterReplace).toHaveBeenCalledWith("/mindmap/?page=2");
  });

  it("shows public sharing state and keeps share actions inside the folder", () => {
    const onTogglePublic = jest.fn();
    const onCopyPublicLink = jest.fn();
    render(
      <MindMapList
        mindMaps={mindMaps}
        onMindMapCreate={jest.fn()}
        onDeleteMindMap={jest.fn()}
        onTogglePublic={onTogglePublic}
        onCopyPublicLink={onCopyPublicLink}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy public link for Map 21" }));
    fireEvent.click(screen.getByRole("button", { name: "Make Map 21 private" }));
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Make Map 21 private" }),
      { key: "Enter" }
    );

    expect(onCopyPublicLink).toHaveBeenCalledWith("map-21");
    expect(onTogglePublic).toHaveBeenCalledWith("map-21", false);
    expect(mockRouterPush).not.toHaveBeenCalledWith("/mindmap/map-21");
  });
});
