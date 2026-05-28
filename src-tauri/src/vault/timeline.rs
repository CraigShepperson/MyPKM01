use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

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
    pub has_children: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct EntryNote {
    pub name: String,
    pub filename: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct EntrySubfolder {
    pub name: String,
    pub notes: Vec<EntryNote>,
}

#[derive(Debug, Clone, Serialize)]
pub struct EntryChildrenListing {
    pub notes: Vec<EntryNote>,
    pub subfolders: Vec<EntrySubfolder>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DayListing {
    pub date: String, // "YYYY" | "YYYY-MM" | "YYYY-MM-DD"
    pub entries: Vec<EntryMeta>,
}

/// Internal: used only for deserialising _default.md frontmatter.
#[derive(Deserialize, Default)]
struct EntryConfig {
    title: Option<String>,
    #[serde(rename = "type")]
    entry_type: Option<String>,
}

// ── Private helpers ───────────────────────────────────────────────────────────

/// Returns true if `name` matches `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`.
fn is_valid_date_folder(name: &str) -> bool {
    let b = name.as_bytes();
    match b.len() {
        4 => b.iter().all(|c| c.is_ascii_digit()),
        7 => {
            b[0..4].iter().all(|c| c.is_ascii_digit())
                && b[4] == b'-'
                && b[5..7].iter().all(|c| c.is_ascii_digit())
        }
        10 => {
            b[0..4].iter().all(|c| c.is_ascii_digit())
                && b[4] == b'-'
                && b[5..7].iter().all(|c| c.is_ascii_digit())
                && b[7] == b'-'
                && b[8..10].iter().all(|c| c.is_ascii_digit())
        }
        _ => false,
    }
}

/// Returns true if the entry folder contains any non-underscore `.md` file
/// or any subdirectory (either makes `has_children` true).
fn entry_has_children(entry_dir: &Path) -> bool {
    let entries = match fs::read_dir(entry_dir) {
        Ok(e) => e,
        Err(_) => return false,
    };
    for item in entries.flatten() {
        let name = item.file_name().to_string_lossy().to_string();
        if name.starts_with('_') {
            continue;
        }
        let Ok(ft) = item.file_type() else { continue };
        if ft.is_dir() || (ft.is_file() && name.ends_with(".md")) {
            return true;
        }
    }
    false
}

/// Parse an entry directory into an `EntryMeta`.
///
/// Falls back to the folder name / `"unknown"` if `_default.md` is absent,
/// unreadable, or has unparseable frontmatter.
pub(crate) fn parse_entry_meta(entry_dir: &Path) -> EntryMeta {
    let id = entry_dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    let has_children = entry_has_children(entry_dir);
    let config_path = entry_dir.join("_default.md");

    if !config_path.exists() {
        return EntryMeta {
            id: id.clone(),
            title: id,
            entry_type: "unknown".to_string(),
            has_children,
        };
    }

    let content = match fs::read_to_string(&config_path) {
        Ok(c) => c,
        Err(_) => {
            return EntryMeta {
                id: id.clone(),
                title: id,
                entry_type: "unknown".to_string(),
                has_children,
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

    EntryMeta { id, title, entry_type, has_children }
}

/// Strip YAML frontmatter from markdown content using gray_matter.
///
/// Returns everything after the closing `---` delimiter.
/// If no frontmatter is present the original string is returned unchanged.
pub(crate) fn strip_frontmatter(content: &str) -> String {
    let matter: Matter<YAML> = Matter::new();
    matter.parse(content).content
}

/// Extract the raw YAML frontmatter block (including delimiters and trailing newline).
///
/// Returns a slice of `content` from the start through the end of the closing `---\n`
/// if `content` starts with `---\n` and contains a closing delimiter; otherwise `""`.
pub(crate) fn extract_frontmatter(content: &str) -> &str {
    if !content.starts_with("---\n") {
        return "";
    }
    if let Some(rel) = content[4..].find("\n---\n") {
        &content[..4 + rel + 5] // "---\n" + body + "\n---\n"
    } else {
        ""
    }
}

// ── Business logic (vault-root-based, testable without Tauri state) ───────────

pub(crate) fn list_timeline_impl(vault_root: &Path) -> Result<Vec<DayListing>, VaultError> {
    let timeline_dir = vault_root.join("timeline");
    if !timeline_dir.exists() {
        return Ok(vec![]);
    }

    let date_dirs: Vec<_> = WalkDir::new(&timeline_dir)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_dir())
        .filter(|e| {
            let name = e.file_name().to_string_lossy();
            is_valid_date_folder(&name)
        })
        .collect();

    let mut listings = Vec::new();

    for date_dir in date_dirs {
        let date_name = date_dir.file_name().to_string_lossy().to_string();

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

pub(crate) fn move_entry_impl(
    vault_root: &Path,
    entry_id: &str,
    from_date: &str,
    to_date: &str,
) -> Result<(), VaultError> {
    if from_date == to_date {
        return Ok(());
    }

    let from_path = vault_root.join("timeline").join(from_date).join(entry_id);
    let to_dir = vault_root.join("timeline").join(to_date);
    let to_path = to_dir.join(entry_id);

    if !from_path.exists() {
        return Err(VaultError::IoError(format!(
            "entry not found: {}",
            from_path.display()
        )));
    }

    fs::create_dir_all(&to_dir).map_err(|e| VaultError::IoError(e.to_string()))?;
    fs::rename(&from_path, &to_path).map_err(|e| VaultError::IoError(e.to_string()))?;

    // Best-effort cleanup of the now-empty from_date directory.
    let from_dir = vault_root.join("timeline").join(from_date);
    if from_dir.exists() {
        let is_empty = fs::read_dir(&from_dir)
            .map(|mut d| d.next().is_none())
            .unwrap_or(false);
        if is_empty {
            let _ = fs::remove_dir(&from_dir);
        }
    }

    Ok(())
}

pub(crate) fn create_entry_impl(
    vault_root: &Path,
    date: &str,
    title: &str,
    entry_type: &str,
) -> Result<String, VaultError> {
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let entry_id = format!("entry-{ts}");

    let entry_dir = vault_root.join("timeline").join(date).join(&entry_id);
    fs::create_dir_all(&entry_dir).map_err(|e| VaultError::IoError(e.to_string()))?;

    let config_content = format!("---\ntitle: {title}\ntype: {entry_type}\nsource: internal\n---\n");
    fs::write(entry_dir.join("_default.md"), config_content)
        .map_err(|e| VaultError::IoError(e.to_string()))?;

    Ok(entry_id)
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

    if filename == "_default.md" {
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

    let final_content = if filename == "_default.md" {
        if let Ok(existing) = fs::read_to_string(&file_path) {
            let fm = extract_frontmatter(&existing);
            if fm.is_empty() {
                content.to_string()
            } else {
                format!("{fm}{content}")
            }
        } else {
            content.to_string()
        }
    } else {
        content.to_string()
    };

    fs::write(&file_path, final_content).map_err(|e| VaultError::IoError(e.to_string()))?;

    Ok(())
}

pub(crate) fn list_entry_children_impl(
    vault_root: &Path,
    date: &str,
    entry_id: &str,
) -> Result<EntryChildrenListing, VaultError> {
    let entry_dir = vault_root.join("timeline").join(date).join(entry_id);
    if !entry_dir.exists() {
        return Err(VaultError::IoError(format!(
            "entry not found: {}",
            entry_dir.display()
        )));
    }

    let mut notes: Vec<EntryNote> = Vec::new();
    let mut subfolders: Vec<EntrySubfolder> = Vec::new();

    let mut items: Vec<_> = fs::read_dir(&entry_dir)
        .map_err(|e| VaultError::IoError(e.to_string()))?
        .filter_map(|e| e.ok())
        .collect();
    items.sort_by_key(|e| e.file_name());

    for item in items {
        let name = item.file_name().to_string_lossy().to_string();
        if name.starts_with('_') {
            continue;
        }
        let Ok(ft) = item.file_type() else { continue };

        if ft.is_dir() {
            let subfolder_dir = item.path();
            let mut sub_items: Vec<_> = fs::read_dir(&subfolder_dir)
                .map_err(|e| VaultError::IoError(e.to_string()))?
                .filter_map(|e| e.ok())
                .collect();
            sub_items.sort_by_key(|e| e.file_name());

            let sub_notes: Vec<EntryNote> = sub_items
                .into_iter()
                .filter_map(|si| {
                    let sname = si.file_name().to_string_lossy().to_string();
                    if sname.starts_with('_') {
                        return None;
                    }
                    let sft = si.file_type().ok()?;
                    if sft.is_file() && sname.ends_with(".md") {
                        Some(EntryNote {
                            name: sname.trim_end_matches(".md").to_string(),
                            filename: sname,
                        })
                    } else {
                        None
                    }
                })
                .collect();

            subfolders.push(EntrySubfolder { name, notes: sub_notes });
        } else if ft.is_file() && name.ends_with(".md") {
            notes.push(EntryNote {
                name: name.trim_end_matches(".md").to_string(),
                filename: name,
            });
        }
    }

    Ok(EntryChildrenListing { notes, subfolders })
}

pub(crate) fn create_entry_subfolder_impl(
    vault_root: &Path,
    date: &str,
    entry_id: &str,
    name: &str,
) -> Result<(), VaultError> {
    if name.is_empty() {
        return Err(VaultError::InvalidInput(
            "subfolder name cannot be empty".to_string(),
        ));
    }
    if name.contains('/') || name.contains('\\') {
        return Err(VaultError::InvalidInput(
            "subfolder name cannot contain path separators".to_string(),
        ));
    }
    if name.starts_with('_') {
        return Err(VaultError::InvalidInput(
            "subfolder name cannot begin with underscore".to_string(),
        ));
    }

    let entry_dir = vault_root.join("timeline").join(date).join(entry_id);
    if !entry_dir.exists() {
        return Err(VaultError::IoError(format!(
            "entry not found: {}",
            entry_dir.display()
        )));
    }

    let subfolder_path = entry_dir.join(name);
    if !subfolder_path.exists() {
        fs::create_dir(&subfolder_path).map_err(|e| VaultError::IoError(e.to_string()))?;
    }

    Ok(())
}

pub(crate) fn create_entry_note_impl(
    vault_root: &Path,
    date: &str,
    entry_id: &str,
    filename: &str,
    subfolder: Option<&str>,
) -> Result<(), VaultError> {
    if !filename.ends_with(".md") {
        return Err(VaultError::InvalidInput(
            "filename must end with .md".to_string(),
        ));
    }
    if filename.starts_with('_') {
        return Err(VaultError::InvalidInput(
            "filename cannot begin with underscore".to_string(),
        ));
    }
    if filename.contains('/') || filename.contains('\\') {
        return Err(VaultError::InvalidInput(
            "filename cannot contain path separators".to_string(),
        ));
    }

    let entry_dir = vault_root.join("timeline").join(date).join(entry_id);
    if !entry_dir.exists() {
        return Err(VaultError::IoError(format!(
            "entry not found: {}",
            entry_dir.display()
        )));
    }

    let parent_dir = if let Some(sub) = subfolder {
        let sub_dir = entry_dir.join(sub);
        if !sub_dir.exists() {
            return Err(VaultError::IoError(format!(
                "subfolder not found: {}",
                sub_dir.display()
            )));
        }
        sub_dir
    } else {
        entry_dir
    };

    let file_path = parent_dir.join(filename);
    if file_path.exists() {
        return Err(VaultError::InvalidInput(format!(
            "file already exists: {filename}"
        )));
    }

    fs::write(&file_path, "").map_err(|e| VaultError::IoError(e.to_string()))?;

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

pub(crate) fn delete_entry_impl(
    vault_root: &Path,
    entry_id: &str,
    date: &str,
) -> Result<(), VaultError> {
    let entry_path = vault_root.join("timeline").join(date).join(entry_id);

    if !entry_path.exists() {
        return Err(VaultError::IoError(format!(
            "entry not found: {}",
            entry_path.display()
        )));
    }

    fs::remove_dir_all(&entry_path).map_err(|e| VaultError::IoError(e.to_string()))?;

    let date_dir = vault_root.join("timeline").join(date);
    if date_dir.exists() {
        let is_empty = fs::read_dir(&date_dir)
            .map(|mut d| d.next().is_none())
            .unwrap_or(false);
        if is_empty {
            let _ = fs::remove_dir(&date_dir);
        }
    }

    Ok(())
}

// ── Tauri commands ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn list_timeline(state: tauri::State<'_, VaultState>) -> Result<Vec<DayListing>, VaultError> {
    let vault_root = get_vault_root(&state)?;
    list_timeline_impl(&vault_root)
}

#[tauri::command]
pub fn move_entry(
    state: tauri::State<'_, VaultState>,
    entry_id: String,
    from_date: String,
    to_date: String,
) -> Result<(), VaultError> {
    let vault_root = get_vault_root(&state)?;
    move_entry_impl(&vault_root, &entry_id, &from_date, &to_date)
}

#[tauri::command]
pub fn create_entry(
    state: tauri::State<'_, VaultState>,
    date: String,
    title: String,
    entry_type: String,
) -> Result<String, VaultError> {
    let vault_root = get_vault_root(&state)?;
    create_entry_impl(&vault_root, &date, &title, &entry_type)
}

#[tauri::command]
pub fn delete_entry(
    state: tauri::State<'_, VaultState>,
    entry_id: String,
    date: String,
) -> Result<(), VaultError> {
    let vault_root = get_vault_root(&state)?;
    delete_entry_impl(&vault_root, &entry_id, &date)
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

#[tauri::command]
pub fn list_entry_children(
    state: tauri::State<'_, VaultState>,
    date: String,
    entry_id: String,
) -> Result<EntryChildrenListing, VaultError> {
    let vault_root = get_vault_root(&state)?;
    list_entry_children_impl(&vault_root, &date, &entry_id)
}

#[tauri::command]
pub fn create_entry_subfolder(
    state: tauri::State<'_, VaultState>,
    date: String,
    entry_id: String,
    name: String,
) -> Result<(), VaultError> {
    let vault_root = get_vault_root(&state)?;
    create_entry_subfolder_impl(&vault_root, &date, &entry_id, &name)
}

#[tauri::command]
pub fn create_entry_note(
    state: tauri::State<'_, VaultState>,
    date: String,
    entry_id: String,
    filename: String,
    subfolder: Option<String>,
) -> Result<(), VaultError> {
    let vault_root = get_vault_root(&state)?;
    create_entry_note_impl(&vault_root, &date, &entry_id, &filename, subfolder.as_deref())
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
        fs::write(entry_dir.join("_default.md"), config).unwrap();
    }

    // ── is_valid_date_folder ──────────────────────────────────────────────

    #[test]
    fn valid_date_folder_year() {
        assert!(is_valid_date_folder("2027"));
    }

    #[test]
    fn valid_date_folder_month() {
        assert!(is_valid_date_folder("2027-06"));
    }

    #[test]
    fn valid_date_folder_day() {
        assert!(is_valid_date_folder("2027-06-15"));
    }

    #[test]
    fn invalid_date_folder_skipped() {
        assert!(!is_valid_date_folder("notes"));
        assert!(!is_valid_date_folder("2027-06-15-extra"));
        assert!(!is_valid_date_folder("abcd"));
        assert!(!is_valid_date_folder(""));
    }

    // ── parse_entry_meta ──────────────────────────────────────────────────

    #[test]
    fn parse_entry_meta_reads_title_and_type() {
        let dir = tempdir().unwrap();
        let entry_dir = dir.path().join("abc123");
        fs::create_dir_all(&entry_dir).unwrap();
        fs::write(
            entry_dir.join("_default.md"),
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
            entry_dir.join("_default.md"),
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

    // ── extract_frontmatter ───────────────────────────────────────────────

    #[test]
    fn extract_frontmatter_returns_block_including_delimiters() {
        let content = "---\ntitle: Test\ntype: meeting\n---\nBody text here";
        let fm = extract_frontmatter(content);
        assert_eq!(fm, "---\ntitle: Test\ntype: meeting\n---\n");
    }

    #[test]
    fn extract_frontmatter_no_frontmatter_returns_empty() {
        let content = "Just plain markdown";
        assert_eq!(extract_frontmatter(content), "");
    }

    #[test]
    fn extract_frontmatter_frontmatter_only_returns_block() {
        let content = "---\ntitle: Test\n---\n";
        let fm = extract_frontmatter(content);
        assert_eq!(fm, "---\ntitle: Test\n---\n");
    }

    // ── write_entry_file_impl (frontmatter preservation) ─────────────────

    #[test]
    fn write_entry_file_preserves_frontmatter() {
        let dir = tempdir().unwrap();
        let entry_dir = dir.path().join("timeline").join("2025-05-27").join("abc");
        fs::create_dir_all(&entry_dir).unwrap();
        fs::write(
            entry_dir.join("_default.md"),
            "---\ntitle: My Entry\ntype: meeting\nsource: internal\n---\nOld body",
        )
        .unwrap();

        write_entry_file_impl(dir.path(), "2025-05-27", "abc", "_default.md", "New body").unwrap();

        let saved = fs::read_to_string(entry_dir.join("_default.md")).unwrap();
        assert!(saved.starts_with("---\ntitle: My Entry\ntype: meeting\nsource: internal\n---\n"));
        assert!(saved.ends_with("New body"));
    }

    #[test]
    fn write_entry_file_non_default_md_written_verbatim() {
        let dir = tempdir().unwrap();
        let entry_dir = dir.path().join("timeline").join("2025-05-27").join("abc");
        fs::create_dir_all(&entry_dir).unwrap();
        fs::write(entry_dir.join("notes.md"), "---\nfoo: bar\n---\nOld").unwrap();

        write_entry_file_impl(dir.path(), "2025-05-27", "abc", "notes.md", "New content").unwrap();

        let saved = fs::read_to_string(entry_dir.join("notes.md")).unwrap();
        assert_eq!(saved, "New content");
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
    fn list_timeline_year_resolution_folder_included() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2027", "abc", "---\ntitle: Future plan\ntype: event\n---");

        let listings = list_timeline_impl(dir.path()).unwrap();
        assert_eq!(listings.len(), 1);
        assert_eq!(listings[0].date, "2027");
        assert_eq!(listings[0].entries[0].title, "Future plan");
    }

    #[test]
    fn list_timeline_month_resolution_folder_included() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2027-06", "abc", "---\ntitle: Book flights\ntype: task\n---");

        let listings = list_timeline_impl(dir.path()).unwrap();
        assert_eq!(listings.len(), 1);
        assert_eq!(listings[0].date, "2027-06");
        assert_eq!(listings[0].entries[0].title, "Book flights");
    }

    #[test]
    fn list_timeline_unrecognised_folder_skipped() {
        let dir = tempdir().unwrap();
        // Create a valid entry and an unrecognised folder
        make_entry(dir.path(), "2025-05-27", "abc", "---\ntitle: Valid\ntype: task\n---");
        fs::create_dir_all(dir.path().join("timeline").join("notes")).unwrap();

        let listings = list_timeline_impl(dir.path()).unwrap();
        assert_eq!(listings.len(), 1);
        assert_eq!(listings[0].date, "2025-05-27");
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
        fs::create_dir_all(&entry_dir).unwrap(); // no _default.md

        let listings = list_timeline_impl(dir.path()).unwrap();
        assert_eq!(listings.len(), 1);
        assert_eq!(listings[0].entries[0].entry_type, "unknown");
    }

    #[test]
    fn list_timeline_missing_timeline_dir_returns_empty() {
        let dir = tempdir().unwrap();
        let listings = list_timeline_impl(dir.path()).unwrap();
        assert!(listings.is_empty());
    }

    // ── move_entry_impl ───────────────────────────────────────────────────

    #[test]
    fn move_entry_year_to_month() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2027", "abc", "---\ntitle: Plan\ntype: event\n---");

        move_entry_impl(dir.path(), "abc", "2027", "2027-06").unwrap();

        assert!(dir.path().join("timeline").join("2027-06").join("abc").exists());
        // Empty parent removed
        assert!(!dir.path().join("timeline").join("2027").exists());
    }

    #[test]
    fn move_entry_month_to_day() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2027-06", "abc", "---\ntitle: Plan\ntype: event\n---");

        move_entry_impl(dir.path(), "abc", "2027-06", "2027-06-15").unwrap();

        assert!(dir.path().join("timeline").join("2027-06-15").join("abc").exists());
        assert!(!dir.path().join("timeline").join("2027-06").exists());
    }

    #[test]
    fn move_entry_nonempty_parent_not_removed() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2027", "abc", "---\ntitle: A\ntype: event\n---");
        make_entry(dir.path(), "2027", "def", "---\ntitle: B\ntype: event\n---");

        move_entry_impl(dir.path(), "abc", "2027", "2027-06").unwrap();

        // 2027 still has def
        assert!(dir.path().join("timeline").join("2027").exists());
        assert!(dir.path().join("timeline").join("2027").join("def").exists());
    }

    #[test]
    fn move_entry_missing_source_returns_error() {
        let dir = tempdir().unwrap();
        fs::create_dir_all(dir.path().join("timeline")).unwrap();

        let result = move_entry_impl(dir.path(), "nonexistent", "2027", "2027-06");
        assert!(result.is_err());
    }

    #[test]
    fn move_entry_same_date_is_noop() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2027", "abc", "---\ntitle: Plan\ntype: event\n---");

        move_entry_impl(dir.path(), "abc", "2027", "2027").unwrap();

        // Entry still in place
        assert!(dir.path().join("timeline").join("2027").join("abc").exists());
    }

    // ── delete_entry_impl ─────────────────────────────────────────────────

    #[test]
    fn delete_entry_removes_entry_directory() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2027-06-15", "abc", "---\ntitle: Test\ntype: event\n---");

        delete_entry_impl(dir.path(), "abc", "2027-06-15").unwrap();

        assert!(!dir.path().join("timeline").join("2027-06-15").join("abc").exists());
    }

    #[test]
    fn delete_entry_cleans_up_empty_date_dir() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2027-06-15", "abc", "---\ntitle: Test\ntype: event\n---");

        delete_entry_impl(dir.path(), "abc", "2027-06-15").unwrap();

        assert!(!dir.path().join("timeline").join("2027-06-15").exists());
    }

    #[test]
    fn delete_entry_preserves_nonempty_date_dir() {
        let dir = tempdir().unwrap();
        make_entry(dir.path(), "2027-06-15", "abc", "---\ntitle: A\ntype: event\n---");
        make_entry(dir.path(), "2027-06-15", "def", "---\ntitle: B\ntype: event\n---");

        delete_entry_impl(dir.path(), "abc", "2027-06-15").unwrap();

        assert!(!dir.path().join("timeline").join("2027-06-15").join("abc").exists());
        assert!(dir.path().join("timeline").join("2027-06-15").join("def").exists());
        assert!(dir.path().join("timeline").join("2027-06-15").exists());
    }

    #[test]
    fn delete_entry_missing_entry_returns_error() {
        let dir = tempdir().unwrap();
        fs::create_dir_all(dir.path().join("timeline")).unwrap();

        let result = delete_entry_impl(dir.path(), "nonexistent", "2027-06-15");
        assert!(result.is_err());
    }

    // ── create_entry_impl ─────────────────────────────────────────────────

    #[test]
    fn create_entry_year_resolution() {
        let dir = tempdir().unwrap();
        let entry_id = create_entry_impl(dir.path(), "2027", "Future plan", "event").unwrap();

        assert!(dir.path().join("timeline").join("2027").join(&entry_id).exists());
        assert!(dir.path().join("timeline").join("2027").join(&entry_id).join("_default.md").exists());
    }

    #[test]
    fn create_entry_writes_source_internal_in_frontmatter() {
        let dir = tempdir().unwrap();
        let entry_id = create_entry_impl(dir.path(), "2025-05-28", "Standup", "meeting").unwrap();

        let content = fs::read_to_string(
            dir.path().join("timeline").join("2025-05-28").join(&entry_id).join("_default.md"),
        )
        .unwrap();
        assert!(content.contains("title: Standup"));
        assert!(content.contains("type: meeting"));
        assert!(content.contains("source: internal"));
    }

    #[test]
    fn create_entry_month_resolution() {
        let dir = tempdir().unwrap();
        let entry_id = create_entry_impl(dir.path(), "2027-06", "Book flights", "task").unwrap();

        assert!(dir.path().join("timeline").join("2027-06").join(&entry_id).exists());
    }

    #[test]
    fn create_entry_day_resolution() {
        let dir = tempdir().unwrap();
        let entry_id = create_entry_impl(dir.path(), "2027-06-15", "Flight", "event").unwrap();

        assert!(dir.path().join("timeline").join("2027-06-15").join(&entry_id).exists());
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

        let body = read_entry_file_impl(dir.path(), "2025-05-27", "abc123", "_default.md").unwrap();
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
