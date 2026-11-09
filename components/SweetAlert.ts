import type { SweetAlertOptions } from "@/lib/types";

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value.trim() || fallback;
}

const SweetAlert = async ({
  title,
  text,
  icon,
  confirmButtonText = "Yes, delete it!",
  onConfirm,
  onCancel,
}: SweetAlertOptions): Promise<void> => {
  const { default: Swal } = await import("sweetalert2");
  const result = await Swal.fire({
    title,
    text,
    icon,
    iconColor: cssVar("--color-warning", "#d98b2b"),
    background: cssVar("--color-surface-elevated", "#ffffff"),
    color: cssVar("--color-text", "#1b1f2a"),
    showCancelButton: true,
    focusCancel: true,
    reverseButtons: true,
    buttonsStyling: false,
    confirmButtonText,
    cancelButtonText: "Cancel",
    customClass: {
      popup: "mindcard-swal-popup",
      title: "mindcard-swal-title",
      htmlContainer: "mindcard-swal-text",
      actions: "mindcard-swal-actions",
      confirmButton: "mindcard-swal-btn mindcard-swal-btn-danger",
      cancelButton: "mindcard-swal-btn mindcard-swal-btn-secondary",
    },
  });

  if (result.isConfirmed && onConfirm) {
    onConfirm();
  } else if (result.dismiss === Swal.DismissReason.cancel && onCancel) {
    onCancel();
  }
};

export default SweetAlert;
