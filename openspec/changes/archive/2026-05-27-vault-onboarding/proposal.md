## Why

The app currently has no mechanism to discover or remember the user's vault directory — every capability built on top of `VaultManager` is blocked without it. This change introduces the minimal first-run flow: the user picks a directory once, vault init runs, and the app remembers the choice across restarts.

## What Changes

- Add a React onboarding screen that shows on first run (no vault configured) with a single "Choose vault folder" button
- Invoke the OS native directory picker via the Tauri dialog plugin
- On folder selection, call `vault_init`; on success, navigate to the main window
- Persist the chosen vault path to a config file in the OS app-data directory so subsequent launches skip onboarding
- On startup, read the persisted path, validate it, and populate Tauri managed state with a `VaultManager`
- Expose a `get_vault_path` Tauri command so the frontend can determine on startup whether to show onboarding or the main window

## Capabilities

### New Capabilities
- `vault-onboarding`: The onboarding UI screen, the OS directory picker interaction, and the frontend routing logic (onboarding ↔ main window based on vault state)

### Modified Capabilities
- `vault-manager`: Two new requirements — (1) `vault_init` stores the vault path to a JSON config file in the app-data directory and registers a `VaultManager` in Tauri managed state after successful init; (2) on application startup the backend reads the persisted config, validates the vault root, and populates managed state so `get_vault_path` returns it. New `get_vault_path` Tauri command returns the current vault path string or `null` if not configured.

## Impact

- **`src-tauri/`**: Add `tauri-plugin-dialog` dependency; add `tauri-plugin-store` (or manual JSON write) for config persistence; extend `vault/manager.rs` with state registration and persistence helpers; add `get_vault_path` command; wire new plugin and state into `lib.rs`
- **`src/`** (React): New `Onboarding` component; routing/conditional render in `App.tsx` based on `get_vault_path` result; invoke `vault_init` and `get_vault_path` via `@tauri-apps/api/core`
- **`vault-manager` spec**: Modified — adds persistence and managed-state requirements to `vault_init`, adds `get_vault_path` command requirement, adds startup-reads-config requirement
- **`frontend-base` spec**: No requirement changes — layout and component scaffolding are unaffected
