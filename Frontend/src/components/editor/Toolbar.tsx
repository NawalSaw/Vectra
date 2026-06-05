import { useEditor, type Tool } from "@/lib/editor-store";
import { MousePointer2, Square, Circle, Minus, Type, PenTool, Pencil, Hand } from "lucide-react";

const TOOLS: { id: Tool; label: string; key: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "select", label: "Select", key: "V", icon: MousePointer2 },
  { id: "hand", label: "Hand", key: "H", icon: Hand },
  { id: "rect", label: "Rectangle", key: "R", icon: Square },
  { id: "ellipse", label: "Ellipse", key: "O", icon: Circle },
  { id: "line", label: "Line", key: "L", icon: Minus },
  { id: "text", label: "Text", key: "T", icon: Type },
  { id: "pen", label: "Pen", key: "P", icon: PenTool },
  { id: "pencil", label: "Pencil", key: "B", icon: Pencil },
];

export function Toolbar() {
  const { tool, setTool } = useEditor();
  return (
    <div className="flex flex-col items-center gap-1 p-2">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const active = tool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={`${t.label}  (${t.key})`}
            className={`group relative grid size-10 place-items-center rounded-lg transition ${
              active
                ? "bg-gradient-to-br from-[oklch(0.78_0.18_195)] to-[oklch(0.65_0.25_320)] text-background shadow-[0_0_18px_-4px_var(--glow)]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            <span className="pointer-events-none absolute left-12 z-50 hidden whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] text-foreground shadow-lg group-hover:block">
              {t.label} <span className="ml-1 text-muted-foreground">{t.key}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
