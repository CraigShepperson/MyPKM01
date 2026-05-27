use std::fs;
use std::path::{Path, PathBuf};

use gray_matter::{engine::YAML, Matter};
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;

use super::manager::{VaultError, VaultState};

// ── Data types ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct EntryMeta {
    pub id: String,
    pub title: String,
    pub entry_type: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct DayListing {
    pub date: String,
    pub entries: Vec<EntryMeta>,
}

/// Internal: used only for deserialising _config.md frontmatter.
#[derive(Deserialize, Default)]
struct EntryConfig {
    title: Option<String>,
    #[serde(rename = "type")]
    entry_type: Option<String>,
}

// ── Private helpers ───────────────────────────────────────────────────────────

/// Parse an entry directory into an `EntryMeta`.
///
/// Falls back to the folder name / `"unknown"` if `_config.md` is absent,
/// unreadable, or has unparseable frontmatter.
pub(crate) fn parse_entry_meta(entry_dir: &Path) -> EntryMeta {
    let id = entry_dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    let config_path = entry_dir.join("_config.md");

    if !config_path.exists() {
        return EntryMeta {
            id: id.clone(),
            title: id,
            entry_type: "unknown".to_string(),
        };
    }

    let content = match fs::read_to_string(&config_path) {
        Ok(c) => c,
        Err(_) => {
            return EntryMeta {
                id: id.clone(),
                title: id,
                entry_type: "unknown".to_string(),
            }
        }
    };

    let matter: Matter<YAML> = Matter::new();
    let (title, entry_type) = match matter.parse_with_struct::<EntryConfig>(&content) {
        Some(parsed) => (
            parsed.data.title.unwrap_or_else(|| id.clone()),
            parsed.data.entry_type.unwrap_or_else(|| "unknown".to_string()),
        ),
        None => (id.clone(), "unknown".to_string()),
    };

    EntryMeta { id, title, entry_type }
}

/// Strip YAML frontmatter from markdown content using gray_matter.
///
/// Returns everything after the closing `---` delimiter.
/// If no frontmatter is present the original string is returned unchanged.
pub(crate) fn strip_frontmatter(content: &str) -> String {
    let matter: Matter<YAML> = Matter::new();
    matter.parse(content).content
}

// ── Business logic (vault-root-based, testable without Tauri state) ───────────

pub(crate) fn list_timeline_impl(vault_root: &Path) -> Result<Vec<DayListing>, VaultError> {
    let timeline_dir = vault_root.join("timeline");
    if !timeline_dir.exists() {
        return Ok(vec![]);
    }

    // Collect date-level folders (depth 1 inside timeline/).
    let date_dirs: Vec<_> = WalkDir::new(&timeline_dir)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_dir())
        .collect();

    let mut listings = Vec::new();

    for date_dir in date_dirs {
        let date_name = date_dir.file_name().to_string_lossy().to_string();

        // Collect entry-level folders (depth 1 inside each date folder).
        let entries: Vec<EntryMeta> = WalkDir::new(date_dir.path())
            .min_depth(1)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_dir())
            .map(|e| parse_entry_meta(e.path()))
            .collect();

        listings.push(DayListing {
            date: date_name,
            entries,
        });
    }

    Ok(listings)
}

pub(crate) fn read_entry_file_impl(
    vault_root: &Path,
    date: &str,
    entry_id: &str,
    filename: &str,
) -> Result<String, VaultError> {
    let file_path = vault_root
        .join("timeline")
        .join(date)
        .join(entry_id)
        .join(filename);

    if !file_path.exists() {
        return Err(VaultError::IoError(format!(
            "file not found: {}",
            file_path.display()
        )));
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| VaultError::IoError(e.to_string()))?;

    if filename == "_config.md" {
        Ok(strip_frontmatter(&content))
    } else {
        Ok(content)
    }
}

pub(crate) fn write_entry_file_impl(
    vault_root: &Path,
    date: &str,
    entry_id: &str,
    filename: &str,
    content: &str,
) -> Result<(), VaultError> {
    let entry_dir = vault_root.join("timeline").join(date).join(entry_id);

    if !entry_dir.exists() {
        return Err(VaultError::IoError(format!(
            "entry folder not found: {}",
            entry_dir.display()
        )));
    }

    let file_path = entry_dir.join(filename);
    fs::write(&file_path, content).map_err(|e| VaultError::IoError(e.to_string()))?;

    Ok(())
}

// ── Vault-root extraction helper ──────────────────────────────────────────────

fn get_vault_root(state: &tauri::State<'_, VaultState>) -> Result<PathBuf, VaultError> {
    let guard = state
        .0
        .lock()
        .map_err(|e| VaultError::IoError(e.to_string()))?;
    guard
        .as_ref()
        .map(|p| p.clone())
        .ok_or_else(|| VaultError::IoError("no vault configured".to_string()))
}

// ── Tauri commands ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn list_timeline(state: tauri::State<'_, VaultState>) -> Result<Vec<DayListing>, VaultError> {
    let vault_root = get_vault_root(&state)?;
    list_timeline_impl(&vault_root)
}

#[tauri::command]
pub fn read_entry_file(
    state: tauri::State<'_, VaultState>,
    date: String,
    entry_id: String,
    filename: String,
) -> Result<String, VaultError> {
    let vault_root = get_vault_root(&state)?;
    read_entry_file_impl(&vault_root, &date, &entry_id, &filename)
}

