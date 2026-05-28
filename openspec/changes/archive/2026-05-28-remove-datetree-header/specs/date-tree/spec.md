## ADDED Requirements

### Requirement: DateTree re-fetches timeline data when refreshKey changes
The `DateTree` component SHALL accept an optional `refreshKey` prop of type `number`. Whenever the value of `refreshKey` changes (compared to its previous value), the component SHALL invoke `list_timeline` and update the displayed tree with the fresh response. The initial mount fetch SHALL NOT be skipped — the existing mount-time fetch runs independently of `refreshKey`.

#### Scenario: Incrementing refreshKey triggers a re-fetch
- **WHEN** the parent component increments `refreshKey` (e.g. from 0 to 1)
- **THEN** `DateTree` calls `list_timeline` again and re-renders the tree with the updated data

#### Scenario: refreshKey unchanged does not trigger additional fetch
- **WHEN** the parent re-renders but passes the same `refreshKey` value as the previous render
- **THEN** `DateTree` does NOT issue an additional `list_timeline` call

#### Scenario: refreshKey omitted does not break component
- **WHEN** `DateTree` is rendered without a `refreshKey` prop
- **THEN** the component behaves as before — fetching on mount and on window focus only

## REMOVED Requirements

### Requirement: DateTree header bar with section label and new-entry button
**Reason**: The `+` (new entry) action has moved to the `AppShell` topbar. The "Timeline" section label added no navigational value and the header bar consumed vertical space in a compact panel.
**Migration**: Use the `+` button in the app topbar to create new entries. The `CreateEntryModal` is now rendered at the `App` level and triggers a `DateTree` refresh via the `refreshKey` prop.
