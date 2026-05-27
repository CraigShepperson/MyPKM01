use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::Manager;
use thiserror::Error;

// ── Error type ────────────────────────────────────────────────────────────────

#[derive(Debug, Error, Serialize)]
pub enum VaultError {
    #[error("vault root not found: {0}")]
    RootNotFound(String),

    #[error("path is not a directory: {0}")]
    NotADirectory(String),

    #[error("git init failed: {0}")]
    GitInitFailed(String),

    #[error("I/O error: {0}")]
    IoError(String),
}

// ── Managed state ─────────────────────────────────────────────────────────────

/// Tauri managed state holding the active vault root path.
/// `None` when no vault has been configured in this session.
pub struct VaultState(pub Mutex<Option<PathBuf>>);

impl Default for VaultState {
    fn default() -> Self {
        VaultState(Mutex::new(None))
    }
}

// ── Config persistence ────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize)]
struct VaultConfig {
    vault_path: String,
}

fn config_path(app: &tauri::AppHandle) -> Result<PathBuf, VaultError> {
    app.path()
        .app_data_dir()
        .map(|p| p.join("vault_config.json"))
        .map_err(|e| VaultError::IoError(e.to_string()))
}

/// Read the persisted vault config on startup.
///
/// - Returns `Ok(None)` if no config file exists (first run).
/// - Returns `Ok(Some(path))` if a valid, existing vault is found.
/// - Returns `Err(...)` if the config exists but the vault path is stale/invalid.
pub fn load_startup_vault(app: &tauri::AppHandle) -> Result<Option<PathBuf>, VaultError> {
    let cfg_path = config_path(app)?;
    if !cfg_path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&cfg_path)
        .map_err(|e| VaultError::IoError(e.to_string()))?;
    let cfg: VaultConfig = serde_json::from_str(&content)
        .map_err(|e| VaultError::IoError(format!("malformed vault config: {e}")))?;
    let manager = VaultManager::new(PathBuf::from(&cfg.vault_path))?;
    Ok(Some(manager.root))
}

// ── VaultManager ──────────────────────────────────────────────────────────────

#[derive(Debug)]
pub struct VaultManager {
    root: PathBuf,
}

impl VaultManager {
    /// Construct a `VaultManager` for an existing directory.
    ///
    /// Returns `VaultError::RootNotFound` if the path does not exist and
    /// `VaultError::NotADirectory` if it exists but is not a directory.
    /// Construction does not require the vault to be initialised.
    pub fn new(path: PathBuf) -> Result<Self, VaultError> {
        if !path.exists() {
            return Err(VaultError::RootNotFound(
                path.to_string_lossy().into_owned(),
            ));
        }
        if !path.is_dir() {
            return Err(VaultError::NotADirectory(
                path.to_string_lossy().into_owned(),
            ));
        }
        Ok(Self { root: path })
    }

    /// Returns a reference to the vault root path.
    pub fn vault_root(&self) -> &Path {
        &self.root
    }

    /// Initialise the vault directory structure idempotently.
    ///
    /// Steps (each is a no-op if already present):
    /// 1. Create `timeline/` subdirectory
    /// 2. Run `git init`
    /// 3. Write default `.gitignore`
    pub fn init(&self) -> Result<(), VaultError> {
        self.create_timeline()?;
        self.git_init()?;
        self.write_gitignore()?;
        Ok(())
    }

    fn create_timeline(&self) -> Result<(), VaultError> {
        let timeline = self.root.join("timeline");
        if !timeline.exists() {
            fs::create_dir(&timeline)
                .map_err(|e| VaultError::IoError(e.to_string()))?;
        }
        Ok(())
    }

    fn git_init(&self) -> Result<(), VaultError> {
        let git_dir = self.root.join(".git");
        if git_dir.exists() {
            return Ok(());
        }
        let output = Command::new("git")
            .arg("init")
            .current_dir(&self.root)
            .output()
            .map_err(|e| VaultError::GitInitFailed(e.to_string()))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
            return Err(VaultError::GitInitFailed(stderr));
        }
        Ok(())
    }

    fn write_gitignore(&self) -> Result<(), VaultError> {
        let gitignore = self.root.join(".gitignore");
        if gitignore.exists() {
            return Ok(());
        }
        let content = ".DS_Store\nThumbs.db\n*.tmp\n";
        fs::write(&gitignore, content)
            .map_err(|e| VaultError::IoError(e.to_string()))?;
        Ok(())
    }
}

