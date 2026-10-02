# PRD: Personal Browser Homepage - "Anchor"

## 1. Summary

A single-user, no-backend, local-first personal homepage web app — a customizable dashboard (bookmarks, boards, to-dos, theming, wallpaper) that any browser can point to as its homepage. State lives entirely in `localStorage` and is portable across browsers/devices via manual JSON export/import. No accounts, no server, no sync service.

Reference: Minimalista (browser extension) — replicate its feature set as a hosted web app instead of an extension.

## 2. Problem Statement

Browser extension homepages (e.g. Minimalista) are locked to a single browser profile, require separate packaging/review per browser store (Chrome Web Store, Firefox AMO, Edge Add-ons, Safari App Store), and have no meaningful path to multi-device use without a backend. A plain web app removes all of that: any browser can set a URL as its homepage natively, and portability is solved with export/import instead of infrastructure.

## 3. Goals

- Replicate Minimalista's core UX: sidebar pages, draggable link/bookmark boards, to-do list, live theming, wallpaper backgrounds, settings panel.
- Fully client-side. No database, no auth, no server-side state.
- Data portability via explicit export (download `.json`) and import (upload `.json`), usable across any browser or device — not restricted to "same browser type."
- Fast load — this is a homepage; it opens on every new tab/window.

## 4. Non-Goals (v1)

- No user accounts, no multi-user support, no real-time sync.
- No automatic cross-device sync (manual export/import only).
- No wallpaper hosting — wallpapers are either bundled presets (by ID) or user-supplied external image URLs. No file upload/base64 storage.
- No browser extension packaging.

## 5. Users

Single persona: the builder (you), using this as a personal daily-driver new-tab/homepage across 1+ machines, manually re-syncing state occasionally via export/import.

## 6. Core Features

### 6.1 Sidebar / Pages
- List of named "pages" or "spaces" (e.g. Work, Space).
- Add, rename, delete pages.
- Active page highlighted per theme accent color.

### 6.2 To-Do List
- Simple checklist scoped to a page or global (decide in design phase).
- Add, check/uncheck, delete tasks.

### 6.3 Boards (Link Groups)
- Named boards (e.g. "Research", "GitHub") containing link cards.
- Each link card: title, URL, optional favicon (fetched client-side via a favicon service, not stored).
- Add/edit/delete board; add/edit/delete link within a board.
- Drag-and-drop reordering of links within and across boards (`dnd-kit`).
- "Drop links here" empty state.

### 6.4 Quick Search / Address Bar
- Top search bar: search via selected engine or navigate directly if input is a URL.
- Configurable search engine (Google, and a short curated list — extensible later).

### 6.5 Theming
- Preset themes (named gradient triples: top/middle/bottom), e.g. Slate, Violet, Emerald, Graphite, Rose, Ocean, Sunset, Forest.
- Custom theme: user picks top/middle/bottom colors directly, "Use custom theme" / "Reset colors."
- Implementation: CSS custom properties (`--color-top`, `--color-middle`, `--color-bottom`), preset switch = swap variable values only.

### 6.6 Wallpaper
- Preset wallpapers, referenced by ID (bundled assets), not stored in export.
- Custom wallpaper via external image URL (no upload/storage) — stored as a URL string in state.
- Wallpaper opacity mode: "Pure visible" / "Semi transparent."

### 6.7 Panel Visibility & Label Colors
- Panel visibility modes: Visible / Semi visible / Pure transparent.
- Label color pickers: active-page accent, "+Link" button accent (and similar UI accents as needed).

### 6.8 Bookmark Display Mode
- Toggle: "Title + URL" vs. other display density (title only, etc.) — mirror source app's option set during design.

### 6.9 Trash / Restore
- Soft-delete boards/links/pages into a `trash` array instead of hard delete.
- "Restore latest bookmark (N)" — restore most recent deleted item; N = trash count.

### 6.10 Export / Import
- Export: serialize full state object → download as `anchor-export-<timestamp>.json`.
- Import: file picker → parse → **schema validation** → replace or merge state → re-render.
- Must work across any browser/OS combination — no browser-specific serialization.

## 7. Data Model (draft)

