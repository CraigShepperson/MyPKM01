import { lazy, Suspense } from "react";

/**
 * tldraw is loaded lazily to:
 * 1. Keep the initial bundle small (tldraw is ~2 MB)
 * 2. Isolate any React 19 peer-dep issues inside the Suspense boundary
 *    so the rest of the app continues to function if tldraw fails to load.
 */
const WhiteboardPaneInner = lazy(() => import("./WhiteboardPaneInner"));

export function WhiteboardPane() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Loading whiteboard…
        </div>
      }
    >
      <WhiteboardPaneInner />
    </Suspense>
  );
}
