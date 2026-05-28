## ADDED Requirements

### Requirement: DateTree re-expands to nearest future date when focusTodayKey changes
The `DateTree` component SHALL accept an optional `focusTodayKey` prop of type `number`. Whenever the value of `focusTodayKey` changes (compared to its previous value), the component SHALL re-run the nearest-future-date expansion logic: it SHALL collapse all currently expanded nodes and expand only the year, month, and day nodes on the path to the nearest future date (or today if today exists in the tree). If no future dates exist, it SHALL expand the most recent year, month, and day nodes instead. The initial mount expansion SHALL NOT be affected by this prop — both the mount-time expansion and `focusTodayKey`-triggered expansion use the same logic.

#### Scenario: focusTodayKey increment collapses other nodes and expands today's path
- **WHEN** the parent increments `focusTodayKey` while the user has manually expanded several unrelated year/month/day nodes
- **THEN** all previously expanded nodes are collapsed and only the year, month, and day path to the nearest future date (or most recent past date if no future dates exist) are expanded

#### Scenario: focusTodayKey triggers expansion even if today is already expanded
- **WHEN** the parent increments `focusTodayKey` and the nearest future date path is already expanded
- **THEN** the component re-runs the expansion logic; the result is the same expanded path (idempotent)

#### Scenario: focusTodayKey omitted does not affect behaviour
- **WHEN** `DateTree` is rendered without a `focusTodayKey` prop
- **THEN** the component behaves as before — expanding on mount and responding to `refreshKey` only

#### Scenario: focusTodayKey unchanged does not trigger re-expansion
- **WHEN** the parent re-renders with the same `focusTodayKey` value
- **THEN** `DateTree` does NOT re-run the expansion logic and does NOT disturb the user's current expanded state
