## ADDED Requirements

### Requirement: AppShell topbar accepts injected content via topbarContent prop
The `AppShell` component SHALL accept an optional `topbarContent` prop of type `ReactNode`. When provided, the topbar SHALL render the content aligned to the right side of the topbar bar, vertically centred within the 44px height. When `topbarContent` is omitted, the topbar SHALL render empty with no visible change to its background or dimensions.

#### Scenario: topbarContent renders on the right side of the topbar
- **WHEN** `AppShell` is rendered with a `topbarContent` node
- **THEN** that node appears inside the topbar element, aligned to the right, vertically centred

#### Scenario: Empty topbar when topbarContent is omitted
- **WHEN** `AppShell` is rendered without a `topbarContent` prop
- **THEN** the topbar renders at 44px height with no child elements visible
