import { useEffect, useMemo, useRef, useState } from "react";
import { useConverter } from "@/lib/converter-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import {
  Download,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  Copy,
  ImageIcon,
  Code2,
  SplitSquareHorizontal,
} from "lucide-react";

type Mode = "compare" | "raster" | "svg" | "code";

export function PreviewCanvas() {
  const job = useConverter((s) =>
    s.jobs.find((j) => j.id === s.activeId) ?? null,
  );
  const isConverting = useConverter((s) => s.isConverting);

  const [mode, setMode] = useState<Mode>("compare");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [split, setSplit] = useState(50);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const splitDragRef = useRef(false);

  useEffect(() => {
  const handler = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  document.addEventListener("fullscreenchange", handler);

  return () => {
    document.removeEventListener("fullscreenchange", handler);
  };
}, []);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [job?.id]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((z) => Math.min(8, Math.max(0.2, z * (1 + delta))));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.split === "handle") {
      splitDragRef.current = true;
      return;
    }
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (splitDragRef.current && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      setSplit(Math.max(2, Math.min(98, pct)));
      return;
    }
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.px + (e.clientX - dragRef.current.x),
      y: dragRef.current.py + (e.clientY - dragRef.current.y),
    });
  };
  const onMouseUp = () => {
    dragRef.current = null;
    splitDragRef.current = false;
  };

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  const svgUrl = useMemo(() => {
    if (!job?.svg) return null;
    const blob = new Blob([job.svg], { type: "image/svg+xml" });
    return URL.createObjectURL(blob);
  }, [job?.svg]);

  useEffect(() => () => { if (svgUrl) URL.revokeObjectURL(svgUrl); }, [svgUrl]);

  const stats = job?.svg
    ? {
        size: new Blob([job.svg]).size,
        paths: (job.svg.match(/<path/g) ?? []).length,
        time: job.durationMs ?? 0,
      }
    : null;

