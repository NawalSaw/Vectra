import { useEditor } from "@/lib/editor-store";
import { Undo2, Redo2, Grid3x3, Magnet, Download, Upload, Sparkles, Github, Search, ChevronDown, FileImage, ArrowLeft } from "lucide-react";
import { AlignBar } from "@/components/editor/AlignBar";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

interface Props {
  onCommand: () => void;
  onExport: () => void;
  onImport: () => void;
  onExportPNG: (scale: number, type: "image/png" | "image/jpeg") => void;
}

export function TopBar({ onCommand, onExport, onImport, onExportPNG }: Props) {
  const { undo, redo, history, future, showGrid, setShowGrid, snap, setSnap, zoom, setZoom } = useEditor();
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-strong relative z-20 flex h-12 items-center justify-between gap-3 border-b border-border px-3">
      <Link to="/dashboard"><ArrowLeft className="size-4" /></Link>
      <div className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-[oklch(0.78_0.18_195)] to-[oklch(0.65_0.25_320)] shadow-[0_0_18px_-4px_var(--glow)]">
          <Sparkles className="size-3.5 text-background" />
        </div>
        <span className="text-sm font-bold tracking-tight">Vectra<span className="text-gradient">.</span><span className="text-muted-foreground"> Studio</span></span>
      <div className="flex items-center gap-2"> 
        <div className="ml-3 hidden items-center gap-1 md:flex">
          <Tbtn onClick={undo} disabled={!history.length} title="Undo (⌘Z)"><Undo2 className="size-3.5" /></Tbtn>
          <Tbtn onClick={redo} disabled={!future.length} title="Redo (⌘⇧Z)"><Redo2 className="size-3.5" /></Tbtn>
          <Tbtn onClick={() => setShowGrid(!showGrid)} active={showGrid} title="Grid (G)"><Grid3x3 className="size-3.5" /></Tbtn>
          <Tbtn onClick={() => setSnap(!snap)} active={snap} title="Snap (S)"><Magnet className="size-3.5" /></Tbtn>
        </div>
      </div>

      <div className="hidden flex-1 justify-center md:flex">
        <AlignBar />
      </div>

      <button
        onClick={onCommand}
        className="hidden h-7 items-center gap-2 rounded-md border border-border bg-input/40 px-2.5 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground xl:flex"
      >
        <Search className="size-3" />
        <span>Run a command…</span>
        <kbd className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">⌘K</kbd>
      </button>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-border bg-input/40 p-0.5">
          <button onClick={() => setZoom(zoom / 1.2)} className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">−</button>
          <span className="min-w-[44px] text-center text-[11px] font-mono tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom * 1.2)} className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">+</button>
        </div>
        <Tbtn onClick={onImport} title="Import SVG"><Upload className="size-3.5" /></Tbtn>
        <div className="relative">
          <div className="flex h-7 items-center overflow-hidden rounded-md bg-gradient-to-r from-[oklch(0.78_0.18_195)] to-[oklch(0.65_0.25_320)] shadow-[0_0_18px_-4px_var(--glow)]">
            <button
              onClick={onExport}
              className="flex h-full items-center gap-1.5 px-3 text-[11px] font-semibold text-background hover:opacity-95"
            >
              <Download className="size-3.5" /> Export SVG
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-full w-6 place-items-center border-l border-background/20 text-background hover:opacity-95"
              title="More export options"
            >
              <ChevronDown className="size-3" />
            </button>
          </div>
          {open && (
            <div className="absolute right-0 top-9 z-50 w-48 overflow-hidden rounded-md border border-border bg-popover shadow-xl">
              {[1, 2, 3].map((s) => (
                <button
                  key={`png-${s}`}
                  onClick={() => { setOpen(false); onExportPNG(s, "image/png"); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-secondary"
                >
                  <FileImage className="size-3.5 text-muted-foreground" /> PNG @ {s}x
                </button>
              ))}
              <div className="h-px bg-border" />
              {[1, 2].map((s) => (
                <button
                  key={`jpg-${s}`}
                  onClick={() => { setOpen(false); onExportPNG(s, "image/jpeg"); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-secondary"
                >
                  <FileImage className="size-3.5 text-muted-foreground" /> JPG @ {s}x
                </button>
              ))}
            </div>
          )}
        </div>
        {/* <a href="https://github.com" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><Github className="size-4" /></a> */}
      </div>
    </header>
  );
}

function Tbtn({ active, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...p}
      className={`grid size-7 place-items-center rounded-md transition ${
        active ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      } disabled:opacity-40`}
    />
  );
}
