## Context

`AppShell` renders a 44px topbar row containing two child divs: a left section locked to `w-[340px]` with `bg-muted/40` background and a `border-r`, and a right section that fills the remaining width with `bg-background`. Both contain placeholder text. The vertical border between them visually splits the topbar in line with the panel boundary below.

## Goals / Non-Goals

**Goals:**
- Replace the two-section topbar with a single full-width div at the same 44px height
- Remove the vertical border that splits the topbar

**Non-Goals:**
- Adding topbar content or functionality (title, buttons, breadcrumbs)
- Changing the left panel width, query bar, or any other layout region
- Introducing `leftTopbar` / `rightTopbar` props to `AppShell`

## Decisions

### Keep topbar markup self-contained in AppShell, no new props

The topbar content remains hardcoded in `AppShell` for now — the same way both sections currently are. Adding props would over-engineer a placeholder.

### Match the right panel's background (`bg-background`) for the unified bar

The left topbar's `bg-muted/40` tint visually tied it to the sidebar. The unified bar adopts `bg-background` (the right panel's color) so it reads as a neutral global chrome rather than belonging to either panel.

## Risks / Trade-offs

- **Placeholder content** — the "MyPKM" label and "— editor topbar —" text are both discarded. The unified bar renders empty until real topbar content is added in a follow-up change. This is acceptable; the bar is structural for now.
