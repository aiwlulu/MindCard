# Native TypeScript Mind Map Design

**Date:** 2026-07-14

## Goal

Replace the `mind-elixir` runtime with a typed, self-contained React/SVG editor while preserving MindCard's current data shape, visual language, and user-facing features.

## Scope and assumptions

- “不依賴心智圖套件” means removing `mind-elixir`, `mind-elixir-react`, and `@mind-elixir/export-xmind`; Firebase, React, Headless UI, SweetAlert, and toast utilities remain application dependencies.
- Existing Firestore documents remain readable: `{ data: { nodeData: NodeData } }` with optional `root` is normalized at the boundary.
- Existing features remain supported: create/delete maps, node selection, double-click editing, right-click node actions, keyboard shortcuts, card links through drag/drop, hyperlink removal, auto-save, SVG export, and Markdown export.
- The existing dark slate / indigo / lime styling, responsive panels, and current navigation/auth flows remain the visual baseline.

## Architecture

The new editor is split into three layers:

1. `lib/mindmap/tree.ts` owns immutable tree operations (insert child/sibling, delete, move, rename, find, clone, normalize) and generates stable node IDs.
2. `lib/mindmap/layout.ts` owns deterministic right-facing tree layout, connector geometry, and SVG serialization. It has no React, Firebase, or DOM dependencies, so it can be tested directly.
3. `components/MindMap.tsx` renders the layout in SVG and owns transient interaction state: selection, editing, context menu, pan, zoom, clipboard, and focus. Persistent data is supplied by `MindmapContext`.

`MindmapContext` becomes a typed persistence/controller layer. It stores `MindmapData`, tracks dirty state, loads and saves Firestore documents, schedules silent auto-save, updates card links immutably, and delegates SVG/Markdown downloads to the pure export helpers. The context no longer exposes an external editor instance.

## Interaction model

- A node click selects it; double-click enters inline edit mode.
- Context menu actions add a child, add a sibling, rename, or delete the selected node. The root cannot be deleted.
- Enter inserts a sibling, Tab inserts a child, Delete removes the selected non-root node, PageUp/PageDown and Alt+ArrowUp/Down move a node among siblings.
- Ctrl/Cmd+Z, C/V, S, +, -, 0 map to undo, copy, paste, save, zoom in, zoom out, and reset zoom. F1 centers the map and F2 edits the selection.
- Background pointer drag pans the viewport; wheel and toolbar controls zoom. Fullscreen remains available from the editor toolbar.
- Card links continue to use `card/json` drag data and render as a visible link marker in the node and exported SVG.

## Error handling and compatibility

- Malformed or empty stored data is normalized to a safe root node.
- Persistence failures show the existing toast style and preserve dirty state for a later retry.
- Download helpers escape SVG text and sanitize file names.
- Jest is updated to transform the Firebase ESM boundary or mock Firebase at the context boundary; pure tree/layout/export tests stay independent of Firebase.

## Verification

- Unit tests cover tree invariants, layout geometry, SVG escaping/link output, Markdown output, and Firestore-facing data normalization.
- Component tests cover selection, inline editing, context-menu insertion/deletion, card drag/drop, and shortcut behavior.
- `npm test -- --runInBand`, `npm run build`, and a production smoke check provide the final gate.
