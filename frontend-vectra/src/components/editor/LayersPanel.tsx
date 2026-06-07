import { useEditor, type Shape } from "@/lib/editor-store";
import {
  Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronUp, ChevronDown,
  Square, Circle, Type, Minus, Pen, Folder, FolderOpen, ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";

const iconFor = (s: Shape) => {
  switch (s.type) {
    case "rect": return Square;
    case "ellipse": return Circle;
    case "text": return Type;
    case "line": return Minus;
    case "path": return Pen;
  }
};

interface Row {
  kind: "shape" | "group";
  id: string;
  name: string;
  shapes: Shape[]; // group: members; shape: [self]
}

export function LayersPanel() {
  const {
    shapes, selectedIds, activeGroupId,
    select, toggleVisible, toggleLocked, deleteSelected, duplicate,
    bringForward, sendBackward, rename, setActiveGroupId, ungroupSelected,
  } = useEditor();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Build flat row list grouped by groupId, preserving stacking order (top-most first)
  const rows: Row[] = useMemo(() => {
    const reversed = [...shapes].reverse();
    const seen = new Set<string>();
    const out: Row[] = [];
    for (const s of reversed) {
      if (s.groupId) {
        if (seen.has(s.groupId)) continue;
        seen.add(s.groupId);
        const members = reversed.filter((x) => x.groupId === s.groupId);
        out.push({ kind: "group", id: s.groupId, name: `Group · ${members.length}`, shapes: members });
      } else {
        out.push({ kind: "shape", id: s.id, name: s.name, shapes: [s] });
      }
    }
    return out;
  }, [shapes]);

  const toggleExp = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Layers</div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={bringForward} title="Bring forward"><ChevronUp className="size-3.5" /></IconBtn>
          <IconBtn onClick={sendBackward} title="Send backward"><ChevronDown className="size-3.5" /></IconBtn>
          <IconBtn onClick={duplicate} title="Duplicate"><Copy className="size-3.5" /></IconBtn>
          <IconBtn onClick={deleteSelected} title="Delete"><Trash2 className="size-3.5" /></IconBtn>
        </div>
      </div>
      {activeGroupId && (
        <button
          onClick={() => setActiveGroupId(null)}
          className="mx-2 mt-2 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-widest text-foreground hover:bg-primary/20"
        >
          ← Exit group
        </button>
      )}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
        {rows.map((row) => {
          if (row.kind === "shape") {
            const s = row.shapes[0];
            const Icon = iconFor(s);
            const sel = selectedIds.includes(s.id);
            return (
              <ShapeRow
                key={s.id}
                indent={0}
                icon={<Icon className="size-3.5 shrink-0 opacity-80" />}
                name={s.name}
                selected={sel}
                visible={s.visible}
                locked={s.locked}
                onSelect={(e) => select(e.shiftKey ? [...selectedIds, s.id] : [s.id])}
                onRename={() => { const n = prompt("Rename layer", s.name); if (n) rename(s.id, n); }}
                onToggleVisible={() => toggleVisible(s.id)}
                onToggleLocked={() => toggleLocked(s.id)}
              />
            );
          }
          // Group row
          const isOpen = expanded[row.id] ?? row.id === activeGroupId;
          const isActive = row.id === activeGroupId;
          const groupSelected = row.shapes.every((m) => selectedIds.includes(m.id));
          return (
            <div key={row.id}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (isActive) {
                    // already inside — clicking selects all members
                    select(row.shapes.map((m) => m.id));
                  } else {
                    select([row.shapes[0].id]); // expansion pulls in groupmates
                  }
                }}
                onDoubleClick={(e) => { e.stopPropagation(); setActiveGroupId(row.id); }}
                className={`group flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5 text-xs transition ${
                  groupSelected || isActive
                    ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                    : "hover:bg-secondary/60 text-muted-foreground"
                }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExp(row.id); }}
                  className="grid size-4 place-items-center text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className={`size-3 transition ${isOpen ? "rotate-90" : ""}`} />
                </button>
                {isOpen
                  ? <FolderOpen className="size-3.5 shrink-0 text-primary" />
                  : <Folder className="size-3.5 shrink-0 opacity-80" />}
                <span className="flex-1 truncate">{row.name}</span>
                {isActive && (
                  <button
                    onClick={(e) => { e.stopPropagation(); ungroupSelected(); }}
                    title="Ungroup"
                    className="rounded px-1 text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    ungroup
                  </button>
                )}
              </div>
              {isOpen && row.shapes.map((m) => {
                const Icon = iconFor(m);
                const sel = selectedIds.includes(m.id);
                return (
                  <ShapeRow
                    key={m.id}
                    indent={1}
                    icon={<Icon className="size-3.5 shrink-0 opacity-80" />}
                    name={m.name}
                    selected={sel}
                    visible={m.visible}
                    locked={m.locked}
                    onSelect={(e) => {
                      // selecting a child enters its group so it can be picked individually
                      if (activeGroupId !== row.id) setActiveGroupId(row.id);
                      select(e.shiftKey ? [...selectedIds, m.id] : [m.id]);
                    }}
                    onRename={() => { const n = prompt("Rename layer", m.name); if (n) rename(m.id, n); }}
                    onToggleVisible={() => toggleVisible(m.id)}
                    onToggleLocked={() => toggleLocked(m.id)}
                  />
                );
              })}
            </div>
          );
        })}
        {!shapes.length && (
          <div className="px-2 py-8 text-center text-[11px] text-muted-foreground">No layers yet — pick a tool and draw.</div>
        )}
      </div>
    </div>
  );
}

function ShapeRow({
  indent, icon, name, selected, visible, locked,
  onSelect, onRename, onToggleVisible, onToggleLocked,
}: {
  indent: number;
  icon: React.ReactNode;
  name: string;
  selected: boolean;
  visible: boolean;
  locked: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onRename: () => void;
  onToggleVisible: () => void;
  onToggleLocked: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onRename}
      style={{ paddingLeft: 8 + indent * 18 }}
      className={`group flex cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-xs transition ${
        selected ? "bg-primary/15 text-foreground ring-1 ring-primary/40" : "hover:bg-secondary/60 text-muted-foreground"
      }`}
    >
      {icon}
      <span className="flex-1 truncate">{name}</span>
      <button onClick={(e) => { e.stopPropagation(); onToggleLocked(); }} className="opacity-0 group-hover:opacity-100 hover:text-foreground">
        {locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
      </button>
      <button onClick={(e) => { e.stopPropagation(); onToggleVisible(); }} className="hover:text-foreground">
        {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
      </button>
    </div>
  );
}

function IconBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" />
  );
}
