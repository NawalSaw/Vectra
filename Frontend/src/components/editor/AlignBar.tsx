import { useEditor, type AlignMode, type DistributeAxis } from "@/lib/editor-store";
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
  Group, Ungroup, Scissors,
} from "lucide-react";

export function AlignBar() {
  const { align, distribute, groupSelected, ungroupSelected, applyMaskFromTopSelection, selectedIds } = useEditor();
  const has = selectedIds.length > 0;
  const multi = selectedIds.length > 1;
  const tri = selectedIds.length > 2;
  const Btn = ({
    onClick, title, disabled, children,
  }: { onClick: () => void; title: string; disabled?: boolean; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
  const A = (m: AlignMode) => () => align(m);
  const D = (a: DistributeAxis) => () => distribute(a);

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-input/40 px-1 py-0.5">
      <Btn onClick={A("left")} title="Align left" disabled={!has}><AlignStartVertical className="size-3.5" /></Btn>
      <Btn onClick={A("hcenter")} title="Align horizontal center" disabled={!has}><AlignCenterVertical className="size-3.5" /></Btn>
      <Btn onClick={A("right")} title="Align right" disabled={!has}><AlignEndVertical className="size-3.5" /></Btn>
      <div className="mx-1 h-4 w-px bg-border" />
      <Btn onClick={A("top")} title="Align top" disabled={!has}><AlignLeft className="size-3.5 -rotate-90" /></Btn>
      <Btn onClick={A("vcenter")} title="Align vertical center" disabled={!has}><AlignCenter className="size-3.5 -rotate-90" /></Btn>
      <Btn onClick={A("bottom")} title="Align bottom" disabled={!has}><AlignRight className="size-3.5 -rotate-90" /></Btn>
      <div className="mx-1 h-4 w-px bg-border" />
      <Btn onClick={D("h")} title="Distribute horizontally" disabled={!tri}><AlignHorizontalDistributeCenter className="size-3.5" /></Btn>
      <Btn onClick={D("v")} title="Distribute vertically" disabled={!tri}><AlignVerticalDistributeCenter className="size-3.5" /></Btn>
      <div className="mx-1 h-4 w-px bg-border" />
      <Btn onClick={groupSelected} title="Group (⌘G)" disabled={!multi}><Group className="size-3.5" /></Btn>
      <Btn onClick={ungroupSelected} title="Ungroup (⌘⇧G)" disabled={!has}><Ungroup className="size-3.5" /></Btn>
      <Btn onClick={applyMaskFromTopSelection} title="Mask with top selection" disabled={!multi}><Scissors className="size-3.5" /></Btn>
    </div>
  );
}
