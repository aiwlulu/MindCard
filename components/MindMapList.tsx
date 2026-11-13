"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SweetAlert from "./SweetAlert";
import debounce from "@/lib/utils/debounce";
import SearchBar from "./SearchBar";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  CopyIcon,
  GlobeIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "./Icons";
import MindMapLoader from "./MindMapLoader";
import { getBranchColor, MAP_PALETTES } from "@/lib/mindmap/colors";
import { useTheme } from "@/lib/store/theme-context";
import type { ResolvedTheme } from "@/lib/theme";
import type { MindmapListItem } from "@/lib/types";

type MindMapSortMode = "created" | "updated";
const SEARCH_STORAGE_KEY = "mindcard:mindmap-search";

const readStoredSearch = (): string => {
  if (typeof window === "undefined") return "";

  try {
    return window.sessionStorage.getItem(SEARCH_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

const writeStoredSearch = (searchTerm: string): void => {
  if (typeof window === "undefined") return;

  try {
    if (searchTerm) {
      window.sessionStorage.setItem(SEARCH_STORAGE_KEY, searchTerm);
    } else {
      window.sessionStorage.removeItem(SEARCH_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable in private browsing contexts.
  }
};

const getSortTime = (
  map: MindmapListItem,
  sortMode: MindMapSortMode
): number => {
  const timestamp =
    sortMode === "updated" ? map.updatedAt ?? map.createdAt : map.createdAt;

  if (!timestamp) return Number.NEGATIVE_INFINITY;
  return (
    timestamp.seconds * 1000 + (timestamp.nanoseconds ?? 0) / 1_000_000
  );
};

interface MindMapListProps {
  mindMaps: MindmapListItem[];
  isLoading?: boolean;
  onMindMapCreate: () => void;
  onDeleteMindMap: (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
  onCopyPublicLink: (id: string) => void;
}

function MindMapList({
  mindMaps,
  isLoading = false,
  onMindMapCreate,
  onDeleteMindMap,
  onTogglePublic,
  onCopyPublicLink,
}: MindMapListProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const routePage = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const [page, setPage] = useState({ selected: routePage, fromRoute: routePage });
  // A new ?page= value wins over the locally selected page.
  if (page.fromRoute !== routePage) {
    setPage({ selected: routePage, fromRoute: routePage });
  }
  const setCurrentPage = (pageNumber: number) =>
    setPage({ selected: pageNumber, fromRoute: routePage });
  const [searchTerm, setSearchTerm] = useState(readStoredSearch);
  const [sortMode, setSortMode] = useState<MindMapSortMode>("created");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pageTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapsPerPage = 20;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  useEffect(() => writeStoredSearch(searchTerm), [searchTerm]);

  useEffect(
    () => () => {
      if (pageTransitionTimer.current) {
        clearTimeout(pageTransitionTimer.current);
      }
    },
    []
  );

  const filteredMindMaps = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = normalizedSearch
      ? mindMaps.filter((map) =>
          map.title.toLowerCase().includes(normalizedSearch)
        )
      : mindMaps;

    return [...filtered].sort((first, second) => {
      const selectedTimeDifference =
        getSortTime(second, sortMode) - getSortTime(first, sortMode);
      if (selectedTimeDifference !== 0) return selectedTimeDifference;

      const createdTimeDifference =
        getSortTime(second, "created") - getSortTime(first, "created");
      if (createdTimeDifference !== 0) return createdTimeDifference;

      return first.title.localeCompare(second.title);
    });
  }, [mindMaps, searchTerm, sortMode]);

  const totalPages = Math.ceil(filteredMindMaps.length / mapsPerPage);
  const publicCount = mindMaps.filter((map) => map.isPublic).length;
  const lastAvailablePage = Math.max(1, totalPages);
  // Shrinking results can strand the selected page past the end of the list.
  const currentPage = Math.min(page.selected, lastAvailablePage);

  useEffect(() => {
    if (page.selected <= lastAvailablePage) return;
    router.replace(`/mindmap/?page=${lastAvailablePage}`);
  }, [lastAvailablePage, page.selected, router]);

  const handleMindMapSelect = (id: string) => {
    router.push(`/mindmap/${id}`);
  };

  const handleDelete = (id: string) => {
    void SweetAlert({
      title: "Delete this mind map?",
      text: "This removes the map and its public link. This cannot be undone.",
      icon: "warning",
      confirmButtonText: "Delete map",
      onConfirm: () => onDeleteMindMap(id),
    });
  };

  const handleCreate = debounce(() => {
    onMindMapCreate();
  }, 300);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortMode(event.target.value as MindMapSortMode);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber === currentPage) return;
    setIsTransitioning(true);
    if (pageTransitionTimer.current) {
      clearTimeout(pageTransitionTimer.current);
    }
    pageTransitionTimer.current = setTimeout(() => {
      setCurrentPage(pageNumber);
      router.push(`/mindmap/?page=${pageNumber}`);
      setIsTransitioning(false);
      pageTransitionTimer.current = null;
    }, 180);
  };

  const indexOfLastMap = currentPage * mapsPerPage;
  const indexOfFirstMap = indexOfLastMap - mapsPerPage;
  const currentMaps = filteredMindMaps.slice(indexOfFirstMap, indexOfLastMap);

  const renderPageNumbers = () => {
    const pageNumbers: React.ReactNode[] = [];
    const maxPageNumbersToShow = 5;
    const ellipsis = "…";

    const pageBtn = (i: number) => (
      <button
        key={i}
        aria-current={currentPage === i ? "page" : undefined}
        aria-label={`Go to page ${i}`}
        className={currentPage === i ? "is-current" : undefined}
        onClick={() => handlePageChange(i)}
      >
        {i}
      </button>
    );

    if (totalPages <= maxPageNumbersToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(pageBtn(i));
    } else {
      const startPage = Math.max(currentPage - 2, 1);
      const endPage = Math.min(currentPage + 2, totalPages);

      if (startPage > 1) {
        pageNumbers.push(pageBtn(1));
        if (startPage > 2) {
          pageNumbers.push(
            <span key="start-ellipsis" className="mindmap-pagination-ellipsis" aria-hidden="true">
              {ellipsis}
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) pageNumbers.push(pageBtn(i));

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <span key="end-ellipsis" className="mindmap-pagination-ellipsis" aria-hidden="true">
              {ellipsis}
            </span>
          );
        }
        pageNumbers.push(pageBtn(totalPages));
      }
    }

    return pageNumbers;
  };

  return (
    <main className="mindmap-library page-frame">
      <header className="mindmap-library-header">
        <div>
          <p>Your workspace</p>
          <h1>Mind maps</h1>
          <span>
            {isLoading
              ? "Loading maps…"
              : `${mindMaps.length} ${mindMaps.length === 1 ? "map" : "maps"}${
                  publicCount ? ` · ${publicCount} public` : ""
                }`}
          </span>
        </div>
        <button className="mindmap-library-new" onClick={handleCreate}>
          <PlusIcon size={16} />
          New mind map
        </button>
      </header>

      <div className="mindmap-library-tools">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
        />
        <div className="mindmap-library-tools-meta">
          {searchTerm ? (
            <span aria-live="polite">
              {`${filteredMindMaps.length} result${filteredMindMaps.length === 1 ? "" : "s"}`}
            </span>
          ) : null}
          <label className="mindmap-library-sort">
            <span>Sort by</span>
            <select
              aria-label="Sort mind maps by"
              value={sortMode}
              onChange={handleSortChange}
            >
              <option value="created">Date created</option>
              <option value="updated">Last updated</option>
            </select>
          </label>
        </div>
      </div>

      <div
        aria-busy={isLoading || isTransitioning}
        className={`mindmap-list-grid${
          totalPages > 1 ? " is-paginated" : ""
        }${isTransitioning ? " is-transitioning" : ""}`}
        data-testid="mindmap-list-grid"
      >
        {isLoading ? (
          <MindMapLoader variant="inline" label="Loading mind maps…" />
        ) : currentMaps.map((map) => (
          <article
            key={map.id}
            className={`mindmap-list-slot${map.isPublic ? " is-public" : ""}`}
          >
            <button
              type="button"
              className="mindmap-list-open"
              aria-label={`Open ${map.title}`}
              onClick={() => handleMindMapSelect(map.id)}
            >
              <MapPreview branches={map.branches ?? []} theme={theme} />
              <div className="mindmap-list-card-copy">
                <h2>{map.title}</h2>
              </div>
            </button>
            <button
              type="button"
              className="mindmap-list-delete"
              aria-label={`Delete ${map.title}`}
              title="Delete"
              onClick={(event) => {
                event.stopPropagation();
                handleDelete(map.id);
              }}
            >
              <TrashIcon size={15} />
            </button>
            <div className="mindmap-list-foot">
              <p className="mindmap-list-date" aria-label={`Updated ${map.description}`}>
                <ClockIcon size={12} />
                <span>{map.description}</span>
              </p>
              <div className="mindmap-list-share-actions">
                <button
                  type="button"
                  aria-label={map.isPublic ? `Make ${map.title} private` : `Make ${map.title} public`}
                  aria-pressed={map.isPublic === true}
                  className={map.isPublic ? "is-public" : undefined}
                  title={map.isPublic ? "Public link is on. Click to make private." : "Publish a read-only link"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onTogglePublic(map.id, !map.isPublic);
                  }}
                >
                  {map.isPublic ? <GlobeIcon size={13} /> : <LockIcon size={13} />}
                  {map.isPublic ? "Public" : "Share"}
                </button>
                {map.isPublic ? (
                  <button
                    type="button"
                    className="is-icon"
                    aria-label={`Copy public link for ${map.title}`}
                    title="Copy public link"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCopyPublicLink(map.id);
                    }}
                  >
                    <CopyIcon size={13} />
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {!isLoading && !currentMaps.length ? (
          <div className="mindmap-library-empty">
            <span className="mindmap-library-empty-icon" aria-hidden="true">
              <SearchIcon size={22} />
            </span>
            <h2>No mind maps found</h2>
            <p>Try another search, or create a new mind map.</p>
            <button type="button" className="mindmap-library-new" onClick={handleCreate}>
              <PlusIcon size={16} />
              New mind map
            </button>
          </div>
        ) : null}
      </div>
      {totalPages > 1 ? (
        <nav className="mindmap-pagination" aria-label="Mind map pages">
          <button
            type="button"
            disabled={currentPage <= 1 || isTransitioning}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ArrowLeftIcon size={14} />
            Previous
          </button>
          <div>{renderPageNumbers()}</div>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            disabled={currentPage >= totalPages || isTransitioning}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
            <ArrowRightIcon size={14} />
          </button>
        </nav>
      ) : null}
    </main>
  );
}

const PREVIEW_BRANCH_LIMIT = 3;
// Row height and gap of the preview list, in tenths of a rem.
const PREVIEW_ROW = 13;
const PREVIEW_GAP = 4;
const PREVIEW_LINK_WIDTH = 40;

// Mini map of the first top-level topics, so a card shows what the map covers.
function MapPreview({
  branches,
  theme,
}: {
  branches: string[];
  theme: ResolvedTheme;
}) {
  const shown = branches.slice(0, PREVIEW_BRANCH_LIMIT);
  const hiddenCount = branches.length - shown.length;

  if (!shown.length) {
    return (
      <div className="mindmap-list-thumb is-empty">
        <span className="mindmap-list-thumb-root" aria-hidden="true" />
        <span>No topics yet</span>
      </div>
    );
  }

  const height = shown.length * PREVIEW_ROW + (shown.length - 1) * PREVIEW_GAP;
  const rootY = height / 2;
  const colors = shown.map((_, index) => getBranchColor(index, 1, theme));

  return (
    <div className={`mindmap-list-thumb${hiddenCount > 0 ? " has-more" : ""}`}>
      <svg
        className="mindmap-list-thumb-links"
        width={`${PREVIEW_LINK_WIDTH / 10}rem`}
        height={`${height / 10}rem`}
        viewBox={`0 0 ${PREVIEW_LINK_WIDTH} ${height}`}
        aria-hidden="true"
      >
        {shown.map((_, index) => {
          const y = index * (PREVIEW_ROW + PREVIEW_GAP) + PREVIEW_ROW / 2;
          return (
            <path
              key={index}
              d={`M14 ${rootY} C28 ${rootY} 24 ${y} ${PREVIEW_LINK_WIDTH} ${y}`}
              stroke={colors[index]}
            />
          );
        })}
        <rect x="1" y={rootY - 4} width="14" height="8" rx="4" />
      </svg>
      <div className="mindmap-list-thumb-topics">
        <ul>
          {shown.map((topic, index) => (
            <li
              key={index}
              style={{
                background: colors[index],
                color: MAP_PALETTES[theme].firstLevelText,
              }}
            >
              {topic}
            </li>
          ))}
        </ul>
        {hiddenCount > 0 ? (
          <span className="mindmap-list-thumb-more">+{hiddenCount} more</span>
        ) : null}
      </div>
    </div>
  );
}

export default MindMapList;
