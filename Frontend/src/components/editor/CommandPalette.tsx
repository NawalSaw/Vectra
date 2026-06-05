import { useEffect, useState } from "react";
import { useEditor, type Tool } from "@/lib/editor-store";

interface Cmd {
  id: string;
  title: string;
  hint?: string;
  run: () => void;
}

export function CommandPalette({ open, onOpenChange, onExport, onImport }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const ed = useEditor();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const tools: Tool[] = ["select", "hand", "rect", "ellipse", "line", "text", "pen", "pencil"];
  const cmds: Cmd[] = [
    ...tools.map((t) => ({ id: `tool:${t}`, title: `Tool: ${t}`, hint: "Tool", run: () => ed.setTool(t) })),
    { id: "undo", title: "Undo", hint: "⌘Z", run: ed.undo },
    { id: "redo", title: "Redo", hint: "⌘⇧Z", run: ed.redo },
    { id: "grid", title: ed.showGrid ? "Hide grid" : "Show grid", hint: "G", run: () => ed.setShowGrid(!ed.showGrid) },
    { id: "snap", title: ed.snap ? "Disable snap" : "Enable snap", hint: "S", run: () => ed.setSnap(!ed.snap) },
    { id: "dup", title: "Duplicate selection", hint: "⌘D", run: ed.duplicate },
    { id: "del", title: "Delete selection", hint: "⌫", run: ed.deleteSelected },
    { id: "fwd", title: "Bring forward", hint: "]", run: ed.bringForward },
    { id: "bwd", title: "Send backward", hint: "[", run: ed.sendBackward },
    { id: "zoom-100", title: "Zoom to 100%", run: () => ed.setZoom(1) },
    { id: "zoom-fit", title: "Zoom to fit", run: () => { ed.setZoom(0.6); ed.setPan({ x: 80, y: 60 }); } },
    { id: "reset", title: "Reset canvas", run: ed.reset },
    { id: "export", title: "Export SVG", run: onExport },
    { id: "import", title: "Import SVG", run: onImport },
  ];

  const filtered = q
    ? cmds.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
    : cmds;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[12vh]" onClick={() => onOpenChange(false)}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong w-[560px] max-w-[92vw] overflow-hidden rounded-xl shadow-2xl glow-ring">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a command…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          {filtered.slice(0, 60).map((c) => (
            <button
              key={c.id}
              onClick={() => { c.run(); onOpenChange(false); }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <span>{c.title}</span>
              {c.hint && <kbd className="rounded bg-secondary/60 px-1.5 py-0.5 text-[10px]">{c.hint}</kbd>}
            </button>
          ))}
          {!filtered.length && <div className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</div>}
        </div>
      </div>
    </div>
  );
}
