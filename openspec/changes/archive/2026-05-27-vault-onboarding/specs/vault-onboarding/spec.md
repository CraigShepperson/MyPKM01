## ADDED Requirements

### Requirement: Onboarding screen shown when no vault is configured
On startup, the frontend SHALL call `get_vault_path`. If the result is `null` (no vault configured), the app SHALL render the `Onboarding` screen. If a path is returned, the app SHALL render the main window directly without showing onboarding.

#### Scenario: First run — no vault configured
- **WHEN** the app starts and `get_vault_path` returns `null`
- **THEN** the `Onboarding` screen is rendered and the main window is not visible

#### Scenario: Returning run — vault already configured
- **WHEN** the app starts and `get_vault_path` returns a non-null path string
- **THEN** the main window is rendered and the `Onboarding` screen is not visible

---

### Requirement: Onboarding screen provides a vault location picker
The `Onboarding` screen SHALL display a single primary action button labelled "Choose vault folder". Activating it SHALL open the OS native directory picker dialog via the Tauri dialog plugin. No text input field for a path SHALL be shown.

#### Scenario: Directory picker opens on button click
- **WHEN** the user clicks "Choose vault folder" on the Onboarding screen
- **THEN** the OS native directory selection dialog opens

#### Scenario: No manual path entry
- **WHEN** the Onboarding screen is rendered
- **THEN** no text field for typing a vault path is present in the UI

---

### Requirement: Successful vault selection navigates to the main window
After the user selects a directory and `vault_init` succeeds, the app SHALL transition from the `Onboarding` screen to the main window without requiring any further user action.

#### Scenario: vault_init succeeds after directory selection
- **WHEN** the user selects a directory and `vault_init` returns successfully
- **THEN** the `Onboarding` screen is unmounted and the main window is rendered

#### Scenario: User cancels the directory picker
- **WHEN** the user opens the OS directory picker and dismisses it without selecting a folder
- **THEN** the app remains on the `Onboarding` screen with no error shown

---

### Requirement: Onboarding screen surfaces vault_init errors
If `vault_init` returns an error after a directory is selected, the `Onboarding` screen SHALL display a human-readable error message and remain visible so the user can try again.

#### Scenario: vault_init fails with a typed error
- **WHEN** `vault_init` returns a `VaultError` (e.g., `GitInitFailed`)
- **THEN** an inline error message is shown on the Onboarding screen describing the failure, and the "Choose vault folder" button remains active
