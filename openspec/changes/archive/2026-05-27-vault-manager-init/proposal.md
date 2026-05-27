## Why

The PKM app operates on a user-chosen directory ("vault") but currently has no structured way to initialise, validate, or load that vault. Without a `VaultManager`, the Rust backend cannot enforce vault structure, persist configuration, or surface errors when the vault root is malformed — making any downstream feature (timeline, notes, search) undefined behaviour.

## What Changes

- Introduce a `VaultManager` struct in `src-tauri` that owns the vault root path and parsed config
- Add a `vault_init` Tauri command that scaffolds a new vault: creates `timeline/` subdirectory, runs `git init`, and writes `.gitignore`
- Expose the vault path and config to the frontend via the existing IPC bridge

## Capabilities

### New Capabilities
- `vault-manager`: The `VaultManager` struct, vault init scaffolding (directory layout, `git init`, `.gitignore`), and startup validation

### Modified Capabilities
_(none — no existing spec requirements change)_

## Impact

- **`src-tauri/src/`**: New `vault/` module with `manager.rs`wired into `lib.rs`
- **`app-shell` spec**: No requirement changes; `gray_matter` and `git2` (or `std::process` for `git init`) are already expected dependencies per the scaffold spec
- **Tauri commands**: One new command (`vault_init`) registered in the Tauri builder
- **Frontend**: Will be able to call `vault_init`; no frontend code changes in this change
