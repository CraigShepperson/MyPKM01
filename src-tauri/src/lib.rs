mod vault;
use tauri::Manager;
use vault::{
    create_entry, get_vault_path, list_timeline, load_startup_vault, move_entry,
    read_entry_file, vault_init, VaultState, write_entry_file,
};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greet_returns_expected_string() {
        let result = greet("World");
        assert!(result.contains("World"));
        assert!(result.contains("Rust"));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(VaultState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Load persisted vault config and populate managed state.
            // - No config file → Ok(()), onboarding will be shown by the frontend.
            // - Valid config → VaultState is set, frontend skips onboarding.
            // - Stale/invalid path → startup error, app exits.
            match load_startup_vault(app.handle()) {
                Ok(Some(path)) => {
                    let state = app.state::<VaultState>();
                    let mut guard = state
                        .0
                        .lock()
                        .map_err(|e| format!("vault state lock poisoned: {e}"))?;
                    *guard = Some(path);
                }
                Ok(None) => {} // first run — no config yet
                Err(e) => return Err(format!("startup vault error: {e}").into()),
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            vault_init,
            get_vault_path,
            list_timeline,
            move_entry,
            create_entry,
            read_entry_file,
            write_entry_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
