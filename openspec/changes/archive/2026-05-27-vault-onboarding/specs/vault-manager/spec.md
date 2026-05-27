## MODIFIED Requirements

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

## ADDED Requirements

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
