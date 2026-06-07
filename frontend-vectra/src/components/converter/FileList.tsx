import { useConverter } from "@/lib/converter-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Trash2, AlertCircle, FileImage } from "lucide-react";

export function FileList() {
  const jobs = useConverter((s) => s.jobs);
  const activeId = useConverter((s) => s.activeId);
  const setActive = useConverter((s) => s.setActive);
  const removeJob = useConverter((s) => s.removeJob);

  if (!jobs.length) return null;

  return (
    <div className="space-y-1.5">
      <div className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Files · {jobs.length}
      </div>
      <div className="space-y-1">
        {jobs.map((j) => {
          const active = j.id === activeId;
          return (
            <button
              key={j.id}
              onClick={() => setActive(j.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition-colors",
                active
                  ? "border-primary/40 bg-primary/10"
                  : "hover:bg-secondary/60",
              )}
            >
              <div className="checker size-10 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                <img src={j.dataUrl} alt="" className="size-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{j.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {j.width}×{j.height} · {(j.size / 1024).toFixed(0)} KB
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {j.status === "processing" && (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                {j.status === "done" && (
                  <CheckCircle2 className="size-4 text-primary" />
                )}
                {j.status === "error" && (
                  <AlertCircle className="size-4 text-destructive" />
                )}
                {j.status === "pending" && (
                  <FileImage className="size-4 text-muted-foreground" />
                )}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeJob(j.id);
                  }}
                  className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
