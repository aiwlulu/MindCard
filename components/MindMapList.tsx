"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SweetAlert from "./SweetAlert";
import debounce from "@/lib/utils/debounce";
import SearchBar from "./SearchBar";
import { TrashIcon } from "./Icons";
import type { MindmapListItem } from "@/lib/types";

interface MindMapListProps {
  mindMaps: MindmapListItem[];
  onMindMapCreate: () => void;
  onDeleteMindMap: (id: string) => void;
}

function MindMapList({
  mindMaps,
  onMindMapCreate,
  onDeleteMindMap,
}: MindMapListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mapsPerPage = 19;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (initialPage !== currentPage) {
      setCurrentPage(initialPage);
    }
  }, [initialPage, currentPage]);

  const filteredMindMaps = useMemo(() => {
    if (!searchTerm) return mindMaps;
    return mindMaps.filter((map) =>
      map.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mindMaps, searchTerm]);

  const totalPages = Math.ceil(filteredMindMaps.length / mapsPerPage);

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

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber === currentPage) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      router.push(`/mindmap/?page=${pageNumber}`);
      setIsTransitioning(false);
    }, 200);
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
        className={`mx-2 mt-6 px-3 py-1 border ${
          currentPage === i ? "border-blue-500" : "border-gray-300"
        } rounded-full focus:outline-none`}
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
            <span key="start-ellipsis" className="mx-2 mt-6">
              {ellipsis}
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) pageNumbers.push(pageBtn(i));

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <span key="end-ellipsis" className="mx-2 mt-6">
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
    <div className="mt-10 mx-4 sm:mx-10 md:mx-20">
      <SearchBar value={searchTerm} onChange={handleSearchChange} />

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center transition-opacity duration-200 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-center justify-center col-span-2 sm:col-span-1">
          <button
            className="btn btn-primary-outline px-4 py-2 text-center"
            onClick={handleCreate}
          >
            + New
          </button>
        </div>

        {currentMaps.map((map) => (
          <div
            key={map.id}
            className="relative cursor-pointer p-4 bg-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 col-span-2 sm:col-span-1"
            onClick={() => handleMindMapSelect(map.id)}
          >
            <TrashIcon
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 cursor-pointer"
              onClick={(e) => {
                e?.stopPropagation();
                handleDelete(map.id);
              }}
            />
            <h3 className="text-lg font-semibold truncate">{map.title}</h3>
            <p className="text-sm text-slate-300 truncate">{map.description}</p>
          </div>
        ))}
      </div>
      <div className="my-4 flex justify-center">{renderPageNumbers()}</div>
    </div>
  );
}

export default MindMapList;
