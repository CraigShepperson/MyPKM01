## ADDED Requirements

### Requirement: Frontend builds and runs without errors
The React 19 + TypeScript 5.9 + Vite 7 frontend SHALL compile (`pnpm build`) and run in dev mode (`pnpm dev`) without TypeScript errors or build failures. The compiled output SHALL be the bundle Tauri serves to its webview.

#### Scenario: TypeScript compilation
- **WHEN** the developer runs `pnpm build`
- **THEN** `tsc --noEmit` passes with zero type errors and Vite produces a dist bundle

#### Scenario: Dev server starts
- **WHEN** the developer runs `pnpm dev`
- **THEN** the Vite dev server starts on a local port and serves the React app without console errors

---

### Requirement: Tailwind CSS v4 utility classes are applied at runtime
Tailwind CSS v4 SHALL be integrated via `@tailwindcss/vite`. Utility classes used in JSX SHALL resolve to generated CSS in the final bundle. No `tailwind.config.js` SHALL be present — configuration lives in CSS via `@theme`.

#### Scenario: Utility class renders correctly
- **WHEN** a component applies `className="bg-background text-foreground p-4"`
- **THEN** the rendered element has the corresponding CSS properties applied in the browser

#### Scenario: No legacy config file
- **WHEN** the project root is inspected
- **THEN** no `tailwind.config.js` or `tailwind.config.ts` file exists

---

### Requirement: shadcn/ui is initialised and provides a Button component
shadcn/ui SHALL be initialised via `shadcn init --defaults`. The `Button` component SHALL be importable from `@/components/ui/button` and render without errors. CSS variables for the design system (background, foreground, primary, etc.) SHALL be defined in the global stylesheet.

#### Scenario: Button renders
- **WHEN** the `Button` component is imported and rendered in a React tree
- **THEN** it mounts without errors and is visible in the DOM with the correct variant styles

#### Scenario: CSS variables are defined
- **WHEN** the global stylesheet is inspected
- **THEN** `--background`, `--foreground`, `--primary`, and `--radius` CSS variables are declared on `:root`

---

### Requirement: Two-panel layout shell renders
The app SHALL render a fixed two-panel layout stub matching the architecture spec: a 44px topbar, a 340px-wide left panel, a right panel that fills remaining width, and a 52px query bar pinned to the bottom — all visible as placeholder `<div>` elements with correct dimensions and background.

#### Scenario: Layout dimensions
- **WHEN** the app is open at 1280×800
- **THEN** the topbar measures 44px tall, the left panel measures 340px wide, and the query bar measures 52px tall

#### Scenario: Right panel fills remaining width
- **WHEN** the window width is 1280px
- **THEN** the right panel is 940px wide (1280 − 340)

---

### Requirement: Phosphor Icons are importable and render
The `@phosphor-icons/react` package SHALL be installed. An icon (e.g., `House`) SHALL import from `@phosphor-icons/react` and render as an SVG element without errors.

#### Scenario: Icon renders as SVG
- **WHEN** `<House size={24} />` is rendered in a React component
- **THEN** an `<svg>` element appears in the DOM with the correct dimensions
