# QueryPro AI

An AI-powered SQL query generator and database workspace — built with Next.js
14 (App Router), TypeScript, and Tailwind CSS, implementing the "Core Logic"
design system defined in `DESIGN.md`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/dashboard`.

## Database setup

1. Create a Supabase project.
2. Copy [.env.example](.env.example) to `.env` and add both database URLs:
   - `DATABASE_URL` should use the pooled connection string from Supabase with port `6543`.
   - `DIRECT_URL` should use the direct connection string from Supabase with port `5432`.
   You can find both in Supabase under Project Settings → Database → Connection string.
3. Run `npx prisma generate`.
4. Run `npx prisma db push`.

To build for production:

```bash
npm run build
npm run start
```

> **Note on fonts:** this project loads Inter, Public Sans, and JetBrains Mono
> via a standard `<link>` tag in `src/app/layout.tsx` rather than
> `next/font/google`, so it builds correctly in network-restricted
> environments (CI runners, sandboxed containers) that can't reach
> `fonts.googleapis.com` at build time. In a normal environment with internet
> access this works identically — Next.js will still detect and optimize the
> stylesheet link automatically.

## Project structure

```
src/
  app/
    layout.tsx           Root layout: fonts, metadata
    page.tsx              Redirects to /dashboard
    dashboard/            Overview: stats, recent activity, quick actions
    workspace/            The core multi-pane view: schema + chat + editor + results
    chat/                 Standalone AI Chatbot
    schema/                Schema Explorer
    history/               Query History
    settings/              Account, connections, notifications, API keys
  components/
    layout/                AppShell, TopNavBar, Sidebar
    ui/                     Button, Chip, Card, IconButton, icon-map
    sql/                    CodeBlock, SqlEditorPanel (read-only monitor),
                            SqlCodeEditor + SqlWorkspaceEditor (editable),
                            ResultsConsole
    chat/                   ChatPanel, ChatMessage, ChatInput, ChatRightRail
    schema/                 SchemaTree, ColumnsTable, PreviewPanel
    history/                HistoryTable, InsightsPanel
  lib/
    types.ts                Shared domain types
    mock-data.ts             Centralized mock data (schemas, chat, history, etc.)
    sql-highlight.tsx        Regex-based SQL tokenizer + highlighter
    utils.ts                 cn(), formatters
