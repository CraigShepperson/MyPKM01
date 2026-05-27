import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

// Stub out Tauri IPC — not available in jsdom
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue("/test/vault"),
}));

// BlockNote relies on browser APIs not available in jsdom.
vi.mock("./components/editor/BlockNoteEditor", () => ({
  BlockNoteEditor: ({ filePath }: { filePath?: string | null }) => (
    <div data-testid="editor-stub" data-filepath={filePath ?? ""}>
      editor
    </div>
  ),
}));

// DateTree calls invoke too — stub it out
vi.mock("./components/DateTree", () => ({
  DateTree: ({ vaultRoot }: { vaultRoot: string }) => (
    <div data-testid="date-tree-stub" data-vault={vaultRoot}>
      tree
    </div>
  ),
}));

describe("App", () => {
  it("shows the main window once vault path is resolved", async () => {
    render(<App />);
    // After invoke resolves the app transitions from loading to main window
    await waitFor(() => {
      expect(screen.getByTestId("editor-stub")).toBeInTheDocument();
    });
    expect(screen.getByTestId("date-tree-stub")).toBeInTheDocument();
  });
});
