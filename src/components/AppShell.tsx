import { ReactNode } from "react";

interface AppShellProps {
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  topbarContent?: ReactNode;
}

/**
 * Fixed two-panel layout shell per ARCHITECTURE.md:
 *
 *   ┌────────────────────────────────────────────────────┐
 *   │ topbar (44px)                                      │
 *   ├─────────────────┬──────────────────────────────────┤
 *   │ left panel      │ right panel (editor)         │
 *   │ (340px)         │ (fills remaining width)      │
 *   │ scrollable      │ scrollable                   │
 *   ├─────────────────┴──────────────────────────────┤
 *   │ query bar (52px)                               │
 *   └────────────────────────────────────────────────┘
 */
export function AppShell({ leftPanel, rightPanel, topbarContent }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Topbar — 44px, full width */}
      <div className="shrink-0 h-[44px] border-b border-border bg-background flex items-center justify-end px-3">
        {topbarContent}
      </div>

      {/* Main panels row — fills space between topbar and query bar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — 340px fixed, scrollable */}
        <div className="w-[340px] shrink-0 overflow-y-auto border-r border-border bg-muted/20">
          {leftPanel ?? (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              date tree
            </div>
          )}
        </div>

        {/* Right panel — fills remaining width, scrollable */}
        <div className="flex-1 overflow-y-auto bg-background">
          {rightPanel ?? (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              editor
            </div>
          )}
        </div>
      </div>

      {/* Query bar — 52px, full width, pinned to bottom */}
      <div className="shrink-0 h-[52px] border-t border-border bg-muted/10 flex items-center px-4">
        <span className="text-xs text-muted-foreground">⌘K — query bar</span>
      </div>
    </div>
  );
}
