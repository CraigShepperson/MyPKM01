/**
 * Extract { date, entryId, filename } from an absolute file path.
 *
 * Handles both Windows (`\`) and Unix (`/`) separators.
 * Searches for the last "timeline" segment to locate the vault root boundary,
 * then treats: [0]=date, [1]=entryId, [2..]=filename (may include a subfolder).
 *
 * Note: keys use camelCase to match Tauri v2's IPC convention
 * (Rust snake_case params are automatically mapped to camelCase).
 */
export function parseFilePath(
  filePath: string,
): { date: string; entryId: string; filename: string } | null {
  const parts = filePath.replace(/\\/g, "/").split("/");
  const timelineIdx = parts.lastIndexOf("timeline");
  if (timelineIdx === -1 || parts.length < timelineIdx + 3) return null;
  const date = parts[timelineIdx + 1];
  const entryId = parts[timelineIdx + 2];
  const filename = parts.slice(timelineIdx + 3).join("/");
  if (!date || !entryId || !filename) return null;
  return { date, entryId, filename };
}