```

## Phase 1 redesign (dark-mode-native, drawer nav)

This build supersedes the original light "enterprise dashboard" version with
a premium, dark-mode-native redesign:

- **Two real themes.** Colors are CSS variables (`:root` = dark default,
  `html.light` = override), wired into `tailwind.config.ts` via
  `rgb(var(--color-x) / <alpha-value>)`. The header's theme toggle
  (`components/ui/ThemeToggle.tsx`) flips the `.light` class and persists
  the choice to `localStorage`; a blocking inline script in `layout.tsx`
  applies it before paint to avoid a flash of the wrong theme.
- **No permanent sidebar.** `NavDrawer` is an on-demand, animated overlay
  (opened via the header hamburger or ⌘K), not fixed screen real estate.
  It closes on item click, backdrop click, or Escape.
- **Command palette** (`⌘K` / click the search bar): fuzzy-searchable list
  of pages and quick actions, full keyboard navigation.
- **Redesigned home dashboard**: welcome hero, quick-action cards, stats,
  recent queries, favorite templates, pinned tables, recent connections,
  learning center.
- **New, real (non-placeholder) pages**: `/templates` (functional gallery
  with copy/run actions), `/saved` (favorited queries from history), `/help`
  (shortcuts, FAQ, support links). `/builder` (Manual SQL Builder) is
  honestly framed as an in-progress feature with a real preview of what's
  coming — see the roadmap note in the page itself.
- **Global 404 page** (`app/not-found.tsx`) replaces dead-end broken links.

**Deliberately dark-invariant surfaces:** the nav drawer and all code/editor
surfaces stay a fixed dark color regardless of theme — consistent with the
original design rule that "technical/utility" chrome is always dark. Their
text tokens (`primary-fixed-dim`, `secondary-fixed-dim`, `text-white/*`,
etc.) are plain hex, not theme-variables — don't swap them for adaptive
tokens like `on-surface-variant`, or they'll go dark-on-dark in dark mode.

**Not yet in this phase** (see the roadmap in-chat for sequencing):
AI SQL Generator page rebuild (centered-prompt layout), Workspace pane
rebalancing, the full Manual SQL Builder (drag-drop/join builder/clause
builders), and a broader animation/loading-state polish pass.

`DESIGN.md` and the four source mockups (Chatbot, Dashboard/Builder, Schema
Explorer, Query History) were generated independently and drifted slightly
from each other. This build reconciles them into one consistent token set in
`tailwind.config.ts`:

- **`primary`** is standardized on Logic Blue `#4680FF`, per DESIGN.md's prose
  ("Colors") and the majority of the mockups. The frontmatter's `#0054cd` is
  kept as `primary-legacy` for reference and isn't used.
- **`background`** is standardized on the `#F4F7FE` canvas from "Surface
  Strategy" — the light main-canvas / dark-utility-zone split described
  throughout DESIGN.md (sidebar + code blocks are the only dark surfaces).
- **`accent-ai`** (`#7267EF`) is a new, deliberate addition: a distinct hue
  reserved for AI/assistant-specific moments (bot avatars, the chat sparkle
  icon, execution-plan callouts), so "the AI is doing something" reads
  differently from ordinary interactive blue.
- Typography, spacing, radii, and elevation scales are ported directly from
  `DESIGN.md`'s frontmatter.

## Phase 2 (AI SQL Generator rebuild + Workspace rebalancing)

- **AI SQL Generator (`/chat`) rebuilt from scratch.** Opens on a large,
  centered prompt (`components/generator/PromptHero.tsx`) with the six
  suggestion chips from the brief. Once a query is generated, the view
  switches to a full toolbar (`GeneratorToolbar.tsx`) — Copy, Download
  (real `.sql` file), Save, Share, Explain, Optimize, dialect switcher, Run
  Query — over a genuinely editable, syntax-highlighted SQL editor. Explain
  / Optimize reveal dismissible inline panels rather than being buried in a
  menu ("everything visible, nothing hidden"). Session history is a slide-
  over drawer; a persistent follow-up input at the bottom lets you keep
  generating without returning to the hero screen.
- **Toast system added** (`components/ui/Toast.tsx`, `ToastProvider` wraps
  the app in `layout.tsx`) for Copy/Save/Download confirmations — reusable
  anywhere via `useToast()`.
- **Workspace (`/workspace`) rebalanced.** The SQL editor is now the
  dominant pane and always fills the remaining space; the AI chat is a
  collapsible fixed-width (380px) side panel, closed by default, opened via
  a header toggle or the vertical "Ask AI" rail — directly fixing "AI chat
  and SQL editor compete for attention."
- The old chat-bubble `/chat` implementation (`ChatPanel`, `ChatMessage`,
  `ChatInput`) is still used, but now only inside the Workspace's collapsible
  assistant panel, where a conversational format still fits. `ChatRightRail`
  (schema-context/execution-plan sidebar) was specific to the old `/chat`
  layout and has been removed as dead code.

**Still not done as of Phase 2:** the full Manual SQL Builder feature — see
Phase 3 below, which delivers it. A broader animation/loading-state polish
pass across all pages remains open.

## Phase 3 (Manual SQL Builder)

A real, from-scratch no-AI query builder at `/builder`, replacing the
honest "in progress" placeholder from Phase 1:

- **Drag-and-drop tables** (`components/builder/TablePalette.tsx` +
  `QueryCanvas.tsx`) using the native HTML5 Drag and Drop API — no extra
  dependency. Click-to-add is also supported, since drag-only interactions
  aren't reliably keyboard/touch accessible.
- **Column picker** with per-column checkboxes and an aggregate function
  selector (`NONE/COUNT/SUM/AVG/MIN/MAX`) right on each table card.
- **Join builder** (`JoinBuilder.tsx`) with structured, editable rows
  (type + left/right table.column pickers). FK relationships between
  tables already on the canvas are auto-detected and offered as one-click
  "suggested joins" in `QueryCanvas.tsx` — a lighter-weight stand-in for a
  full node-graph relationship viewer, which would be a project of its own.
- **WHERE / HAVING** share one generic `ConditionBuilder.tsx` (same row
  shape, different keyword/validation rules) — connector (AND/OR), operator,
  and value, with `IS NULL`/`IS NOT NULL` correctly hiding the value field.
- **GROUP BY**, **ORDER BY** (with up/down reordering), and **LIMIT**.
- **Live SQL preview** (`SqlPreviewPanel.tsx`) regenerates on every change
  via a pure `buildSqlFromState()` function (`lib/sql-builder.ts`) — fully
  decoupled from React, so the SQL-generation logic is unit-testable on its
  own.
- **Validation** runs alongside generation and surfaces plain-language
  errors (missing table, unresolved join, empty condition value, HAVING
  without GROUP BY, etc.); Run Query is disabled while errors exist, but
  Preview/Export are not, so you can always see and grab the SQL.
- **Undo/redo** via full-state snapshots. Discrete actions (adding a table,
  toggling a column, changing a dropdown) snapshot immediately; continuous
  text input (aliases, condition values, the LIMIT field) debounces so
  typing doesn't fragment into one undo step per keystroke.
- **Run / Export / Save** — Run simulates execution and shows results in the
  same `ResultsConsole` used elsewhere; Export downloads a real `.sql` file;
  Save toggles a local "saved" state with toast feedback (mirrors the
  AI Generator's Save behavior).

## Phase 4 (final polish pass)

- **Loading states, for real.** `useSimulatedLoad` + `LoadingReveal` +
  `Skeleton`/`PageSkeleton`/`WorkspaceSkeleton` (`components/ui/`) give every
  content page a brief, genuine skeleton before fading in — wired into
  Dashboard, AI SQL Generator, Workspace, Schema Explorer, Query History,
  Templates, Saved Queries, Manual SQL Builder, Settings, and Help.
  `LoadingReveal` is deliberately its own small client component so
  server-component pages (Dashboard, Help) keep their `metadata` export
  instead of being forced to convert to client components just to show a
  skeleton.
- **Onboarding.** A first-visit welcome modal (`OnboardingModal.tsx`,
  gated by `localStorage`) introduces the three core workflows (AI
  Generator, Manual Builder, Schema Explorer) once, ever.
- **Micro-interactions.** `Button` now has a real click ripple (position-
  aware, CSS keyframe-driven) alongside the existing 98%-scale press effect.
- **Code-splitting.** `NavDrawer`, `CommandPalette`, `OnboardingModal`, and
  the AI Generator's session-history drawer are all loaded via
  `next/dynamic` — none of them are needed for first paint (drawer/palette
  start closed, onboarding shows once), so they're kept out of the initial
  route bundle.
- **Consolidated duplicate empty-state code.** `ColumnsTable` had its own
  local `EmptyTabState` that duplicated `components/ui/EmptyState.tsx`;
  it now uses the shared component like every other page.

## Key implementation details

- **The SQL Workspace (`/workspace`) is genuinely editable**, not just a
  static highlighted `<pre>`. `SqlCodeEditor` layers a transparent-text
  `<textarea>` over a syntax-highlighted `<pre>` with synced scroll position
  — the standard lightweight technique for a real "type and see highlighting
  update live" editor without pulling in a full CodeMirror/Monaco dependency.
- **SQL highlighting** (`lib/sql-highlight.tsx`) is a small regex tokenizer
  shared by the chat panel, workspace editor, dashboard monitor, and history
  detail rows, so every surface treats keywords/strings/numbers/comments
  identically.
- **All icon-only buttons** go through the `IconButton` primitive, which
  requires `aria-label` at the type level.
- **Mock data lives in one place** (`lib/mock-data.ts`), typed against
  `lib/types.ts`, so swapping in real API calls later means replacing the
  data source, not the components.

## What's mocked vs. wired

This is a complete frontend implementation with realistic, interactive mock
behavior (simulated query execution/timing, a working chat loop, filterable
history, live schema navigation) — there's no backend. To go to production
you'd wire:

- `ChatPanel`'s `appendMessage` → your LLM routing endpoint
- `WorkspacePage`'s `runQuery` → your actual query execution service
- `lib/mock-data.ts` → real schema introspection + history API calls

**Testing tip:** the app uses two `localStorage` keys — `querypro-theme`
(dark/light preference) and `querypro-onboarding-seen` (welcome modal).
Clear them in your browser's dev tools (Application → Local Storage) to
reset either during testing.
