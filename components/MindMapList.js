import { useRouter } from "next/navigation";
import { BsTrash } from "react-icons/bs";
import Swal from "sweetalert2";

function MindMapList({ mindMaps, onMindMapCreate, onDeleteMindMap }) {
  const router = useRouter();

  const handleMindMapSelect = (id) => {
    router.push(`/mindmap/${id}`);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      onDeleteMindMap(id);
    }
  };

  return (
    <div className="mt-10 ml-20 mr-20 grid grid-cols-5 gap-4 items-center">
      <div className="flex items-center justify-center">
        <button
          className="btn btn-primary-outline px-4 py-2"
          onClick={onMindMapCreate}
        >
          + New
        </button>
      </div>

      {mindMaps.map((map) => (
        <div
          key={map.id}
          className="relative cursor-pointer p-4 bg-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
          onClick={() => handleMindMapSelect(map.id)}
        >
          <BsTrash
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(map.id);
            }}
          />
          <h3 className="text-lg font-semibold">{map.title}</h3>
          <p className="text-sm text-slate-300">{map.description}</p>
        </div>
      ))}
    </div>
  );
}

export default MindMapList;
