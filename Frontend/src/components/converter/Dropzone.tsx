import { useCallback, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { useConverter } from "@/lib/converter-store";
import { cn } from "@/lib/utils";

export function Dropzone({ compact = false }: { compact?: boolean }) {
  const addFiles = useConverter((s) => s.addFiles);
  const [hover, setHover] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setHover(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) void addFiles(files);
    },
    [addFiles],
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 text-center transition-all",
        compact ? "py-6" : "py-14",
        hover && "border-primary/80 bg-primary/5 glow-ring",
      )}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) void addFiles(files);
          e.currentTarget.value = "";
        }}
      />
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-2xl group-hover:bg-primary/50 transition-colors" />
        <div className="rounded-full bg-secondary/60 p-3 ring-1 ring-border">
          {compact ? <ImagePlus className="size-5" /> : <Upload className="size-7" />}
        </div>
      </div>
      <div>
        <div className={cn("font-semibold", compact ? "text-sm" : "text-lg")}>
          {compact ? "Add more files" : "Drop images here, or click to upload"}
        </div>
        {!compact && (
          <div className="mt-1 text-sm text-muted-foreground">
            PNG, JPG, WebP, GIF · batch supported · everything runs in your browser
          </div>
        )}
      </div>
    </label>
  );
}
