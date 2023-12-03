import Swal from "sweetalert2";

const SweetAlert = async ({ title, text, icon, onConfirm, onCancel }) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    background: "#2D3748",
    color: "#F7FAFC",
    showCancelButton: true,
    confirmButtonColor: "#E53E3E",
    cancelButtonColor: "#718096",
    confirmButtonText: "Yes, delete it!",
    customClass: {
      confirmButton: "btn-red",
      cancelButton: "btn-slate",
    },
  });

  if (result.isConfirmed && onConfirm) {
    onConfirm();
  } else if (result.dismiss === Swal.DismissReason.cancel && onCancel) {
    onCancel();
  }
};

export default SweetAlert;
