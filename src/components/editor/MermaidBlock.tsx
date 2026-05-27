import { useEffect, useRef } from "react";

interface MermaidBlockProps {
  /** Raw mermaid diagram source, e.g. "graph TD; A-->B" */
  source: string;
}

/**
 * Renders a Mermaid diagram. Mermaid is loaded via dynamic import only —
 * never at module top-level — to prevent bundle inflation and global state
 * pollution on startup.
 */
export function MermaidBlock({ source }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      // Dynamic import: no static top-level `import mermaid from 'mermaid'`
      const mermaid = await import("mermaid");
      if (cancelled) return;

      mermaid.default.initialize({ startOnLoad: false });

      if (containerRef.current) {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.default.render(id, source);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      }
    }

    render().catch(console.error);
    return () => { cancelled = true; };
  }, [source]);

  return <div ref={containerRef} className="mermaid-block" />;
}
