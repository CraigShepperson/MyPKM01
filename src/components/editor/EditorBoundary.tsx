import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Error boundary that wraps the editor pane.
 * If the editor layer throws (e.g. BlockNote failing to initialise in Tauri's
 * webview), the app shell remains visible and a diagnostic message is shown
 * instead of the entire UI disappearing.
 */
export class EditorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[EditorBoundary] Editor threw:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col h-full w-full items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
          <p className="font-medium text-destructive">Editor failed to load</p>
          <pre className="max-w-lg overflow-auto rounded bg-muted px-3 py-2 text-xs">
            {this.state.error.message}
          </pre>
          <p className="text-xs">Check the console for the full stack trace.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
