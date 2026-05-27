## Why

The repository has architecture docs but no code. Before any feature work can begin, the project needs a runnable skeleton that reflects every technology decision in the architecture — created via official toolchains rather than handcrafted config files.

## What Changes

- Run `pnpm create tauri-app` with the React + TypeScript template to bootstrap the Tauri v2 + Vite 7 + React 19 + TypeScript 5.9 project
- Install and configure Tailwind CSS v4 via the official Vite plugin (`@tailwindcss/vite`)
- Initialise shadcn/ui via the official CLI (`pnpm dlx shadcn@latest init`)
- Install editor-layer dependencies: BlockNote 0.46.2, @blocknote/code-block 0.46.2, CodeMirror 6, Mermaid 11.14.0, tldraw 4.5.10
- Install UI/icon dependencies: Phosphor Icons, Radix UI primitives
- Configure the Rust workspace with crates: `notify` 6.1, `gray_matter` 0.2, `walkdir`
- Configure Vitest for frontend unit tests and Playwright for E2E/smoke tests
- Set Tauri window constraints to 800×560 minimum and apply the two-panel shell layout stub
- Install `@modelcontextprotocol/sdk` 1.0

## Capabilities

### New Capabilities
- `app-shell`: Tauri v2 desktop window configuration — minimum size, IPC bridge wiring, Rust workspace layout, and build targets
- `frontend-base`: React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS v4 + shadcn/ui + Phosphor Icons base — the compiled, runnable frontend skeleton
- `editor-layer`: BlockNote + @blocknote/code-block + CodeMirror 6 + Mermaid + tldraw installed and mounted as a placeholder editor pane in the right panel
- `test-infrastructure`: Vitest (unit), Playwright (E2E/smoke), and `cargo test` (Rust) all configured and passing with at minimum one baseline smoke test each

### Modified Capabilities
(none — no existing specs)

## Impact

- **New files**: Entire project tree created from scratch — `src-tauri/` Rust crate, `src/` React frontend, `package.json`, `vite.config.ts`, Tailwind config, Playwright config, `vitest.config.ts`
- **Dependencies**: All frontend packages added to `package.json`; Rust crates added to `src-tauri/Cargo.toml`
- **No breaking changes** — this is the initial scaffold
