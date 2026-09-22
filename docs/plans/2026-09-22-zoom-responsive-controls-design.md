# Responsive Editor Controls Design

## Goal

Keep the mind-map command bar, save status, and map controls reachable when a browser is zoomed, the viewport is short, or platform font metrics cause the command bar to wrap.

## Root cause

The editor currently gives the canvas stage the full editor height while the command bar is absolutely positioned over it. The command bar is allowed to wrap, but its height is not part of the layout. The editor also clips overflow, so a wrapped command bar or a bottom toolbar can be rendered outside the visible region on small or zoomed viewports.

## Chosen approach

Use a two-row editor layout. The command bar becomes a normal, auto-sized row and the showcase becomes a flexible remaining-space row. The map stage keeps `min-height: 0` so it can shrink instead of pushing controls outside the editor. The editor remains bounded to the viewport, but its layout no longer depends on a fixed command-bar height or a JavaScript measurement.

The existing responsive rules remain responsible for reducing command-bar content on narrow screens. The save status stays in the command bar, and the map toolbar remains anchored to the bottom of the flexible showcase area.

## Alternatives considered

1. Allow the current absolute layout to scroll. This makes clipped controls reachable but preserves overlap between the command bar and canvas.
2. Measure the command bar in React and offset the canvas dynamically. This adds timing and font-metric coupling for a problem CSS layout can solve.
3. Put the command bar in normal flow and allocate the remaining space to the showcase. This is the selected option because wrapping naturally changes the available map height across browsers and zoom levels.

## Verification

- Add a regression test that asserts the editor uses a column layout, the command bar participates in normal flow, and the showcase consumes remaining space.
- Run the focused regression test before the CSS change to prove it fails.
- Run the full Jest suite, typecheck, lint, and production build.
- Use a real browser viewport check at desktop, short, and narrow dimensions to verify command-bar/save-status/toolbar bounding boxes remain inside the editor.
