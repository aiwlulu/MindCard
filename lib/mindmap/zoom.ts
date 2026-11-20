// Zoom is multiplicative so each step feels the same at 30% and at 300%.

export const ZOOM_STEP = 1.25;
// Largest on-screen scale: topics at four times their real size.
export const MAX_SCALE = 4;
export const MIN_ZOOM = 0.45;

const WHEEL_SENSITIVITY = 0.015;
const WHEEL_DELTA_LIMIT = 30;

// Trackpad pinches send many small deltas, a mouse wheel sends a few large ones;
// scaling by the delta keeps both quick without one notch jumping too far.
export function wheelZoomFactor(deltaY: number): number {
  const delta = Math.max(-WHEEL_DELTA_LIMIT, Math.min(WHEEL_DELTA_LIMIT, deltaY));
  return Math.exp(-delta * WHEEL_SENSITIVITY);
}

// How much the browser shrinks the viewBox to fit the pane (1 when the map already fits).
export function fitScale(
  viewBox: { width: number; height: number } | null,
  pane: { width: number; height: number } | null
): number {
  if (!viewBox || !pane || !viewBox.width || !viewBox.height || !pane.width || !pane.height) {
    return 1;
  }
  return Math.min(1, pane.width / viewBox.width, pane.height / viewBox.height);
}

export function clampZoom(value: number, scale = 1): number {
  const max = Math.max(1, MAX_SCALE / scale);
  return Math.max(MIN_ZOOM, Math.min(max, Number(value.toFixed(3))));
}

// Keeps the point under the cursor fixed while the zoom changes.
export function panForZoom(
  pan: { x: number; y: number },
  point: { x: number; y: number },
  zoom: number,
  nextZoom: number
): { x: number; y: number } {
  const ratio = nextZoom / zoom;
  return {
    x: point.x - (point.x - pan.x) * ratio,
    y: point.y - (point.y - pan.y) * ratio,
  };
}
