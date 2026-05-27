## Context

The Tauri backend (`src-tauri/src/lib.rs`) currently contains only the scaffold `greet` command. The Rust crate already declares `gray_matter`, `notify`, and `walkdir` as dependencies but has no vault-related code. There is no `vault` module, no error types, and no mechanism to validate or initialise a user-chosen directory.

`vault_init` is the first concrete Tauri command beyond the scaffold. It establishes the conventions that future commands will follow for error propagation and module layout.

## Goals / Non-Goals

**Goals:**
- Introduce a `vault` module with a `VaultManager` struct and a serialisable `VaultError` type
- Implement `vault_init` as a Tauri command that idempotently sets up a vault directory
- Validate the vault root on construction so callers get a typed error early

**Non-Goals:**
- Storing or persisting the vault path between sessions (future change)
- Watching the vault for file-system changes (`notify` crate — separate change)
- Parsing `_config.md` front matter (`gray_matter` — separate change)
- Any frontend UI changes

## Decisions

### 1. Module layout: `vault/mod.rs` + `vault/manager.rs`

A `vault/` subdirectory under `src-tauri/src/` keeps vault logic isolated from the Tauri entry points. `mod.rs` re-exports the public surface (`VaultManager`, `VaultError`). `manager.rs` holds both the struct and the error enum — a second file (`error.rs`) is not warranted for two types.

`lib.rs` declares `mod vault;` and registers `vault_init` in the Tauri builder, exactly as `greet` is registered today.

**Alternative considered:** A flat `vault_manager.rs` at the crate root — rejected because it makes future vault-related modules (`watcher.rs`, `indexer.rs`, etc.) harder to group.

### 2. `std::process::Command` over the `git2` crate for `git init`

`git init` is a one-shot, write-once operation. The `git2` crate brings libgit2 as a C dependency, significantly increasing cross-platform build complexity and binary size. `std::process::Command` shells out to the system `git` binary, which is a reasonable requirement for a PKM tool aimed at developers.

If `git` is not found on `PATH`, the command returns a `VaultError::GitInitFailed` with the underlying OS error message so the frontend can surface it.

**Alternative considered:** `git2` crate — better for programmatic git operations, but overkill for a single `git init` call. Can be reconsidered if git history traversal is needed later.

### 3. `vault_init` accepts a path argument; no Tauri managed state in this change

The command signature is `vault_init(path: String) -> Result<(), VaultError>`. The frontend passes the user-selected vault path directly. This avoids needing Tauri's `State<>` machinery in this change and keeps the command self-contained.

When a persistent vault path (stored in app config) is introduced, `vault_init` can be refactored to read from state, or a separate `open_vault` command can own that concern.

### 4. Serialisable `VaultError` via `#[derive(Serialize)]` + `thiserror`

Tauri commands surface errors to the frontend via `serde_json`; the error type must implement `serde::Serialize`. The idiomatic approach is a `#[derive(Debug, thiserror::Error, Serialize)]` enum. `thiserror` is not yet in `Cargo.toml` — it will be added.

Each variant carries a human-readable message string so the frontend can display it without needing to pattern-match on error codes:

```
VaultError::RootNotFound    — vault root path does not exist
VaultError::NotADirectory   — path exists but is a file
VaultError::GitInitFailed   — git subprocess failed (includes stderr)
VaultError::IoError         — unexpected filesystem error
```

**Alternative considered:** Return `Result<(), String>` (Tauri convention for simple commands) — rejected because typed variants give the frontend actionable information and are testable in unit tests.

### 5. Idempotency via existence checks, not `create_dir_all` errors

Each init step checks whether its artifact already exists before acting:
- `timeline/`: `if !path.exists() { fs::create_dir(...) }`
- `.git/`: check for `.git/` dir before running `git init`
- `.gitignore`: check for file existence before writing

This means repeated `vault_init` calls are safe and return `Ok(())`. Errors only occur for genuine failures (permission denied, git not found), not for "already done" states.

## Risks / Trade-offs

- **`git` not on PATH** → `VaultError::GitInitFailed` is returned with the OS error. The frontend must prompt the user to install git. Risk is low for the target audience (developers).
- **Windows path edge cases** → `PathBuf` is used throughout; conversion to `String` for the Tauri command boundary uses `.to_string_lossy()` defensively. Non-UTF-8 vault paths (rare on Windows) degrade gracefully to an `IoError`.
- **`thiserror` adds a build dependency** → Minimal compile-time overhead; widely used in the Rust ecosystem. Acceptable trade-off for ergonomic error definitions.

## Open Questions

- What `.gitignore` entries should be pre-populated? Suggested defaults: `.DS_Store`, `Thumbs.db`, `*.tmp`. Can be adjusted without a spec change.
- When a persistent vault path config is introduced, should `vault_init` become a one-time setup step gated by the onboarding flow, or remain callable at any time?
