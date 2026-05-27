import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

// BlockNote relies on browser APIs not available in jsdom.
// Smoke test: verify App mounts without throwing.
vi.mock("./components/editor/BlockNoteEditor", () => ({
  BlockNoteEditor: () => <div data-testid="editor-stub">editor</div>,
}));

describe("App", () => {
  it("mounts without throwing", () => {
    render(<App />);
    // The AppShell layout regions are present
    expect(screen.getByTestId("editor-stub")).toBeInTheDocument();
  });
});
