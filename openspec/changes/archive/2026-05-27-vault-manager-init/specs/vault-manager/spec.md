## ADDED Requirements

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
On application startup, when a vault path is provided, `VaultManager` SHALL validate that the vault root contains the expected structure (at minimum: the root directory exists). If the vault root does not exist or is not a directory, a typed startup error SHALL be returned and the application SHALL NOT proceed with normal operation.

#### Scenario: Valid vault root on startup
- **WHEN** the app starts with a vault root path that exists as a directory
- **THEN** `VaultManager` is constructed without error and the app proceeds normally

#### Scenario: Missing vault root on startup
- **WHEN** the app starts with a vault root path that does not exist on disk
- **THEN** a `VaultError::RootNotFound` (or equivalent typed error) is returned and propagated as a startup error