// ── Tauri commands ────────────────────────────────────────────────────────────

/// Scaffold a new vault at `path`, persist the path to app-data config,
/// and register a `VaultManager` in managed state.
#[tauri::command]
pub fn vault_init(
    app: tauri::AppHandle,
    state: tauri::State<'_, VaultState>,
    path: String,
) -> Result<(), VaultError> {
    let manager = VaultManager::new(PathBuf::from(&path))?;
    manager.init()?;

    // Persist vault path to app-data config
    let cfg_path = config_path(&app)?;
    if let Some(parent) = cfg_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| VaultError::IoError(e.to_string()))?;
    }
    let json = serde_json::to_string(&VaultConfig { vault_path: path.clone() })
        .map_err(|e| VaultError::IoError(e.to_string()))?;
    fs::write(&cfg_path, json)
        .map_err(|e| VaultError::IoError(e.to_string()))?;

    // Update managed state
    let mut guard = state
        .0
        .lock()
        .map_err(|e| VaultError::IoError(e.to_string()))?;
    *guard = Some(PathBuf::from(path));

    Ok(())
}

/// Return the current vault root path from managed state, or `null` if no vault
/// has been configured in this session.
#[tauri::command]
pub fn get_vault_path(state: tauri::State<'_, VaultState>) -> Option<String> {
    state
        .0
        .lock()
        .ok()?
        .as_ref()
        .map(|pb| pb.to_string_lossy().into_owned())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    // 7.2 — new() with valid dir succeeds; vault_root() matches input
    #[test]
    fn new_with_valid_dir_succeeds() {
        let dir = tempdir().unwrap();
        let manager = VaultManager::new(dir.path().to_path_buf()).unwrap();
        assert_eq!(manager.vault_root(), dir.path());
    }

    // 7.3 — new() with non-existent path returns RootNotFound
    #[test]
    fn new_with_nonexistent_path_returns_root_not_found() {
        let path = PathBuf::from(
            "/this_path_was_created_by_a_test_and_should_not_exist_xyzzy_42",
        );
        let err = VaultManager::new(path).unwrap_err();
        assert!(matches!(err, VaultError::RootNotFound(_)));
    }

    // 7.4 — new() with a file path returns NotADirectory
    #[test]
    fn new_with_file_path_returns_not_a_directory() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.txt");
        fs::write(&file_path, "hello").unwrap();
        let err = VaultManager::new(file_path).unwrap_err();
        assert!(matches!(err, VaultError::NotADirectory(_)));
    }

    // 7.5 — init() creates timeline/, .git/, and .gitignore
    #[test]
    fn init_creates_timeline_git_and_gitignore() {
        let dir = tempdir().unwrap();
        let manager = VaultManager::new(dir.path().to_path_buf()).unwrap();
        manager.init().unwrap();

        assert!(dir.path().join("timeline").is_dir(), "timeline/ missing");
        assert!(dir.path().join(".git").is_dir(), ".git/ missing");
        assert!(dir.path().join(".gitignore").is_file(), ".gitignore missing");
    }

    // 7.6 — init() is idempotent: second call succeeds; existing files preserved
    #[test]
    fn init_is_idempotent() {
        let dir = tempdir().unwrap();
        let gitignore_path = dir.path().join(".gitignore");

        // Pre-populate .gitignore so we can verify it isn't overwritten
        fs::write(&gitignore_path, "custom_content\n").unwrap();

        let manager = VaultManager::new(dir.path().to_path_buf()).unwrap();
        manager.init().unwrap();
        manager.init().unwrap(); // second call must not fail

        let content = fs::read_to_string(&gitignore_path).unwrap();
        assert_eq!(content, "custom_content\n", ".gitignore was overwritten");
    }
}
