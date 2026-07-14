# Native TypeScript Mind Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the mind-map package with a typed native SVG editor while preserving MindCard behavior, persisted data, and styling.

**Architecture:** Keep Firebase/auth and the existing page shell. Add pure TypeScript tree/layout/export modules, use them from a client SVG editor, and move persistence/autosave into a typed context that stores normalized `MindmapData` instead of a third-party editor instance.

**Tech Stack:** Next.js 16, React 19, TypeScript, SVG, Firebase Firestore Lite, Tailwind CSS, Jest, Testing Library.

### Task 1: Establish the typed domain core

**Files:**
- Create: `lib/mindmap/tree.ts`
- Create: `lib/mindmap/tree.test.ts`
- Modify: `lib/types/index.ts`

**Steps:**

1. Write failing tests for node ID creation, safe normalization, recursive lookup, immutable rename/link updates, child/sibling insertion, root protection, deletion, sibling movement, and clone/paste behavior.
2. Run `npx jest lib/mindmap/tree.test.ts --runInBand`; confirm the missing module/functions fail.
3. Implement the minimal immutable tree operations with a backwards-compatible `NodeData`/`MindmapData` shape.
4. Run the focused test until all tree invariants pass.
5. Commit with `git commit -m "feat: add typed mind map tree model"`.

### Task 2: Add deterministic layout and exports

**Files:**
- Create: `lib/mindmap/layout.ts`
- Create: `lib/mindmap/layout.test.ts`
- Create: `lib/mindmap/export.ts`
- Create: `lib/mindmap/export.test.ts`

**Steps:**

1. Write failing tests for right-facing coordinates, parent-child connectors, Markdown heading/list output, SVG escaping, hyperlink markers, and sanitized titles.
2. Run focused tests and confirm they fail before implementation.
3. Implement pure layout records and SVG/Markdown serializers with no React or DOM imports.
4. Run focused tests and verify stable geometry and output.
5. Commit with `git commit -m "feat: add native mind map layout and exports"`.

### Task 3: Repair the test boundary and refactor persistence

**Files:**
- Modify: `jest.config.js`
- Modify: `lib/store/mindmap-context.tsx`
- Modify: `lib/types/index.ts`
- Modify: `components/Card.test.tsx`
- Create: `lib/store/mindmap-context.test.tsx` (or focused persistence tests)

**Steps:**

1. Add a focused failing test for loading a legacy Firestore payload, changing a link, and preserving dirty state.
2. Configure Jest's Firebase boundary (mock or transform) so tests can import the provider without the existing ESM parse failure.
3. Replace `MindElixirInstance` state with `MindmapData`, `updateMindmapData`, selected-node state, dirty tracking, silent debounced auto-save, and typed persistence/export calls.
4. Keep Firestore queries, title extraction, user filtering, and existing toast copy compatible.
5. Run context and existing Card tests; fix only failures caused by this API change.
6. Commit with `git commit -m "refactor: move mind map persistence to typed state"`.

### Task 4: Build the native SVG editor

**Files:**
- Replace: `components/MindMap.tsx`
- Create: `components/MindMapCanvas.tsx` if rendering concerns warrant extraction
- Modify: `components/ShortcutGuide.tsx`
- Modify: `components/Icons.tsx` if toolbar icons are needed

**Steps:**

1. Write failing component tests for selection, double-click rename, context-menu insertion/deletion, keyboard insertion/deletion/undo/copy/paste/save, and card drag/drop.
2. Implement SVG nodes/connectors from the pure layout, keeping the current right-facing dark visual treatment.
3. Add inline editing, context menu, keyboard handling, undo/clipboard, card link drag/drop, panning, wheel/toolbar zoom, center, and fullscreen.
4. Run the component tests and verify no interaction mutates the tree in place.
5. Commit with `git commit -m "feat: replace mind map package with native svg editor"`.

### Task 5: Remove the third-party mind map runtime

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app/mindmap/[id]/page.tsx`
- Modify: `app/mindmap/page.tsx`
- Modify: `app/globals.css`
- Delete or simplify: `lib/utils/silenceConsole.ts` and its call site if no longer needed

**Steps:**

1. Remove all imports and CSS selectors tied to Mind Elixir.
2. Remove the three mind-map packages and regenerate the lockfile with `npm install`.
3. Simplify the detail page so loading happens once through the context/editor boundary.
4. Run `rg -n "mind-elixir|MindElixir|export-xmind"` and confirm there are no runtime references.
5. Commit with `git commit -m "chore: remove mind map package dependencies"`.

### Task 6: Final verification and handoff

**Files:**
- Modify: `README.md` if the technology list or behavior needs updating

**Steps:**

1. Run `npm test -- --runInBand` and record the complete result.
2. Run `npm run build` and resolve TypeScript, lint, or Next client/server boundary errors.
3. Run the app in production mode or use a local browser smoke check for login shell, map list, detail editor, card panel, and export controls.
4. Inspect `git diff`, `git status`, and the final dependency graph for accidental files or package references.
5. Commit any final fixes with focused Conventional Commit messages.
