## 1. Bootstrap with Tauri CLI

- [x] 1.1 Run `pnpm create tauri-app@latest . --template react-ts --manager pnpm` in the repo root to generate the Tauri v2 + React 19 + TypeScript 5.9 + Vite 7 project tree
- [x] 1.2 Confirm the generated `src-tauri/tauri.conf.json`, `vite.config.ts`, `tsconfig.json`, and `package.json` exist and are valid
- [x] 1.3 Run `pnpm install` to install the generated dependencies
- [x] 1.4 Run `pnpm tauri dev` and confirm a native window opens and the default React app renders without console errors

## 2. Tailwind CSS v4

- [x] 2.1 Run `pnpm add -D tailwindcss@^4 @tailwindcss/vite` to install Tailwind v4 and its Vite plugin
- [x] 2.2 Add `import tailwindcss from '@tailwindcss/vite'` and `tailwindcss()` to the `plugins` array in `vite.config.ts`
- [x] 2.3 Replace the contents of `src/index.css` (or the root stylesheet) with `@import "tailwindcss";` at the top, followed by any existing reset styles
- [x] 2.4 Delete `tailwind.config.js` or `tailwind.config.ts` if created — Tailwind v4 requires no config file
- [x] 2.5 Add a `bg-blue-500` class to a root element, run `pnpm dev`, and confirm the colour appears in the browser

## 3. shadcn/ui

- [x] 3.1 Run `pnpm dlx shadcn@latest init --defaults` to initialise shadcn/ui non-interactively (New York style, CSS variables, `src/components/ui` output)
- [x] 3.2 Run `pnpm dlx shadcn@latest add button` to install the first component
- [x] 3.3 Verify `src/components/ui/button.tsx` exists and `import { Button } from '@/components/ui/button'` resolves in TypeScript without errors
- [x] 3.4 Confirm `--background`, `--foreground`, `--primary`, and `--radius` CSS variables are declared in the global stylesheet

## 4. Frontend dependencies

- [x] 4.1 Run `pnpm add @phosphor-icons/react` and confirm `import { House } from '@phosphor-icons/react'` resolves without TypeScript errors
- [x] 4.2 Run `pnpm add @blocknote/react@0.46.2 @blocknote/core@0.46.2 @blocknote/code-block@0.46.2` to install BlockNote at the pinned versions
- [x] 4.3 Run `pnpm add codemirror @codemirror/state @codemirror/view @codemirror/lang-markdown` to install CodeMirror 6 core packages
- [x] 4.4 Run `pnpm add mermaid@11.14.0` to install Mermaid at the pinned version
- [x] 4.5 Run `pnpm add tldraw@4.5.10` — if peer dependency conflicts arise with React 19, retry with `--legacy-peer-deps` and add a comment in `package.json` documenting the flag
- [x] 4.6 Run `pnpm add @modelcontextprotocol/sdk@1.0` — if peer conflicts arise, resolve with `--legacy-peer-deps` and document

## 5. Rust crate dependencies

- [x] 5.1 Add `notify = "6.1"` to the `[dependencies]` section of `src-tauri/Cargo.toml`
- [x] 5.2 Add `gray_matter = "0.2"` to `src-tauri/Cargo.toml`
- [x] 5.3 Add `walkdir = "2"` to `src-tauri/Cargo.toml`
- [x] 5.4 Run `cargo build` inside `src-tauri/` and confirm it exits 0 with all three crates resolved

## 6. Window constraints

- [x] 6.1 In `src-tauri/tauri.conf.json`, set `windows[0].minWidth` to `800` and `windows[0].minHeight` to `560`
- [x] 6.2 Set `windows[0].width` to `1280` and `windows[0].height` to `800` as the default launch size
- [x] 6.3 Run `pnpm tauri dev`, attempt to resize the window below 800×560, and confirm the OS enforces the constraint

## 7. Two-panel layout shell

- [x] 7.1 Create `src/components/AppShell.tsx` with the fixed layout: a 44px topbar `div`, a 340px-wide left panel `div`, a right panel `div` that fills remaining width, and a 52px query bar `div` pinned to the bottom — all with placeholder background colours from Tailwind
- [x] 7.2 Replace the default `App.tsx` body with `<AppShell />` so the layout is the app root
- [x] 7.3 Open the app in `pnpm dev` and confirm the four layout regions are visible at the correct dimensions using browser DevTools

## 8. Editor layer stubs

- [x] 8.1 Create `src/components/editor/BlockNoteEditor.tsx` that imports `@blocknote/react` and renders a `<BlockNoteView>` with an empty document; mount it inside the right panel of `AppShell`
- [x] 8.2 Create `src/components/editor/MermaidBlock.tsx` that on mount performs `const mermaid = await import('mermaid')` then calls `mermaid.default.initialize({ startOnLoad: false })` — no static top-level import
- [x] 8.3 Create `src/components/editor/WhiteboardPane.tsx` that uses `React.lazy(() => import('./WhiteboardPaneInner'))` and a `Suspense` fallback; the inner component renders `<Tldraw />` from `tldraw`
- [x] 8.4 Add `import { EditorView } from '@codemirror/view'` in a comment block or a `codemirror.ts` barrel file to confirm the symbol resolves — the raw editor is not wired to UI in the scaffold

## 9. Test infrastructure

- [x] 9.1 Confirm `vitest.config.ts` (or equivalent in `vite.config.ts`) exists from the Tauri template; install `@testing-library/react` and `@testing-library/jest-dom` if not already present
- [x] 9.2 Create `src/App.test.tsx` with a smoke test: render `<App />` in a testing-library environment and assert it does not throw
- [x] 9.3 Run `pnpm test` and confirm Vitest exits 0 with the smoke test passing
- [x] 9.4 Run `pnpm add -D @playwright/test` to install Playwright
- [x] 9.5 Run `pnpm dlx playwright install --with-deps chromium` to install the Chromium browser binary
- [x] 9.6 Create `playwright.config.ts` at the project root with a `webServer` pointing to `pnpm dev` on the Vite port, and a `baseURL` of `http://localhost:1420` (the Tauri Vite default)
- [x] 9.7 Create `tests/e2e/smoke.spec.ts` with one test: navigate to `baseURL` and assert `await page.title()` is truthy (or a root element is visible)
- [x] 9.8 Add `"test": "vitest run"`, `"test:watch": "vitest"`, and `"test:e2e": "playwright test"` scripts to `package.json`
- [x] 9.9 Run `pnpm test:e2e` and confirm Playwright exits 0 with the smoke test passing
- [x] 9.10 Run `cargo test` inside `src-tauri/` and confirm the scaffold-generated Rust tests pass

## 10. Final verification

- [x] 10.1 Run `pnpm build` and confirm TypeScript emits zero errors and Vite produces a `dist/` bundle
- [x] 10.2 Run `pnpm test` — all Vitest tests pass
- [x] 10.3 Run `pnpm test:e2e` — all Playwright tests pass
- [x] 10.4 Run `cargo test` inside `src-tauri/` — all Rust tests pass
- [x] 10.5 Run `pnpm tauri dev` and do a final visual check: topbar, left panel, BlockNote editor in right panel, and query bar are all visible
