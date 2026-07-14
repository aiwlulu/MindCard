# MindCard

MindCard is a keyboard-first mind-mapping workspace for turning rough notes into connected, reusable structure. Write in Markdown, edit directly on the canvas, or keep both views open while they update together.

[Try MindCard](https://mind-card.vercel.app/) · [Report an issue](https://github.com/aiwlulu/MindCard/issues)

![MindCard turns Markdown into a live mind map](public/readme/mindcard-product-demo.gif)

## Why MindCard

- **Markdown and canvas stay in sync.** Switch between map, Markdown, and split view without maintaining two copies.
- **Designed for fast capture.** Add siblings with `Enter`, children with `Tab`, paste a bullet list into branches, and keep Chinese IME composition intact.
- **Built for large maps.** Collapse branches, see hidden-child counts, expand or collapse everything, recenter instantly, and pan without losing selection.
- **Links without visual noise.** Attach external URLs or private card links while keeping long addresses out of node labels.
- **Safe sharing.** Publish a revocable, read-only URL for anyone to view without exposing Markdown mode or private card links.
- **Portable output.** Export PNG, SVG, or Markdown from the editor. Public viewers can export PNG only.
- **Calm by default.** Right-growing layout, connected XMind-inspired branches, muted rainbow families, autosave, undo, and redo.

## Editor controls

| Action | Shortcut |
| --- | --- |
| Add child | `Tab` |
| Add sibling | `Enter` |
| Edit selected node | `F2` |
| Collapse or expand branch | `Space` |
| Move between siblings | `↑` / `↓` |
| Move to parent or child | `←` / `→` |
| Pan mode | `H` |
| Undo / redo | `Cmd/Ctrl + Z` / `Cmd/Ctrl + Shift + Z` |

Right-drag and middle-drag also browse the canvas. Left-drag remains available for multi-selection and reparenting.

## Local development

Requirements: Node.js 20+ and a Firebase project with Authentication and Firestore enabled.

```bash
git clone https://github.com/aiwlulu/MindCard.git
cd MindCard
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Add your Firebase web-app values to `.env.local`:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Without a valid API key Firebase Auth will fail during startup with `auth/invalid-api-key`.

### Demo account

The hosted app currently provides a prefilled demo login:

```text
Email: demo@gmail.com
Password: 123456
```

## Public sharing

Public maps use `/share/{documentId}` and are read-only for signed-out visitors. Private card links are removed from the public tree; external URLs remain available and open in a new tab.

Publishing writes a separate, sanitized snapshot to `publicMindmaps/{documentId}`. Anonymous visitors never read the owner's private `mindmaps/{documentId}` document, so future private-only fields do not become public by accident.

The required Firestore rules are included in [`firestore.rules`](firestore.rules). Deploy them to the matching Firebase project before enabling public links in production:

```bash
firebase deploy --only firestore:rules
```

Turning sharing off immediately revokes anonymous access under these rules.

## AI integration roadmap

MindCard does not currently expose an AI write API. The planned approach is **API first, MCP adapter second**: one narrow, versioned service owns authentication, validation, authorization, and tree updates; an MCP server can then expose the same operations without receiving raw Firebase or administrator credentials.

The first release should begin read-only with `mindmap.list`, `mindmap.get`, and `mindmap.search`. Write access can follow through `mindmap.preview_patch`, `mindmap.apply_patch`, and `mindmap.create_from_markdown` rather than a broad “run arbitrary update” tool.

Safety requirements for that integration:

- Use OAuth 2.1 for remote MCP access, validate the token audience, and split least-privilege scopes such as `maps:read`, `maps:write`, and `maps:publish`.
- Require a `baseVersion` and idempotency key for writes so stale or repeated AI requests cannot silently overwrite newer work.
- Return a preview/dry-run diff before mutations and require human confirmation for destructive or publishing actions.
- Keep an audit trail, preserve undo history, validate tool input and output schemas, and enforce map-level access, rate limits, and payload limits.

These choices follow the official MCP guidance for [OAuth-based authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) and [human-in-the-loop tool execution](https://modelcontextprotocol.io/specification/2025-11-25/server/tools).

## Quality checks

```bash
npm test -- --runInBand
npx tsc --noEmit --incremental false
npm run build
```

The explicit `--incremental false` keeps the type check read-only and avoids creating `tsconfig.tsbuildinfo` in restricted worktrees.

## Architecture

MindCard no longer depends on a mind-map rendering package. The editor is implemented in TypeScript with React and native SVG primitives:

- `lib/mindmap/layout.ts` — deterministic right-growing tree layout
- `lib/mindmap/tree.ts` — structural edits, movement, collapse, and reparenting
- `lib/mindmap/markdown.ts` — Markdown outline parsing and serialization
- `lib/mindmap/export.ts` — PNG, SVG, and Markdown export
- `components/MindMap.tsx` — canvas interaction, keyboard flow, split view, and autosave UI
- `components/PublicMindMapViewer.tsx` — isolated read-only public renderer
- Firebase Auth + Firestore Lite — authentication and persistence

## Stack

- Next.js 16
- React 19
- TypeScript
- Firebase Authentication and Firestore
- Jest and Testing Library
- Tailwind CSS plus product-specific CSS

## Contact

Yu Ru Ding · s9341729@gmail.com
