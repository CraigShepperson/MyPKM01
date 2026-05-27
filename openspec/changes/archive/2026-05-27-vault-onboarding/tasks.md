## 1. Rust Dependencies

- [x] 1.1 Add `tauri-plugin-dialog = "2"` to `[dependencies]` in `src-tauri/Cargo.toml`
- [x] 1.2 Run `cargo check` in `src-tauri/` to confirm the dependency resolves

## 2. Rust — VaultState and Config Types

- [x] 2.1 Define `pub struct VaultState(pub Mutex<Option<PathBuf>>)` in `vault/manager.rs`; implement `Default` as `VaultState(Mutex::new(None))`
- [x] 2.2 Define `#[derive(Serialize, Deserialize)] struct VaultConfig { vault_path: String }` in `vault/manager.rs`
- [x] 2.3 Add a private `fn config_path(app: &tauri::AppHandle) -> Result<PathBuf, VaultError>` helper that returns `app.path().app_data_dir()? / "vault_config.json"`, mapping errors to `VaultError::IoError`
- [x] 2.4 Re-export `VaultState` from `vault/mod.rs`

## 3. Rust — Update vault_init

- [x] 3.1 Add `app: tauri::AppHandle` and `state: tauri::State<'_, VaultState>` as the first two parameters of `vault_init` (before `path: String`)
- [x] 3.2 After `manager.init()` succeeds, call `config_path(&app)`, create the app-data directory with `fs::create_dir_all`, and write `VaultConfig { vault_path: path.clone() }` as JSON using `serde_json::to_string`
- [x] 3.3 After successful config write, lock `state.0` and set it to `Some(PathBuf::from(&path))`
- [x] 3.4 Map any config-write or state-lock failure to `VaultError::IoError` and return early

## 4. Rust — get_vault_path Command

- [x] 4.1 Implement `#[tauri::command] pub fn get_vault_path(state: tauri::State<'_, VaultState>) -> Option<String>` in `vault/manager.rs`: lock `state.0`, map `Some(pb) => Some(pb.to_string_lossy().into_owned())`, `None => None`
- [x] 4.2 Re-export `get_vault_path` from `vault/mod.rs`

## 5. Rust — Startup Hook and Plugin Wiring

- [x] 5.1 Add `use vault::{get_vault_path, vault_init, VaultState}` to `lib.rs`
- [x] 5.2 Add `.manage(VaultState::default())` to the Tauri builder in `lib.rs` before `.setup()`
- [x] 5.3 Add `.plugin(tauri_plugin_dialog::init())` to the Tauri builder in `lib.rs`
- [x] 5.4 Add `get_vault_path` and `vault_init` (replacing the old import) to `tauri::generate_handler![]` in `lib.rs`
- [x] 5.5 Add a `.setup(|app| { ... })` hook: call `config_path(app.handle())`; if the file exists, deserialise `VaultConfig`, call `VaultManager::new(PathBuf::from(&cfg.vault_path))`; on success lock `VaultState` and set the path; on failure return `Err(...)` to abort startup; if file is absent, return `Ok(())`
- [x] 5.6 Check `src-tauri/capabilities/` for a capabilities file; add `"dialog:default"` permission to the default capability so the dialog plugin can open on the frontend; create `src-tauri/capabilities/default.json` if none exists
- [x] 5.7 Run `cargo build` in `src-tauri/` to confirm all Rust changes compile cleanly

## 6. Frontend — Dependencies

- [x] 6.1 Run `pnpm add @tauri-apps/plugin-dialog` in the project root

## 7. Frontend — Onboarding Component

- [x] 7.1 Create `src/components/Onboarding.tsx` accepting `onSuccess: (path: string) => void` as a prop
- [x] 7.2 Render a centred layout with the app name, a short prompt, and a "Choose vault folder" `<Button>` (from shadcn/ui)
- [x] 7.3 On button click, call `open({ directory: true, multiple: false })` from `@tauri-apps/plugin-dialog`; if `selected` is `null` (user cancelled), return early without error
- [x] 7.4 On a non-null `selected` path, call `invoke<void>('vault_init', { path: selected })` from `@tauri-apps/api/core`
- [x] 7.5 On `vault_init` success, call `onSuccess(selected)` to signal the parent
- [x] 7.6 On `vault_init` error, store the error message string in local state and display it as an inline error below the button; keep the button active for retry

## 8. Frontend — App.tsx Routing

- [x] 8.1 Add `const [vaultPath, setVaultPath] = useState<string | null | undefined>(undefined)` to `App`
- [x] 8.2 Add a `useEffect(() => { invoke<string | null>('get_vault_path').then(setVaultPath) }, [])` to call `get_vault_path` once on mount
- [x] 8.3 Return `null` from `App` while `vaultPath === undefined` (IPC in flight — blank screen, no flicker)
- [x] 8.4 Return `<Onboarding onSuccess={setVaultPath} />` when `vaultPath === null`
- [x] 8.5 Return the existing `<AppShell ... />` tree when `vaultPath` is a string

## 9. Verify

- [x] 9.1 Run `pnpm build` from the project root to confirm the TypeScript frontend compiles without type errors
- [x] 9.2 Run `cargo build` in `src-tauri/` for a final clean build confirmation