#[tauri::command]
pub fn write_entry_file(
    state: tauri::State<'_, VaultState>,
    date: String,
    entry_id: String,
    filename: String,
    content: String,
) -> Result<(), VaultError> {
    let vault_root = get_vault_root(&state)?;
    write_entry_file_impl(&vault_root, &date, &entry_id, &filename, &content)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    fn make_entry(vault_dir: &Path, date: &str, id: &str, config: &str) {
        let entry_dir = vault_dir.join("timeline").join(date).join(id);
        fs::create_dir_all(&entry_dir).unwrap();
        fs::write(entry_dir.join("_config.md"), config).unwrap();
    }

    // ── parse_entry_meta ──────────────────────────────────────────────────

    #[test]
    fn parse_entry_meta_reads_title_and_type() {
        let dir = tempdir().unwrap();
        let entry_dir = dir.path().join("abc123");
        fs::create_dir_all(&entry_dir).unwrap();
        fs::write(
            entry_dir.join("_config.md"),
            "---\ntitle: Standup\ntype: meeting\n---\nBody",
        )
        .unwrap();

        let meta = parse_entry_meta(&entry_dir);
        assert_eq!(meta.id, "abc123");
        assert_eq!(meta.title, "Standup");
        assert_eq!(meta.entry_type, "meeting");
    }

    #[test]
    fn parse_entry_meta_missing_config_falls_back() {
        let dir = tempdir().unwrap();
        let entry_dir = dir.path().join("myid");
        fs::create_dir_all(&entry_dir).unwrap();

        let meta = parse_entry_meta(&entry_dir);
        assert_eq!(meta.title, "myid");
        assert_eq!(meta.entry_type, "unknown");
    }

    #[test]
    fn parse_entry_meta_missing_fields_fall_back() {
        let dir = tempdir().unwrap();
        let entry_dir = dir.path().join("noid");
        fs::create_dir_all(&entry_dir).unwrap();
        fs::write(
            entry_dir.join("_config.md"),
            "---\nsome_other_field: value\n---",
        )
        .unwrap();

        let meta = parse_entry_meta(&entry_dir);
        assert_eq!(meta.title, "noid");
        assert_eq!(meta.entry_type, "unknown");
    }

    // ── strip_frontmatter ─────────────────────────────────────────────────

    #[test]
    fn strip_frontmatter_removes_yaml_block() {
        let content = "---\ntitle: Test\ntype: meeting\n---\nBody text here";
        let body = strip_frontmatter(content);
        assert!(!body.contains("title:"));
        assert!(body.contains("Body text here"));
    }

    #[test]
    fn strip_frontmatter_no_frontmatter_returns_original() {
        let content = "Just plain markdown";
        assert_eq!(strip_frontmatter(content), content);
    }

    // ── list_timeline_impl ────────────────────────────────────────────────

    #[test]
    fn list_timeline_populated_returns_correct_listings() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2025-05-27", "abc123", "---\ntitle: Standup\ntype: meeting\n---");
        make_entry(dir.path(), "2025-05-27", "def456", "---\ntitle: Review PR\ntype: task\n---");

        let listings = list_timeline_impl(dir.path()).unwrap();
        assert_eq!(listings.len(), 1);
        assert_eq!(listings[0].date, "2025-05-27");
        assert_eq!(listings[0].entries.len(), 2);
        let titles: Vec<&str> = listings[0].entries.iter().map(|e| e.title.as_str()).collect();
        assert!(titles.contains(&"Standup"));
        assert!(titles.contains(&"Review PR"));
    }

    #[test]
    fn list_timeline_empty_timeline_returns_empty_vec() {
        let dir = tempdir().unwrap();
        fs::create_dir_all(dir.path().join("timeline")).unwrap();

        let listings = list_timeline_impl(dir.path()).unwrap();
        assert!(listings.is_empty());
    }

    #[test]
    fn list_timeline_missing_config_entry_still_included() {
        let dir = tempdir().unwrap();
        let entry_dir = dir.path().join("timeline").join("2025-05-27").join("noid");
        fs::create_dir_all(&entry_dir).unwrap(); // no _config.md

        let listings = list_timeline_impl(dir.path()).unwrap();
        assert_eq!(listings.len(), 1);
        assert_eq!(listings[0].entries[0].entry_type, "unknown");
    }

    #[test]
    fn list_timeline_missing_timeline_dir_returns_empty() {
        let dir = tempdir().unwrap();
        // No timeline/ directory at all
        let listings = list_timeline_impl(dir.path()).unwrap();
        assert!(listings.is_empty());
    }

    // ── read_entry_file_impl ──────────────────────────────────────────────

    #[test]
    fn read_entry_file_strips_frontmatter_for_config() {
        let dir = tempdir().unwrap();
        make_entry(
            dir.path(),
            "2025-05-27",
            "abc123",
            "---\ntitle: Standup\ntype: meeting\n---\n\n## Notes\n\nHello",
        );

        let body = read_entry_file_impl(dir.path(), "2025-05-27", "abc123", "_config.md").unwrap();
        assert!(!body.contains("title:"));
        assert!(body.contains("## Notes"));
        assert!(body.contains("Hello"));
    }

    #[test]
    fn read_entry_file_returns_full_content_for_non_config() {
        let dir = tempdir().unwrap();
        let entry_dir = dir.path().join("timeline").join("2025-05-27").join("abc123");
        fs::create_dir_all(&entry_dir).unwrap();
        fs::write(entry_dir.join("notes.md"), "Some notes content").unwrap();

        let content = read_entry_file_impl(dir.path(), "2025-05-27", "abc123", "notes.md").unwrap();
        assert_eq!(content, "Some notes content");
    }

    #[test]
    fn read_entry_file_missing_file_returns_error() {
        let dir = tempdir().unwrap();
        fs::create_dir_all(
            dir.path().join("timeline").join("2025-05-27").join("abc123"),
        )
        .unwrap();

        let result = read_entry_file_impl(dir.path(), "2025-05-27", "abc123", "nonexistent.md");
        assert!(result.is_err());
    }
}
