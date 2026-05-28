## ADDED Requirements

### Requirement: AppShell renders a single full-width topbar
The `AppShell` component SHALL render one topbar element spanning the full window width at a fixed height of 44px, positioned above the left and right panels. The topbar SHALL NOT be subdivided into per-panel sections and SHALL NOT render a vertical border aligned with the left panel boundary.

#### Scenario: Topbar spans both panels
- **WHEN** the app shell renders with both a left panel and a right panel
- **THEN** the topbar is a single continuous horizontal bar covering the full width of the window with no internal vertical dividers

#### Scenario: Topbar has consistent background
- **WHEN** the topbar renders
- **THEN** it uses a single background color across its full width rather than distinct colors for a left and right section
