import type { SweetAlertOptions } from "@/lib/types";

const SweetAlert = async ({
  title,
  text,
  icon,
  onConfirm,
  onCancel,
}: SweetAlertOptions): Promise<void> => {
  const { default: Swal } = await import("sweetalert2");
  const result = await Swal.fire({
    title,
    text,
    icon,
    iconColor: "#F6AD55",
    background: "#1F2937",
    color: "#F8FAFC",
    showCancelButton: true,
    focusCancel: true,
    reverseButtons: true,
    buttonsStyling: false,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    customClass: {
      popup: "mindcard-swal-popup",
      title: "mindcard-swal-title",
      htmlContainer: "mindcard-swal-text",
      actions: "mindcard-swal-actions",
      confirmButton:
        "mindcard-swal-btn mindcard-swal-btn-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300",
      cancelButton:
        "mindcard-swal-btn mindcard-swal-btn-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
    },
  });

  if (result.isConfirmed && onConfirm) {
    onConfirm();
  } else if (result.dismiss === Swal.DismissReason.cancel && onCancel) {
    onCancel();
  }
};

export default SweetAlert;
