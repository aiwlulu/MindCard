import {
  anchorInViewBox,
  clampZoom,
  fitScale,
  panForZoom,
  wheelZoomFactor,
  ZOOM_STEP,
} from "./zoom";

describe("zoom helpers", () => {
  it("zooms by the same ratio at every level", () => {
    expect(wheelZoomFactor(-10)).toBeCloseTo(1 / wheelZoomFactor(10));
    expect(wheelZoomFactor(-10)).toBeGreaterThan(1);
  });

  it("limits one mouse-wheel notch so the map does not jump", () => {
    expect(wheelZoomFactor(-100)).toBe(wheelZoomFactor(-30));
    expect(wheelZoomFactor(-100)).toBeLessThan(1.6);
  });

  it("reaches reading size on a large map in a few steps", () => {
    // A map four times wider than the pane starts at 25% on screen.
    const scale = fitScale({ width: 4000, height: 2000 }, { width: 1000, height: 800 });
    expect(scale).toBe(0.25);
    let zoom = 1;
    let steps = 0;
    while (zoom * scale < 1 && steps < 50) {
      zoom = clampZoom(zoom * ZOOM_STEP, scale);
      steps += 1;
    }
    expect(steps).toBeLessThanOrEqual(7);
  });

  it("caps the on-screen scale at 400% whatever the map size", () => {
    expect(clampZoom(1000, 0.25) * 0.25).toBe(4);
    expect(clampZoom(1000, 1)).toBe(4);
    expect(clampZoom(0.01, 1)).toBe(0.45);
  });

  it("treats a missing or unmeasured pane as an exact fit", () => {
    expect(fitScale(null, null)).toBe(1);
    expect(fitScale({ width: 800, height: 600 }, { width: 0, height: 0 })).toBe(1);
    expect(fitScale({ width: 500, height: 300 }, { width: 500, height: 300 })).toBe(1);
  });

  it("keeps the point under the cursor in place after panning", () => {
    const pan = { x: 120, y: -40 };
    const point = { x: 300, y: 200 };
    const zoom = 1.5;
    const nextZoom = 3;
    const content = { x: (point.x - pan.x) / zoom, y: (point.y - pan.y) / zoom };
    const nextPan = panForZoom(pan, point, zoom, nextZoom);
    expect(nextPan.x + content.x * nextZoom).toBeCloseTo(point.x);
    expect(nextPan.y + content.y * nextZoom).toBeCloseTo(point.y);
  });

  it("maps a cursor position through the letterbox of a shrunk map", () => {
    // 2000x500 map in a 1000x800 pane: scale 0.5, drawn 250px tall, 275px bars above and below.
    const rect = { left: 100, top: 50, width: 1000, height: 800 };
    const viewBox = { width: 2000, height: 500 };
    expect(anchorInViewBox(rect, viewBox, { x: 100, y: 50 + 275 })).toEqual({ x: 0, y: 0 });
    expect(anchorInViewBox(rect, viewBox, { x: 1100, y: 50 + 525 })).toEqual({ x: 2000, y: 500 });
    // No cursor: the middle of the pane.
    expect(anchorInViewBox(rect, viewBox)).toEqual({ x: 1000, y: 250 });
    expect(anchorInViewBox({ left: 0, top: 0, width: 0, height: 0 }, viewBox)).toBeNull();
  });
});
