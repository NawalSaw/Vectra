import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useEditor } from "@/lib/editor-store";
import { Toolbar } from "@/components/editor/Toolbar";
import { TopBar } from "@/components/editor/TopBar";
import { LayersPanel } from "@/components/editor/LayersPanel";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { CommandPalette } from "@/components/editor/CommandPalette";
import { shapesToSVG, downloadText } from "@/lib/svg-export";
import { toast } from "sonner";
import { authStateFn } from "@/integrations/authStateFn";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Vectra Studio — World-class SVG editor" },
      { name: "description", content: "A premium browser-based SVG editor with infinite canvas, layers, command palette, and pro-grade tooling." },
      { property: "og:title", content: "Vectra Studio — SVG Editor" },
      { property: "og:description", content: "Design vector graphics with an infinite canvas, smart guides, and a futuristic command palette." },
    ],
  }),
  component: EditorPage,
  beforeLoad: async () => await authStateFn(),
  loader: async ({ context }) => {
    return { userId: context.userId }
  },
});

function EditorPage() {
  const ed = useEditor();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const onExport = () => {
    const svg = shapesToSVG(ed.shapes, ed.canvasW, ed.canvasH, ed.bg, ed.defs);
    downloadText("vectra-design.svg", svg);
  };
  const onExportPNG = async (scale: number, type: "image/png" | "image/jpeg") => {
    try {
      const { exportPNG, downloadBlob } = await import("@/lib/png-export");
      const blob = await exportPNG(ed.shapes, ed.canvasW, ed.canvasH, ed.bg, ed.defs, scale, type);
      const ext = type === "image/jpeg" ? "jpg" : "png";
      downloadBlob(`vectra-design@${scale}x.${ext}`, blob);
      toast.success(`Exported ${ext.toUpperCase()} @ ${scale}x`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to rasterize SVG.");
    }
  };
  const onImport = () => fileRef.current?.click();

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = (e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA|SELECT/);
      if (inField) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); return; }
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? ed.redo() : ed.undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") { e.preventDefault(); ed.duplicate(); return; }
      if (meta && e.key.toLowerCase() === "g") { e.preventDefault(); e.shiftKey ? ed.ungroupSelected() : ed.groupSelected(); return; }
      if (meta && e.key.toLowerCase() === "a") { e.preventDefault(); ed.select(ed.shapes.map((s) => s.id)); return; }
      if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); onExport(); return; }
      if (meta && e.key.toLowerCase() === "c") { e.preventDefault(); ed.copySelected(); return; }
      if (meta && e.key.toLowerCase() === "v") { e.preventDefault(); ed.paste(); return; }
      if (e.key === "Backspace" || e.key === "Delete") { ed.deleteSelected(); return; }
      if (e.key === "]") { ed.bringForward(); return; }
      if (e.key === "[") { ed.sendBackward(); return; }
      const map: Record<string, () => void> = {
        v: () => ed.setTool("select"),
        h: () => ed.setTool("hand"),
        r: () => ed.setTool("rect"),
        o: () => ed.setTool("ellipse"),
        l: () => ed.setTool("line"),
        t: () => ed.setTool("text"),
        p: () => ed.setTool("pen"),
        b: () => ed.setTool("pencil"),
        g: () => ed.setShowGrid(!ed.showGrid),
        s: () => ed.setSnap(!ed.snap),
        Escape: () => { ed.setActiveGroupId(null); ed.select([]); },
      };
      const fn = map[e.key] || map[e.key.toLowerCase()];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ed]);

  const handleFile = async (f: File) => {
    try {
      const text = await f.text();
      const { parseSVG } = await import("@/lib/svg-import");
      const res = parseSVG(text);
      if (!res.shapes.length) {
        toast.warning("No supported elements found in SVG.");
        return;
      }
      ed.loadShapes(res.shapes, { canvasW: res.width, canvasH: res.height, defs: res.defs });
      toast.success(`Imported ${res.shapes.length} layer${res.shapes.length === 1 ? "" : "s"} from ${f.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse SVG file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sel = ed.shapes.filter((s) => ed.selectedIds.includes(s.id));

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar onCommand={() => setPaletteOpen(true)} onExport={onExport} onImport={onImport} onExportPNG={onExportPNG} />
      <input
        ref={fileRef}
        type="file"
        accept=".svg,image/svg+xml"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="flex flex-1 gap-2 overflow-hidden p-2">
        <aside className="glass flex w-12 flex-col rounded-xl">
          <Toolbar />
        </aside>

        <aside className="glass hidden w-60 flex-col overflow-hidden rounded-xl lg:flex">
          <LayersPanel />
        </aside>

        <main ref={wrapRef} className="glass relative flex-1 overflow-hidden rounded-xl">
          <EditorCanvas width={size.w} height={size.h} />
          <Minimap />
        </main>

        <aside className="glass hidden w-72 flex-col overflow-hidden rounded-xl lg:flex">
          <PropertiesPanel />
        </aside>
      </div>

      <StatusBar selectedCount={sel.length} />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onExport={onExport} onImport={onImport} />
    </div>
  );
}

function Minimap() {
  const { shapes, canvasW, canvasH } = useEditor();
  const w = 180, h = (canvasH / canvasW) * 180;
  return (
    <div className="absolute bottom-3 right-3 overflow-hidden rounded-lg border border-border bg-popover/80 backdrop-blur-md shadow-lg">
      <svg width={w} height={h} viewBox={`0 0 ${canvasW} ${canvasH}`}>
        <rect width={canvasW} height={canvasH} fill="oklch(0.18 0.02 270)" />
        {shapes.map((s) => (
          <rect key={s.id} x={s.x} y={s.y} width={s.w} height={s.h} fill={s.fill} opacity={0.7} />
        ))}
      </svg>
    </div>
  );
}

function StatusBar({ selectedCount }: { selectedCount: number }) {
  const { tool, zoom, pan, shapes, snap, showGrid } = useEditor();
  return (
    <footer className="glass-strong z-10 flex h-7 items-center justify-between border-t border-border px-3 text-[10px] uppercase tracking-widest text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>Tool: <span className="text-foreground">{tool}</span></span>
        <span>Layers: <span className="text-foreground">{shapes.length}</span></span>
        <span>Selected: <span className="text-foreground">{selectedCount}</span></span>
      </div>
      <div className="flex items-center gap-3 font-mono">
        <span>Snap {snap ? "ON" : "OFF"}</span>
        <span>Grid {showGrid ? "ON" : "OFF"}</span>
        <span>Pan {Math.round(pan.x)},{Math.round(pan.y)}</span>
        <span>Zoom {Math.round(zoom * 100)}%</span>
      </div>
    </footer>
  );
}
