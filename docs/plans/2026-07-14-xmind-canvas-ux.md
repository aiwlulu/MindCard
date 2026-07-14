# XMind-Like Canvas UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the native TypeScript mind-map editor closer to the provided XMind reference by using line-based topic nodes, collapsible branches, stable canvas navigation, and one-click SVG/Markdown export.

**Architecture:** Keep the existing immutable tree model and native SVG renderer. Extend the pure layout function to measure/wrap topics and omit descendants of collapsed nodes, then expose those behaviors through the existing editor context and compact canvas controls. Keep export pure and reuse the same layout so the downloaded SVG matches the canvas.

**Tech Stack:** TypeScript, React, Next.js, native SVG, Jest, Testing Library.

## Scope decisions

- Preserve the existing dark canvas and lime/indigo selection language, but remove the card-like visual treatment from ordinary topic nodes.
- Render long topics as bounded multi-line text and use curved connectors, matching the supplied reference instead of allowing text to overflow.
- Treat `collapsed` as optional persisted node data for backward compatibility.
- Keep existing keyboard shortcuts and card hyperlinks.
- Provide SVG and Markdown export from the canvas command bar; the existing top navigation export remains available.

### Task 1: Lock down layout and tree behavior with tests

**Files:**
- Modify: `lib/mindmap/layout.test.ts`
- Modify: `lib/mindmap/tree.test.ts`
- Modify: `lib/mindmap/export.test.ts`

Write failing tests for topic wrapping, dynamic node height, collapsed descendants being hidden from the visible layout, and collapsed branches still appearing in Markdown export.

### Task 2: Implement the XMind-like layout model

**Files:**
- Modify: `lib/types/index.ts`
- Modify: `lib/mindmap/tree.ts`
- Modify: `lib/mindmap/layout.ts`
- Modify: `lib/mindmap/export.ts`

Add `collapsed?: boolean`, deterministic character-width wrapping, per-node dimensions, visible-child traversal, and SVG `<tspan>` output. Preserve all descendants in the data model and export them in Markdown.

### Task 3: Add editor-level XMind interactions

**Files:**
- Modify: `components/MindMap.tsx`
- Modify: `components/MindMap.test.tsx`

Add a selected-node command bar for child/sibling/rename/collapse/delete, make the collapse action update immutable tree data, improve zoom around the pointer, keep pan in canvas coordinates, and expose an explicit Fit view control. Add accessible labels for fast testing and keyboard use.

### Task 4: Rebalance the editor chrome

**Files:**
- Modify: `app/globals.css`
- Modify: `components/Card.tsx`
- Modify: `components/ShortcutGuide.tsx`

Make the guide compact and non-clipping, move floating panels away from the viewport edge, cap their height, remove accidental global hover scaling from canvas controls, and make the canvas fill the available editor height.

### Task 5: Verify and hand off

Run the focused Jest tests, the full test suite, `npx tsc --noEmit`, and a production build with placeholder Firebase variables. Inspect the diff and report the remaining manual smoke-test steps for the user's local Firebase environment.