async function downloadSvg() {
  if (!job?.svg) return;

  try {
    setIsDownloading(true);

    const blob = new Blob([job.svg], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download =
      job.name.replace(/\.[^.]+$/, "") + ".svg";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  } finally {
    setTimeout(() => {
      setIsDownloading(false);
    }, 400);
  }
}
async function copySvg() {
  if (!job?.svg) return;

  try {
    await navigator.clipboard.writeText(job.svg);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  } catch (error) {
    console.error("Failed to copy SVG:", error);
  }
}

async function toggleFullscreen() {
  if (!containerRef.current) return;

  try {
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.error("Fullscreen failed:", error);
  }
}

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card/40 px-3 py-2">
        <div className="flex items-center gap-1 rounded-md border border-border bg-input/40 p-0.5">
          {[
            { v: "compare" as const, icon: SplitSquareHorizontal, label: "Compare" },
            { v: "raster" as const, icon: ImageIcon, label: "Raster" },
            { v: "svg" as const, icon: Maximize2, label: "SVG" },
            { v: "code" as const, icon: Code2, label: "Code" },
          ].map((m) => (
            <button
              key={m.v}
              onClick={() => setMode(m.v)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition",
                mode === m.v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <m.icon className="size-3.5" />
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-14 text-center font-mono text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(8, z + 0.2))}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="Reset view"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
<Button
  variant="secondary"
  size="sm"
  onClick={copySvg}
  disabled={!job?.svg}
  className="gap-1.5 min-w-[110px]"
>
  {copied ? (
    <>
      <Check className="size-3.5" />
      Copied
    </>
  ) : (
    <>
      <Copy className="size-3.5" />
      Copy SVG
    </>
  )}
</Button>
 <Button
  size="sm"
  onClick={downloadSvg}
  disabled={!job?.svg || isDownloading}
  className="gap-1.5 min-w-[110px]"
>
  {isDownloading ? (
    <>
      <Loader2 className="size-3.5 animate-spin" />
      Saving
    </>
  ) : (
    <>
      <Download className="size-3.5" />
      Download
    </>
  )}
</Button>
<Button
  variant="outline"
  size="sm"
  onClick={toggleFullscreen}
  disabled={!job}
  className="gap-1.5"
>
  <Maximize2 className="size-3.5" />
  {isFullscreen ? "Exit" : "Fullscreen"}
</Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
      >
        {!job ? (
          <EmptyCanvas />
        ) : mode === "code" ? (
          <SvgCodeViewer svg={job?.svg ?? ""} />
        ) : (
          <>
            {/* Raster layer */}
            {(mode === "raster" || mode === "compare") && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  clipPath:
                    mode === "compare"
                      ? `inset(0 ${100 - split}% 0 0)`
                      : undefined,
                }}
              >
                <img
                  src={job.dataUrl}
                  alt=""
                  draggable={false}
                  style={{ transform, transformOrigin: "center" }}
                  className="max-h-[88%] max-w-[88%] select-none object-contain drop-shadow-2xl"
                />
              </div>
            )}
            {/* SVG layer */}
            {(mode === "svg" || mode === "compare") && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  clipPath:
                    mode === "compare"
                      ? `inset(0 0 0 ${split}%)`
                      : undefined,
                }}
              >
                {svgUrl ? (
                  <img
                    src={svgUrl}
                    alt=""
                    draggable={false}
                    style={{ transform, transformOrigin: "center" }}
                    className="max-h-[88%] max-w-[88%] select-none object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    {isConverting ? "Vectorizing…" : "Press Vectorize to generate SVG"}
                  </div>
                )}
              </div>
            )}

            {/* Split handle */}
            {mode === "compare" && (
              <div
                data-split="handle"
                className="absolute top-0 bottom-0 z-10 w-px cursor-ew-resize bg-primary/80 shadow-[0_0_20px_var(--glow)]"
                style={{ left: `${split}%` }}
              >
                <div
                  data-split="handle"
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-popover px-2 py-1 text-[10px] font-mono text-muted-foreground"
                >
                  {Math.round(split)}%
                </div>
              </div>
            )}

            {/* Labels */}
            {mode === "compare" && (
              <>
                <Tag className="left-3 top-3">Original</Tag>
                <Tag className="right-3 top-3">SVG</Tag>
              </>
            )}

            {isConverting && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden">
                <div className="shimmer h-full w-full" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between gap-4 border-t border-border bg-card/40 px-4 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          {job ? (
            <>
              <span className="font-mono">{job.name}</span>
              <span>{job.width}×{job.height}px</span>
              <span>{(job.size / 1024).toFixed(0)} KB</span>
            </>
          ) : (
            <span>No file selected</span>
          )}
        </div>
        {stats && (
          <div className="flex items-center gap-4">
            <span>SVG · {(stats.size / 1024).toFixed(1)} KB</span>
            <span>{stats.paths} paths</span>
            <span className="text-primary">⏱ {stats.time.toFixed(0)}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "absolute z-10 rounded-md border border-border bg-popover/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

function EmptyCanvas() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 size-16 rounded-2xl bg-primary/15 ring-1 ring-primary/30 grid place-items-center animate-float">
          <ImageIcon className="size-7 text-primary" />
        </div>
        <div className="text-base font-semibold">Your canvas is empty</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Drop an image on the left to start vectorizing
        </div>
      </div>
    </div>
  );
}

function SvgCodeViewer({ svg }: { svg: string }) {
  const [copied, setCopied] = useState(false);

  const formatted = useMemo(() => {
    if (!svg) return "// Run vectorize to see SVG output";

    return formatSvg(svg);
  }, [svg]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatted);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  }

  const lines = formatted.split("\n");

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#0b1020]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-red-400" />
          <div className="size-2 rounded-full bg-yellow-400" />
          <div className="size-2 rounded-full bg-green-400" />

          <span className="ml-3 font-mono text-xs text-slate-400">
            output.svg
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full font-mono text-[12px] leading-6">
          {lines.map((line, index) => (
            <div
              key={index}
              className="group flex hover:bg-white/[0.03]"
            >
              {/* Line number */}
              <div className="sticky left-0 select-none border-r border-white/5 bg-[#0b1020] px-4 text-right text-slate-500">
                {index + 1}
              </div>

              {/* Code */}
              <div className="flex-1 whitespace-pre-wrap break-words px-4 py-[1px]">
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightSvg(line),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatSvg(svg: string) {
  return svg
    .replace(/></g, ">\n<")
    .replace(
      /(>)(<)(\/*)/g,
      "$1\n$2$3",
    )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function highlightSvg(line: string) {
  return line
    .replace(
      /(&)/g,
      "&amp;",
    )
    .replace(
      /(<\/?[\w:-]+)/g,
      '<span class="text-sky-400">$1</span>',
    )
    .replace(
      /([\w:-]+)=/g,
      '<span class="text-violet-400">$1</span>=',
    )
    .replace(
      /"([^"]*)"/g,
      '"<span class="text-emerald-400">$1</span>"',
    );
}