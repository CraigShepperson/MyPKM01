## Why

The current `AppShell` renders two separate topbar sections — one for the left panel (340px) and one for the right panel — adding visual fragmentation and structural complexity with no functional benefit. Replacing them with a single full-width topbar simplifies the layout and provides one consistent space for global chrome.

## What Changes

- The two-section topbar row in `AppShell` is replaced with a single `div` spanning the full width of the window
- The left topbar (`w-[340px]`, `bg-muted/40`) and right topbar (`flex-1`, placeholder content) are removed
- The border dividing the left and right topbar sections is removed; the bottom border remains

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None — this is a pure layout implementation change with no spec-level behavior

## Impact

- `src/components/AppShell.tsx` — topbar markup restructured from two divs to one
