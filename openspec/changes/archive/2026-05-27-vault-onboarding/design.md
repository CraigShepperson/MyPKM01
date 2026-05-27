## Context

The Rust backend has a working `vault_init` command (stateless — takes a path, scaffolds, returns). The React frontend renders `<AppShell>` unconditionally. Neither side has any concept of "is a vault configured?". This change is the first to span both layers: the backend gains persistence and managed state, and the frontend gains conditional routing between onboarding and the main window.

Two new Tauri plugins are needed: `tauri-plugin-dialog` (OS native directory picker) and the Tauri v2 path API (for locating the app-data directory). `serde_json` is already in `Cargo.toml`.

## Goals / Non-Goals

**Goals:**
- Wire up OS directory picker → `vault_init` → managed state + persisted config as a single user action
- Give the frontend a reliable signal (`get_vault_path`) to decide which view to show
- Keep the onboarding UI minimal — one button, one error surface, no polish

**Non-Goals:**
- Vault switching or re-selection after first setup (future change)
- Any UI animation or transition between onboarding and main window
- Validating vault health beyond root-directory existence on startup
- Allowing the user to type a path manually

## Decisions

### 1. Managed state: `Mutex<Option<PathBuf>>` not `Mutex<Option<VaultManager>>`

Storing the vault path (not the `VaultManager` struct) in managed state keeps the type trivially serialisable. `get_vault_path` can convert `PathBuf → String` directly without re-implementing `VaultManager`'s serialisation. `VaultManager` can always be reconstructed from the path when a command actually needs it. `PathBuf` is `Send + Sync`, so `Mutex<Option<PathBuf>>` satisfies Tauri's managed state bounds.

Type alias defined in `vault/manager.rs`:
```rust
pub struct VaultState(pub Mutex<Option<PathBuf>>);
```

Registered in `lib.rs` via `.manage(VaultState(Mutex::new(None)))` **before** `.setup()`.

**Alternative considered:** Store `Mutex<Option<Arc<VaultManager>>>` — more semantically rich, but adds `Arc` overhead and requires `VaultManager` to be fully `Sync`, which adds maintenance burden for future fields.

### 2. Config persistence: manual JSON file, not `tauri-plugin-store`

The vault config is a single string key (`vault_path`). Using `tauri-plugin-store` would introduce a full KV store dependency for one field. Instead, a `vault_config.json` file is written to the Tauri app-data directory using `serde_json`:

```json
{ "vault_path": "/absolute/path/to/vault" }
```

Location: `app_handle.path().app_data_dir()? / "vault_config.json"` — resolves to `%APPDATA%\com.craig.tauri-app\vault_config.json` on Windows.

`vault_init` creates the app-data directory if it does not exist (`fs::create_dir_all`) before writing.

**Alternative considered:** `tauri-plugin-store` — rejected as disproportionate for a single value; adds a plugin dependency and async complexity.

### 3. Startup config reading via `.setup()` hook

Tauri's `.setup(|app| { ... })` hook is the only place where `AppHandle` is available before the event loop starts. Startup config loading is placed here:

1. Read `vault_config.json` from app-data dir
2. If absent or unreadable: leave `VaultState` empty — not an error
3. If present: call `VaultManager::new(path)` to validate; on success write to `VaultState`; on failure (path gone) propagate as a startup error

The hook returns `Ok(())` on soft-miss (no config) and `Err(...)` on hard-miss (corrupt path). A hard startup error surfaces via the default Tauri error dialog and exits the app.

### 4. `vault_init` gains `AppHandle` and `State<VaultState>` parameters

Tauri v2 injects `AppHandle` and `State<T>` as special parameters — they are invisible to the frontend JS caller. The updated signature:

```rust
pub fn vault_init(
    app: tauri::AppHandle,
    state: tauri::State<VaultState>,
    path: String,
) -> Result<(), VaultError>
```

After scaffolding succeeds, the command:
1. Writes `vault_config.json` to app-data dir (creates dir if needed)
2. Locks `VaultState` and sets the `PathBuf`

If the config write fails, the command returns `VaultError::IoError` and does not update state — the caller (frontend) will see an error and remain on the onboarding screen.

### 5. Frontend routing: `useState` in `App.tsx`, no router

There are exactly two views: `<Onboarding>` and `<AppShell>`. React Router is overkill. `App.tsx` holds:

```tsx
const [vaultPath, setVaultPath] = useState<string | null | undefined>(undefined);
```

- `undefined` → loading (call in flight)
- `null` → no vault, show `<Onboarding onSuccess={setVaultPath} />`
- `string` → vault set, show `<AppShell />`

`get_vault_path` is called once in a `useEffect` on mount. `<Onboarding>` calls `setVaultPath(path)` on success, triggering the transition.

**Alternative considered:** A dedicated `useVaultState` hook — reasonable, but adds indirection for what is currently two lines of logic. Can be extracted later.

### 6. `tauri-plugin-dialog` for the OS directory picker

`tauri-plugin-dialog` is the official Tauri v2 plugin for OS-native file/directory dialogs. The frontend calls:

```ts
import { open } from '@tauri-apps/plugin-dialog';
const selected = await open({ directory: true, multiple: false });
```

`selected` is `string | null` — `null` on cancel. On a string result, `vault_init` is called. The plugin requires:
- `tauri-plugin-dialog = "2"` in `Cargo.toml`
- `.plugin(tauri_plugin_dialog::init())` in `lib.rs`
- `@tauri-apps/plugin-dialog` npm package

## Risks / Trade-offs

- **`vault_init` signature change** → Existing call sites (none in production yet) must be updated. Low risk at this stage.
- **App-data dir unavailable** → Extremely rare (permission issue on Windows). `vault_init` returns `VaultError::IoError`; the frontend shows the error message. No silent data loss.
- **Startup hard error on stale config** → If the user moves their vault after setup, the app will fail to start. Mitigation: treat startup validation failure as a soft error that clears the config and falls back to onboarding (this can be addressed without a spec change).
- **`undefined` flash in App.tsx** → During the `get_vault_path` call there is a brief loading state. Mitigation: render nothing (or a blank screen) until the result arrives — no spinner needed for a sub-50ms IPC call.

## Open Questions

- Should a startup validation failure (stale vault path) clear the config and show onboarding rather than crashing? Currently specced as a startup error — worth revisiting before shipping.
- The app identifier (`com.craig.tauri-app`) controls the app-data path. Should it be renamed before the first real user install to avoid migration pain later?
