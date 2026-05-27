# Spec: vault-manager

## Purpose

The `vault-manager` capability owns the lifecycle of a PKM vault on disk. It is responsible for constructing and holding a reference to the vault root path, scaffolding the required directory structure and git repository when a vault is first initialised, and validating that the vault is properly set up on application startup.

## Requirements

### Requirement: VaultManager holds vault root path
The `VaultManager` struct SHALL own an absolute path to the vault root directory. It SHALL be constructed from a `PathBuf` and SHALL expose the vault root via a public accessor. Construction SHALL succeed for any path that exists as a directory on the filesystem; it SHALL NOT require the vault to already be initialised.

#### Scenario: Construction with a valid directory path
- **WHEN** `VaultManager::new` is called with a path to an existing directory
- **THEN** the struct is created successfully and `vault_root()` returns the same path

#### Scenario: Construction with a non-existent path
- **WHEN** `VaultManager::new` is called with a path that does not exist on disk
- **THEN** an error is returned and no `VaultManager` is produced

---

### Requirement: vault_init scaffolds the timeline directory
The `vault_init` Tauri command SHALL create a `timeline/` subdirectory inside the vault root if one does not already exist.

#### Scenario: timeline/ is created on first init
- **WHEN** `vault_init` is invoked on a vault root that has no `timeline/` directory
- **THEN** `<vault_root>/timeline/` exists as a directory after the command returns

#### Scenario: vault_init is safe to run on an already-initialised vault
- **WHEN** `vault_init` is invoked on a vault root that already contains `timeline/`
- **THEN** the command succeeds without error and the existing directory is preserved

---

### Requirement: vault_init initialises a git repository
The `vault_init` Tauri command SHALL run `git init` in the vault root, producing a `.git/` directory. If a git repository already exists in the vault root, the command SHALL succeed without re-initialising.

#### Scenario: git init on a new vault
- **WHEN** `vault_init` is invoked on a directory that is not yet a git repository
- **THEN** a `.git/` directory exists in the vault root after the command returns

#### Scenario: vault_init does not fail on an existing git repo
- **WHEN** `vault_init` is invoked on a directory that already contains a `.git/` directory
- **THEN** the command succeeds and the existing git repository is intact

---

### Requirement: vault_init writes a .gitignore
The `vault_init` Tauri command SHALL write a `.gitignore` file to the vault root. If `.gitignore` already exists, the command SHALL NOT overwrite it.

#### Scenario: .gitignore written on first init
- **WHEN** `vault_init` is invoked on a vault root that has no `.gitignore`
- **THEN** a `.gitignore` file is present in the vault root after the command returns

#### Scenario: .gitignore is preserved if already present
- **WHEN** `vault_init` is invoked on a vault root that already has a `.gitignore`
- **THEN** the file contents are unchanged after the command returns

---

### Requirement: Startup validation confirms vault is initialised
On application startup, the backend SHALL read a persisted vault config file from the OS app-data directory. If no config file exists, managed state SHALL remain empty and no error SHALL be returned — the frontend will detect the empty state and show onboarding. If a vault path is found in the config, the backend SHALL validate it (root exists and is a directory) and, if valid, construct a `VaultManager` and register it in Tauri managed state. If the persisted path is invalid, a typed startup error SHALL be returned.

#### Scenario: No config file on startup
- **WHEN** the app starts and no vault config file exists in the app-data directory
- **THEN** managed state contains no `VaultManager`, no error is returned, and the app proceeds normally (onboarding will be triggered by the frontend)

#### Scenario: Valid persisted vault path on startup
- **WHEN** the app starts and the vault config file contains a path to an existing directory
- **THEN** a `VaultManager` is constructed and registered in managed state, and the app proceeds normally

#### Scenario: Persisted vault path no longer exists on startup
- **WHEN** the app starts and the vault config file contains a path that no longer exists on disk
- **THEN** a `VaultError::RootNotFound` is returned and propagated as a startup error

---

### Requirement: vault_init persists vault path and registers managed state
After the `vault_init` Tauri command successfully scaffolds the vault directory, it SHALL write the vault path to a JSON config file in the OS app-data directory and SHALL register a `VaultManager` instance in Tauri managed state. Both operations SHALL occur atomically within the command — if either fails, the command SHALL return an error.

#### Scenario: vault_init writes config and sets state on success
- **WHEN** `vault_init` is called with a valid path and scaffolding succeeds
- **THEN** a config file exists in the app-data directory containing the vault path, and managed state holds a `VaultManager` for that path

#### Scenario: vault_init fails to write config
- **WHEN** `vault_init` scaffolding succeeds but writing the config file fails (e.g., permission denied)
- **THEN** `vault_init` returns a `VaultError::IoError` and managed state is not updated

---

### Requirement: get_vault_path command returns configured vault path
A `get_vault_path` Tauri command SHALL return the current vault path string from managed state, or `null` if no vault has been configured in this session. The command SHALL NOT read from the config file — it reads only from in-memory managed state.

#### Scenario: Vault configured — returns path string
- **WHEN** `get_vault_path` is called after a vault has been successfully initialised or loaded from config
- **THEN** the command returns the vault root path as a UTF-8 string

#### Scenario: No vault configured — returns null
- **WHEN** `get_vault_path` is called before any vault has been initialised (first run, no config)
- **THEN** the command returns `null`
