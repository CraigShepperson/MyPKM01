## Context

The repository contains architecture docs and an openspec config but no application code. Every technology in the stack has an official scaffold or CLI — the design principle is to use those tools exactly once, in the right order, and never handcraft what a tool can generate. The result must be a runnable Tauri desktop app (`pnpm tauri dev` passes) with all declared dependencies installed, a two-panel layout stub visible, and all three test harnesses (Vitest, Playwright, cargo test) green from the start.

## Goals / Non-Goals

**Goals:**
- Bootstrap the full project tree using official toolchains only
- Install every dependency declared in ARCHITECTURE.md at the pinned versions
- Produce a window that opens, renders the two-panel shell stub, and closes cleanly
- All three test suites pass with at least one smoke test each (`pnpm test`, `pnpm test:e2e`, `cargo test`)
- No handcrafted Vite, TypeScript, or Tailwind configs where the toolchain generates one

**Non-Goals:**
- Implementing any vault, editor, or AI feature — this is a skeleton only
- Production-quality Rust backend — only the crate scaffold and dependency list
- Internationalisation wiring beyond installing the i18n runtime deps
- shadcn/ui component library beyond what `shadcn init` generates by default

## Decisions

### 1. Scaffold order: Tauri CLI first, then layer dependencies

**Decision:** Run `pnpm create tauri-app@latest` with the `react-ts` template as the very first step. All subsequent dependency installs happen into that tree.

**Rationale:** The Tauri CLI is the only tool that can configure `tauri.conf.json`, the Cargo workspace, and the Vite config in a consistent, tested way. Installing React or Vite manually first risks version mismatches with what Tauri expects. Starting from the Tauri template then layering on top is the officially documented path.

**Alternatives considered:**
- _Vite first, then `pnpm add @tauri-apps/cli`_: Works but requires manually writing `tauri.conf.json` from scratch — violates the no-handcraft rule.
- _`create-vite` + `tauri init`_: `tauri init` requires an existing dist directory to detect the frontend; more ceremony for the same result.

---

### 2. Tailwind CSS v4 via `@tailwindcss/vite` — no PostCSS, no `tailwind.config.js`

**Decision:** Install `tailwindcss@^4` and `@tailwindcss/vite`, add the Vite plugin to `vite.config.ts`, and add `@import "tailwindcss"` to the root CSS file. Do not create `tailwind.config.js`.

**Rationale:** Tailwind v4 is CSS-first. The `@tailwindcss/vite` plugin handles content scanning automatically — no config file is needed. Creating a `tailwind.config.js` for v4 is deprecated and actively warned against.

**Alternatives considered:**
- _PostCSS plugin (`@tailwindcss/postcss`)_: Also supported, but the Vite plugin is faster (no PostCSS pipeline) and is the v4 default recommendation for Vite projects.

---

### 3. shadcn/ui via CLI with `--defaults` flag — non-interactive

**Decision:** Run `pnpm dlx shadcn@latest init --defaults` to avoid interactive prompts in CI. Accept all defaults (New York style, CSS variables, `src/components/ui` output path).

**Rationale:** shadcn/ui's init CLI wires Radix UI, CSS variables, and component paths. Running with `--defaults` is repeatable and scriptable. The "New York" style is the correct choice for this app's design language (compact, professional).

**Alternatives considered:**
- _Manual Radix UI + CSS variable setup_: Entirely handcrafted — ruled out.
- _Interactive init_: Non-deterministic in scripts; `--defaults` is idempotent.

---

### 4. Vitest for unit tests — already in the Tauri React template

**Decision:** The `pnpm create tauri-app` React + TypeScript template ships with Vitest pre-configured. Accept its `vitest.config.ts` as-is and add a single `src/App.test.tsx` smoke test (renders without crashing).

**Rationale:** Vitest is the natural test runner in the Vite ecosystem and is already configured by the template. No migration needed.

---

### 5. Playwright for E2E — use the official Tauri Playwright driver

**Decision:** Install `@playwright/test` and `@tauri-apps/api`. Use `pnpm dlx playwright install --with-deps chromium` for the browser binary. Create a `tests/e2e/` directory with a single smoke test that launches the Tauri window and asserts the page title.

**Rationale:** The official Tauri docs show Playwright as the recommended E2E tool. The Tauri WebDriver exposes a standard WebDriver interface; Playwright connects via its WebKit/Chromium driver.

**Alternatives considered:**
- _WebdriverIO_: Also officially supported but heavier setup; Playwright is simpler for smoke testing.

---

### 6. tldraw — install but wrap in a lazy-loaded boundary

**Decision:** Install `tldraw@4.5.10` but mount it inside a `React.lazy` + `Suspense` boundary in the editor pane stub. Do not render it eagerly on startup.

**Rationale:** tldraw is a large bundle (~2 MB). Lazy loading keeps initial TTI acceptable. More importantly, tldraw 4.x has had React 19 compatibility caveats — wrapping in a boundary means a render failure is isolated and doesn't break the shell.

**Risk mitigation:** If tldraw 4.5.10 fails to resolve peer deps against React 19, install with `--legacy-peer-deps` and file a note in the scaffold. The whiteboard view is not in the critical path for v1.

---

### 7. Mermaid — install and lazy-load; do not import at module level

**Decision:** Install `mermaid@11.14.0` but import it only inside the component that renders diagrams, using a dynamic `import()`. Mermaid registers global state on load; eager import breaks SSR-adjacent patterns and inflates the main bundle.

---

### 8. Rust workspace: single crate for now

**Decision:** Use the single `src-tauri` crate generated by the Tauri CLI. Add `notify`, `gray_matter`, and `walkdir` to `src-tauri/Cargo.toml` as dependencies (no features beyond defaults). Do not extract library crates yet.

**Rationale:** Splitting into a workspace with separate library crates is premature for a scaffold. The split can happen when vault-reading logic warrants isolation.

---

### 9. Window constraints enforced in `tauri.conf.json`

**Decision:** Set `minWidth: 800`, `minHeight: 560` in `tauri.conf.json` under `windows[0]`. Set `width: 1280`, `height: 800` as the default.

**Rationale:** These values are specified in ARCHITECTURE.md and cannot be enforced by CSS alone — they must be in the Tauri window config.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| tldraw 4.5.10 peer-dep conflict with React 19 | Install with `--legacy-peer-deps`; lazy-load so failure is isolated |
| BlockNote 0.46.2 may require specific Vite config (worker plugin) | Follow BlockNote's official Vite setup guide; add `@blocknote/vite-plugin` if required |
| Playwright Tauri WebDriver setup varies by platform | Pin Playwright version; document the `webDriver` launch args in `playwright.config.ts` |
| `pnpm create tauri-app` template may drift from pinned versions | Pin exact versions after scaffold via `pnpm add pkg@x.y.z`; lock file commits |
| Mermaid global state conflicts if imported twice | Single import point enforced via a wrapper module |
| shadcn `--defaults` picks CSS variable mode — must match Tailwind v4 `@theme` | Verify CSS variable names align post-init; adjust `globals.css` if needed |

## Open Questions

- Does `@modelcontextprotocol/sdk@1.0` have a peer dep conflict with the Vite/Node version in this project? → Verify at install time; if so, use `--legacy-peer-deps`.
- Should Playwright run against the Tauri WebDriver or against the Vite dev server in CI? → Start with Vite dev server for speed; switch to full Tauri binary for pre-release smoke runs.