```ts
interface AppState {
  version: 1; // bump on breaking schema changes; enables migration
  theme: {
    presetId: string | 'custom';
    custom: { top: string; middle: string; bottom: string };
  };
  wallpaper: {
    presetId: string | 'custom';
    customUrl?: string;
    opacityMode: 'visible' | 'semi-transparent';
  };
  searchEngine: string; // e.g. 'google' | 'bing' | 'duckduckgo'
  panelVisibility: 'visible' | 'semi-visible' | 'pure-transparent';
  bookmarkDisplay: 'title-url' | 'title-only';
  labelColors: {
    activePage: string;
    linkButton: string;
  };
  pages: Page[];
  boards: Board[];
  todos: Todo[];
  trash: TrashedItem[];
}

interface Page {
  id: string;
  name: string;
  order: number;
}

interface Board {
  id: string;
  pageId: string; // which page this board belongs to
  title: string;
  order: number;
  links: LinkItem[];
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  order: number;
}

interface Todo {
  id: string;
  pageId: string | null; // null = global
  text: string;
  done: boolean;
  order: number;
}

interface TrashedItem {
  id: string;
  type: 'board' | 'link' | 'page' | 'todo';
  deletedAt: string; // ISO timestamp
  payload: unknown; // original object, for restore
}
```

**Migration strategy**: on import, check `version`. If older than current, run sequential migration functions (`migrateV1toV2`, etc.) before loading into app state. Never assume an imported file matches the current shape.

## 8. Architecture & Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Build tool | Vite | Fast dev server, minimal config for a client-only SPA |
| Framework | React | Team familiarity, large ecosystem |
| State management | Zustand (or React Context if state stays small) | Lightweight, avoids Redux boilerplate for a single-user app |
| Persistence | `localStorage`, debounced writes on state change | No backend; synchronous, simple |
| Drag & drop | `dnd-kit` | Actively maintained (react-beautiful-dnd is not) |
| Styling | CSS custom properties + plain CSS/Tailwind (decide in design phase) | Theming via variables, not conditional classes |
| Routing | None required for v1 (single view + modal settings) | Reduces complexity; add if `/settings` as a real route becomes valuable |
| Hosting | Static host (Netlify, Vercel, Cloudflare Pages) | Pure static SPA, no server needed |
| Favicon fetching | Client-side favicon service (e.g. Google's `s2/favicons` or similar) called per link, not stored in state | Avoids bloating export with images |

## 9. Key Risks

- **Schema drift**: adding features changes state shape; unversioned exports become unusable. Mitigation: `version` field + migration functions from day one (already reflected in §7).
- **`localStorage` size limits** (~5–10MB per origin): unlikely to be hit with links/text, but wallpaper `customUrl` strings and large boards should be watched. No images stored directly, which keeps this low-risk.
- **Broken import files**: malformed or hand-edited JSON. Mitigation: validate shape (e.g. with `zod`) before committing to state; reject with a clear error rather than partially applying.
- **Favicon service dependency**: relying on a third-party favicon endpoint means links visually degrade if that service goes down. Low severity — cosmetic only.
- **Single point of failure for data**: no backend means no automatic backup. User is responsible for periodic exports. Consider a "last exported: X days ago" reminder as a v1.1 feature.

## 10. Out of Scope / Explicitly Deferred

- Real accounts / multi-user / shared boards.
- Automatic sync (would require a backend — explicitly rejected for this project).
- Wallpaper upload & storage.
- Extension packaging for any browser.
- Mobile-specific layout (v1 targets desktop browser homepage use case).

## 11. Milestones (suggested phasing)

1. **Skeleton**: Vite+React app, state store, localStorage persistence, empty layout.
2. **Boards + Links**: CRUD + drag-drop within/across boards.
3. **Pages + Todos**: sidebar pages, to-do list.
4. **Theming + Wallpaper**: presets, custom colors, custom wallpaper URL, opacity modes.
5. **Settings panel**: panel visibility, label colors, bookmark display mode, search engine.
6. **Trash/Restore**.
7. **Export/Import** with schema versioning and validation.
8. **Polish**: favicon fetching, empty states, keyboard support.

## 12. Naming

Options, evaluated against: short, memorable, not already a saturated app name, doesn't overcommit to one feature (avoid "Board" or "Link" in the name):

- **Anchor** — evokes "homepage as your anchor point"; short; slight collision with anchor tags in web dev (minor, not a real conflict).
- **Basecamp-adjacent names avoided** — "Base," "Basepoint" collide too closely with existing SaaS products.
- **Harborline** — nautical "home port" metaphor, distinctive, slightly longer.
- **Threshold** — "the page you land on"; abstract enough to not overcommit to any one feature.
- **Alcove** — "a personal nook"; underused, evocative, easy to say.

Recommendation: **Anchor**, with **Alcove** as the runner-up if you want something less generically used in tech branding.