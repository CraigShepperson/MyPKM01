# Architecture

MyPKM is a personal knowledge app. It reads a vault of markdown files with YAML frontmatter and presents them in a two-panel UI inspired by Obsidian.

MyPKM is built on Tauri — a Rust backend with a web-based frontend. This choice is load-bearing: Rust gives direct, safe access to the local filesystem and Git without the overhead of a Node.js runtime. The web frontend provides cross-platform UI with a single codebase. The two communicate over Tauri's IPC bridge.

The vault is the centre of gravity. Everything — sync, Git, MCP, search — is a Rust service that reads from and writes to the local filesystem. The frontend is a thin display layer. No business logic lives in the frontend.

## Design Principles

### Filesystem as the single source of truth

The vault is a folder of plain markdown files. The app never owns the data — it only reads and writes files. The cache, React state, and any in-memory representation are always derived from the filesystem and must be reconstructible by deleting them. When in doubt, the file on disk wins.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop shell | Tauri v2 | 2.10.0 |
| Frontend | React + TypeScript | React 19, TS 5.9 |
| Editor | BlockNote | 0.46.2 |
| Code block highlighting | @blocknote/code-block | 0.46.2 |
| Diagram rendering | Mermaid | 11.14.0 |
| Whiteboard rendering | tldraw | 4.5.10 |
| Raw editor | CodeMirror 6 | - |
| Styling | Tailwind CSS v4 + CSS variables | 4.1.18 |
| UI primitives | Radix UI + shadcn/ui | - |
| Icons | Phosphor Icons | - |
| Build | Vite | 7.3.1 |
| Backend language | Rust (edition 2021) | 1.77.2 |
| Frontmatter parsing | gray_matter | 0.2 |
| Filesystem watcher | notify | 6.1 |
| AI (agent panel) | CLI agent adapters (Claude Code + Codex + OpenCode + Pi + Gemini + Kiro) | - |
| Search | Keyword (walkdir-based file scan) | - |
| Localization | App-owned runtime + JSON catalogs (`src/lib/i18n.ts`, `src/lib/locales/*.json`, `lara.yaml`) | English fallback + Lara CLI sync |
| MCP | @modelcontextprotocol/sdk | 1.0 |
| Tests | Vitest (unit), Playwright (E2E/smoke), cargo test (Rust) | - |
| Package manager | pnpm | - |

## User Interface

The app shell is a fixed two-panel layout: a left panel (date tree navigation) and a right panel (editor), with a persistent topbar and query bar. There is no sidebar. The left panel is fixed width. The right panel fills the remaining space.

```
┌─────────────────┬──────────────────────────────┐
│ topbar (44px)   │ topbar (44px)                │
├─────────────────┼──────────────────────────────┤
│ left panel      │ right panel (editor)         │
│ (340px)         │ (fills remaining width)      │
│ scrollable      │ scrollable                   │
├─────────────────┴──────────────────────────────┤
│ query bar (52px)                               │
└────────────────────────────────────────────────┘
```

- Left panel width is fixed at 340px — not resizable in v1
- Topbar is fixed at 44px — split across both panels contextually
- Query bar is fixed at 52px — always visible, spans full window width
- Each panel scrolls independently — no nested scroll containers
- The divider between panels is `1px` at `--color-border` — very subtle, not decorative
- Minimum window size: 800px × 560px — enforced by Tauri window constraints

## The Vault

The vault is a directory on the user's disk. It is a valid Git repository. All content is plain Markdown with YAML front matter. No binary files, no database, no lock files. The vault is the source of truth — not the application's in-memory state.

```
vault/
  .git/                   ← standard Git repo
  .gitignore
  _config.md              ← vault settings (YAML front matter)
  timeline/               ← date index (stubs only)
    YYYY-MM-DD
```

---
### Getting Started Vault

On first launch, `useOnboarding` checks if the default vault exists. If not, it shows `WelcomeScreen` with three options:
- **Create a new vault** → creates an empty git repo in a folder the user chooses
- **Open an existing folder** → system file picker; plain Markdown folders without `.git` open immediately in supported non-git mode

If the selected vault disappears after startup, `useVaultLoader` re-checks `check_vault_exists` when reloads or vault-derived surfaces fail. A confirmed missing path clears cached entries, folders, views, modified-file state, and prefetched note content, then `App` reuses the `vault-missing` `WelcomeScreen` state so note and view actions cannot keep targeting the stale active vault.


