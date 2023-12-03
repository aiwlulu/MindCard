import { useRouter } from "next/navigation";
import { BsTrash } from "react-icons/bs";
import SweetAlert from "./SweetAlert";

function MindMapList({ mindMaps, onMindMapCreate, onDeleteMindMap }) {
  const router = useRouter();

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

  return (
    <div className="mt-10 mx-4 sm:mx-10 md:mx-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center">
      <div className="flex items-center justify-center col-span-2 sm:col-span-1">
        <button
          className="btn btn-primary-outline px-4 py-2 text-center"
          onClick={onMindMapCreate}
        >
          + New
        </button>
      </div>

      {mindMaps.map((map) => (
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
  );
}

export default MindMapList;
