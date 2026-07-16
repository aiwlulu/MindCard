"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SweetAlert from "./SweetAlert";
import debounce from "@/lib/utils/debounce";
import SearchBar from "./SearchBar";
import { TrashIcon } from "./Icons";
import MindMapLoader from "./MindMapLoader";
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
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchRestored, setIsSearchRestored] = useState(false);
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

  useEffect(() => setCurrentPage(initialPage), [initialPage]);

  useEffect(() => {
    setSearchTerm(readStoredSearch());
    setIsSearchRestored(true);
  }, []);

  useEffect(() => {
    if (!isSearchRestored) return;
    writeStoredSearch(searchTerm);
  }, [isSearchRestored, searchTerm]);

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

  useEffect(() => {
    const lastAvailablePage = Math.max(1, totalPages);
    if (currentPage <= lastAvailablePage) return;
    setCurrentPage(lastAvailablePage);
    router.replace(`/mindmap/?page=${lastAvailablePage}`);
  }, [currentPage, router, totalPages]);

  const handleMindMapSelect = (id: string) => {
    router.push(`/mindmap/${id}`);
  };

  const handleDelete = (id: string) => {
    void SweetAlert({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
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
    const ellipsis = "...";

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
            <span key="start-ellipsis" className="mindmap-pagination-ellipsis">
              {ellipsis}
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) pageNumbers.push(pageBtn(i));

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <span key="end-ellipsis" className="mindmap-pagination-ellipsis">
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
    <main className="mindmap-library">
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
          <span aria-hidden="true">＋</span>
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
            className="mindmap-list-slot"
          >
            <button
              type="button"
              className="mindmap-list-open"
              aria-label={`Open ${map.title}`}
              onClick={() => handleMindMapSelect(map.id)}
            >
              <div className="mindmap-list-card-copy">
                <h2>{map.title}</h2>
                <p>{map.description}</p>
              </div>
            </button>
            <button
              type="button"
              className="mindmap-list-delete"
              aria-label={`Delete ${map.title}`}
              onClick={(event) => {
                event.stopPropagation();
                handleDelete(map.id);
              }}
            >
              <TrashIcon />
            </button>
            <div className="mindmap-list-share-actions">
              <button
                type="button"
                aria-label={map.isPublic ? `Make ${map.title} private` : `Make ${map.title} public`}
                aria-pressed={map.isPublic === true}
                className={map.isPublic ? "is-public" : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  onTogglePublic(map.id, !map.isPublic);
                }}
              >
                <span aria-hidden="true">{map.isPublic ? "●" : "○"}</span>
                {map.isPublic ? "Public" : "Share"}
              </button>
              {map.isPublic ? (
                <button
                  type="button"
                  aria-label={`Copy public link for ${map.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onCopyPublicLink(map.id);
                  }}
                >
                  Copy link
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {!isLoading && !currentMaps.length ? (
          <div className="mindmap-library-empty">
            <span aria-hidden="true">⌕</span>
            <h2>No mind maps found</h2>
            <p>Try another search, or create a new mind map.</p>
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
            ← Previous
          </button>
          <div>{renderPageNumbers()}</div>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            disabled={currentPage >= totalPages || isTransitioning}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next →
          </button>
        </nav>
      ) : null}
    </main>
  );
}

export default MindMapList;
