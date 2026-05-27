## 1. Dependencies

- [x] 1.1 Add `thiserror = "1"` to `[dependencies]` in `src-tauri/Cargo.toml`
- [x] 1.2 Run `cargo check` to confirm the dependency resolves without conflict

## 2. Module Scaffold

- [x] 2.1 Create `src-tauri/src/vault/` directory
- [x] 2.2 Create `src-tauri/src/vault/mod.rs` that re-exports `VaultManager` and `VaultError` from `manager`
- [x] 2.3 Create `src-tauri/src/vault/manager.rs` as an empty file
- [x] 2.4 Add `mod vault;` to `src-tauri/src/lib.rs`
- [x] 2.5 Run `cargo check` to confirm the module compiles

## 3. VaultError Type

- [x] 3.1 Define `VaultError` enum in `manager.rs` with variants: `RootNotFound`, `NotADirectory`, `GitInitFailed(String)`, `IoError(String)`
- [x] 3.2 Derive `Debug`, `thiserror::Error`, and `serde::Serialize` on `VaultError`
- [x] 3.3 Add `#[error("...")]` messages to each variant using `thiserror` syntax

## 4. VaultManager Struct

- [x] 4.1 Define `VaultManager` struct in `manager.rs` with a single `root: PathBuf` field
- [x] 4.2 Implement `VaultManager::new(path: PathBuf) -> Result<Self, VaultError>` that returns `RootNotFound` if the path does not exist and `NotADirectory` if it exists but is not a directory
- [x] 4.3 Implement `vault_root(&self) -> &Path` accessor that returns a reference to `self.root`

## 5. vault_init Implementation

- [x] 5.1 Implement a `VaultManager::init(&self) -> Result<(), VaultError>` method (or free function) that runs all init steps in sequence
- [x] 5.2 Create `timeline/` subdirectory: check existence first; create only if absent; map `io::Error` to `VaultError::IoError`
- [x] 5.3 Run `git init`: check for `.git/` directory first; if absent, run `std::process::Command::new("git").arg("init").current_dir(&self.root)`; on non-zero exit or spawn failure map to `VaultError::GitInitFailed` with stderr content
- [x] 5.4 Write `.gitignore`: check existence first; if absent, write default entries (`.DS_Store`, `Thumbs.db`, `*.tmp`); map write errors to `VaultError::IoError`

## 6. Tauri Command Wiring

- [x] 6.1 Add a `#[tauri::command] fn vault_init(path: String) -> Result<(), VaultError>` free function in `manager.rs` (or `lib.rs`) that constructs a `VaultManager` from the path and calls `init()`
- [x] 6.2 Add `vault_init` to the `tauri::generate_handler![]` macro in `lib.rs` alongside `greet`
- [x] 6.3 Run `cargo build` to confirm the command compiles and Tauri registers it without error

## 7. Tests

- [x] 7.1 Add a `#[cfg(test)]` module in `manager.rs`
- [x] 7.2 Write a test: `VaultManager::new` with a valid temp directory returns `Ok` and `vault_root()` matches the input path
- [x] 7.3 Write a test: `VaultManager::new` with a non-existent path returns `Err(VaultError::RootNotFound)`
- [x] 7.4 Write a test: `VaultManager::new` with a path to a file (not a directory) returns `Err(VaultError::NotADirectory)`
- [x] 7.5 Write a test: calling `init()` on a fresh temp directory creates `timeline/`, `.git/`, and `.gitignore`
- [x] 7.6 Write a test: calling `init()` twice on the same directory returns `Ok(())` and does not corrupt existing files
- [x] 7.7 Run `cargo test` and confirm all tests pass
