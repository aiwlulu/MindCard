import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BsTrash } from "react-icons/bs";
import SweetAlert from "./SweetAlert";
import debounce from "lodash.debounce";

function MindMapList({ mindMaps, onMindMapCreate, onDeleteMindMap }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const mapsPerPage = 15;

  const totalPages = Math.ceil(mindMaps.length / mapsPerPage);

  const handleMindMapSelect = (id) => {
    router.push(`/mindmap/${id}`);
  };

  const handleDelete = (id) => {
    SweetAlert({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      onConfirm: () => onDeleteMindMap(id),
    });
  };

  const handleCreate = debounce(() => {
    onMindMapCreate();
  }, 300);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastMap = currentPage * mapsPerPage;
  const indexOfFirstMap = indexOfLastMap - mapsPerPage;
  const currentMaps = mindMaps.slice(indexOfFirstMap, indexOfLastMap);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbersToShow = 5;
    const ellipsis = "...";

    if (totalPages <= maxPageNumbersToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
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
      }
    } else {
      let startPage = Math.max(currentPage - 2, 1);
      let endPage = Math.min(currentPage + 2, totalPages);

      if (startPage > 1) {
        pageNumbers.push(
          <button
            key={1}
            className={`mx-2 mt-6 px-3 py-1 border ${
              currentPage === 1 ? "border-blue-500" : "border-gray-300"
            } rounded-full focus:outline-none`}
            onClick={() => handlePageChange(1)}
          >
            1
          </button>
        );
        if (startPage > 2) {
          pageNumbers.push(
            <span key="start-ellipsis" className="mx-2 mt-6">
              {ellipsis}
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
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
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <span key="end-ellipsis" className="mx-2 mt-6">
              {ellipsis}
            </span>
          );
        }
        pageNumbers.push(
          <button
            key={totalPages}
            className={`mx-2 mt-6 px-3 py-1 border ${
              currentPage === totalPages ? "border-blue-500" : "border-gray-300"
            } rounded-full focus:outline-none`}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="mt-10 mx-4 sm:mx-10 md:mx-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center">
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
            <BsTrash
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(map.id);
              }}
            />
            <h3 className="text-lg font-semibold truncate">{map.title}</h3>
            <p className="text-sm text-slate-300 truncate">{map.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center">{renderPageNumbers()}</div>
    </div>
  );
}

export default MindMapList;
