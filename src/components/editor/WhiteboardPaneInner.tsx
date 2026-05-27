import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

/**
 * Inner component loaded lazily by WhiteboardPane.
 * Kept in its own file so the lazy boundary has a clean split point.
 */
export default function WhiteboardPaneInner() {
  return (
    <div className="h-full w-full">
      <Tldraw />
    </div>
  );
}
