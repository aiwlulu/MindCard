# Zoom-Resilient Editor Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep MindCard's command bar, save status, and map toolbar visible and usable after browser zoom or on short/narrow screens.

**Architecture:** Convert the editor from an overlapping absolute command bar plus full-height canvas into a two-row flex layout. The command bar remains auto-sized in normal flow; the showcase fills only the remaining editor height, so wrapped controls cannot cover or be clipped by the canvas.

**Tech Stack:** Next.js 16, React 19, TypeScript, global CSS, Jest + Testing Library.

### Task 1: Add the CSS layout regression contract

**Files:**
- Create: `app/globals.layout.test.ts`
- Test: `app/globals.layout.test.ts`

**Step 1: Write the failing test**

Read `app/globals.css`, extract the `.mindmap-editor`, `.mindmap-commandbar`, and `.showcase` blocks, and assert the editor is a flex column, the command bar is in normal flow, and the showcase is the flexible row.

**Step 2: Run the focused test to verify it fails**

Run: `npx jest app/globals.layout.test.ts --runInBand`

Expected: FAIL because the current command bar is absolutely positioned and the showcase has a fixed `height: 100%`.

### Task 2: Implement the layout fix

**Files:**
- Modify: `app/globals.css:586-610`

**Step 1: Write the minimal implementation**

Make `.mindmap-editor` a column flex container, make `.mindmap-commandbar` a non-positioned auto-sized flex item, and make `.showcase` a flexible zero-minimum-height item. Remove the fixed full-height requirement that causes the canvas to occupy the command bar's space.

**Step 2: Run the focused test to verify it passes**

Run: `npx jest app/globals.layout.test.ts --runInBand`

Expected: PASS.

### Task 3: Verify the complete change

**Files:**
- Test: `app/globals.layout.test.ts`
- Test: existing Jest suites

**Step 1: Run quality gates**

Run: `npm test -- --runInBand`, `npm run typecheck`, `npm run lint`, and `npm run build`.

Expected: all commands exit 0.

**Step 2: Verify responsive geometry**

Load the app CSS in a real browser and check desktop, short, narrow, and zoomed layouts. The command bar, save status, and map toolbar must have bounding boxes within the editor bounds.

**Step 3: Commit**

```bash
git add app/globals.css app/globals.layout.test.ts docs/plans/2026-09-22-zoom-responsive-controls-*.md
git commit -m "fix: keep mind map controls visible when zoomed"
```
