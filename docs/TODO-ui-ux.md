# UI/UX follow-ups

Ideas noted during the 2026-11 theme and XMind-style redesign that were out of
scope for that change. Roughly ordered by expected impact.

## Editor

- [ ] **Zoom to fit vs. 100%.** Fit now equals 100% only when the map is smaller
      than the pane. Add a separate "Fit" action that scales a large map down
      and keeps "100%" as a true reset.
- [ ] **Smooth zoom and pan.** Animate zoom/pan transitions (CSS transition on
      the transform group, disabled while dragging) so fit/centre feel like
      XMind rather than snapping.
- [ ] **Inline node editor sizing.** Measure text with a hidden canvas instead
      of the per-character estimate in `getEditingBoxSize` so CJK and long
      English lines never overflow the pill.
- [ ] **Minimap** in the bottom-left for maps wider than the pane.
- [ ] **Multiple map themes.** `MAP_PALETTES` already separates branch colours
      from chrome; expose two or three presets (Classic, Fresh, Mono) in the
      More menu and persist per map.
- [ ] **Left-growing / balanced layout** so large maps can grow on both sides
      of the root like XMind.
- [ ] **Topic notes and icons.** Optional note text and a small icon picker per
      node, surfaced in the floating toolbar.
- [ ] **Drag reparent feedback.** Show a ghost of the dragged subtree and a
      clearer insertion line colour in dark mode.
- [ ] **Touch gestures.** Pinch to zoom and two-finger pan on tablets.
      (Touch targets grew on coarse pointers on 2026-11-20: 44px zoom
      controls, 40px node toolbar and mode switch.)
- [ ] **Right-click on macOS.** Verify that the context menu opens on
      `mousedown`-driven `contextmenu` events; the pan gesture may suppress it.

## Library

- [ ] **Rename and duplicate** from the card menu; bulk select for delete.
- [ ] **List view toggle** for people with many maps.

## Landing and auth

- [ ] **Animated preview.** Type the Markdown in `LandingPreview` and grow the
      map line by line (respect `prefers-reduced-motion`).
- [x] **Loading and error states** on the sign-in form: the button shows a
      busy label and failures appear inline (2026-11-20).

## Share page

- [ ] Theme toggle is in the header already; consider a "Open in MindCard"
      call to action for signed-out viewers.
- [ ] Deep-link to a focused branch via `?focus=<nodeId>`.

## Platform

- [ ] Replace the `react-icons` and `sweetalert2` dependencies: icons are now
      inline, and the confirm dialog could be a small Headless UI `Dialog`
      styled by the theme tokens.
- [ ] Load Inter through `next/font` once CI network access is confirmed, so
      typography matches across operating systems.
- [ ] Visual regression tests (Playwright screenshots of landing, library,
      editor in both themes) in CI.
