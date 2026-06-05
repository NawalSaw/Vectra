import { useEditor, type BlendMode, type Shape, type RectShape, type TextShape } from "@/lib/editor-store";
import { Slider } from "@/components/ui/slider";
import { Pipette, Palette, Square as SquareIcon } from "lucide-react";

const BLENDS: BlendMode[] = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "difference"];

export function PropertiesPanel() {
  const { shapes, selectedIds, updateShape, canvasW, canvasH, bg, setBg, defs, appendDef } = useEditor();
  const sel = shapes.filter((s) => selectedIds.includes(s.id));
  const one = sel.length === 1 ? sel[0] : null;

  if (!sel.length) {
    return (
      <div className="flex h-full flex-col">
        <Header label="Document" />
        <div className="space-y-4 p-3">
          <Field label="Width"><ReadOnly value={`${canvasW} px`} /></Field>
          <Field label="Height"><ReadOnly value={`${canvasH} px`} /></Field>
          <Field label="Background"><ColorInput value={bg} onChange={setBg} /></Field>
          <div className="rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">
            Tip: Hold ⇧ for multi-select. Double-click a path to enter node-edit. Press P for the pen tool, then Enter to finish.
          </div>
        </div>
      </div>
    );
  }

  const update = (patch: Partial<Shape>) => sel.forEach((s) => updateShape(s.id, patch));
  const get = <K extends keyof Shape>(k: K): Shape[K] | "" => (one ? one[k] : "" as Shape[K] | "");

  const setLinearGradient = (target: "fill" | "stroke") => {
    const id = "grad-" + Math.random().toString(36).slice(2, 8);
    const xml = `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="oklch(0.78 0.18 195)"/><stop offset="100%" stop-color="oklch(0.65 0.25 320)"/></linearGradient>`;
    appendDef(xml);
    update({ [target]: `url(#${id})` } as Partial<Shape>);
  };
  const setRadialGradient = (target: "fill" | "stroke") => {
    const id = "grad-" + Math.random().toString(36).slice(2, 8);
    const xml = `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.6"><stop offset="0%" stop-color="oklch(0.78 0.18 195)"/><stop offset="100%" stop-color="oklch(0.18 0.02 270)"/></radialGradient>`;
    appendDef(xml);
    update({ [target]: `url(#${id})` } as Partial<Shape>);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Header label={one ? one.name : `${sel.length} selected`} />
      <Section title="Transform">
        <div className="grid grid-cols-2 gap-2">
          <Num label="X" value={one?.x ?? 0} onChange={(v) => update({ x: v })} />
          <Num label="Y" value={one?.y ?? 0} onChange={(v) => update({ y: v })} />
          <Num label="W" value={one?.w ?? 0} onChange={(v) => update({ w: v })} />
          <Num label="H" value={one?.h ?? 0} onChange={(v) => update({ h: v })} />
          <Num label="Rotate" value={one?.rotation ?? 0} onChange={(v) => update({ rotation: v })} />
          {one?.type === "rect" && (
            <Num label="Radius" value={(one as RectShape).radius} onChange={(v) => update({ radius: v } as Partial<RectShape>)} />
          )}
        </div>
      </Section>

      <Section title="Appearance">
        <Field label="Fill">
          <FillEditor
            value={String(get("fill"))}
            defs={defs}
            onChange={(v) => update({ fill: v })}
            onLinear={() => setLinearGradient("fill")}
            onRadial={() => setRadialGradient("fill")}
            onUpdateGradStop={(stops) => updateGradientStops(defs, String(get("fill")), stops, appendDef, (newDefs) => useEditor.setState({ defs: newDefs }))}
          />
        </Field>
        <Field label="Stroke">
          <FillEditor
            value={String(get("stroke"))}
            defs={defs}
            onChange={(v) => update({ stroke: v })}
            onLinear={() => setLinearGradient("stroke")}
            onRadial={() => setRadialGradient("stroke")}
            onUpdateGradStop={(stops) => updateGradientStops(defs, String(get("stroke")), stops, appendDef, (newDefs) => useEditor.setState({ defs: newDefs }))}
          />
        </Field>
        <Field label="Stroke W"><Num value={one?.strokeWidth ?? 0} onChange={(v) => update({ strokeWidth: v })} /></Field>
        <Field label={`Opacity ${Math.round((one?.opacity ?? 1) * 100)}%`}>
          <Slider value={[(one?.opacity ?? 1) * 100]} max={100} step={1} onValueChange={(v) => update({ opacity: v[0] / 100 })} />
        </Field>
        <Field label="Blend">
          <select
            value={one?.blend ?? "normal"}
            onChange={(e) => update({ blend: e.target.value as BlendMode })}
            className="w-full rounded-md border border-border bg-input/40 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {BLENDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
      </Section>

      {one?.type === "text" && (
        <Section title="Typography">
          <Field label="Text">
            <textarea
              value={(one as TextShape).text}
              onChange={(e) => update({ text: e.target.value } as Partial<TextShape>)}
              rows={2}
              className="w-full resize-none rounded-md border border-border bg-input/40 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Num label="Size" value={(one as TextShape).fontSize} onChange={(v) => update({ fontSize: v } as Partial<TextShape>)} />
            <Num label="Weight" value={(one as TextShape).fontWeight} onChange={(v) => update({ fontWeight: v } as Partial<TextShape>)} />
          </div>
        </Section>
      )}
    </div>
  );
}

function Header({ label }: { label: string }) {
  return (
    <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {label}
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-b border-border p-3">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
function Num({ label, value, onChange }: { label?: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      {label && <div className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>}
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-input/40 px-2 py-1 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </label>
  );
}
function ReadOnly({ value }: { value: string }) {
  return <div className="rounded-md border border-border bg-input/30 px-2 py-1 text-xs text-muted-foreground">{value}</div>;
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const eyedropper = async () => {
    try {
      // @ts-expect-error EyeDropper not in standard TS lib yet
      const ed = new window.EyeDropper();
      const res = await ed.open();
      onChange(res.sRGBHex);
    } catch {
      /* user cancelled or unsupported */
    }
  };
  const supported = typeof window !== "undefined" && "EyeDropper" in window;
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-input/40 px-1.5 py-1">
      <div className="size-5 rounded border border-border" style={{ background: value || "transparent" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-xs outline-none"
        spellCheck={false}
      />
      {supported && (
        <button
          onClick={eyedropper}
          title="Pick color from screen"
          className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Pipette className="size-3.5" />
        </button>
      )}
    </div>
  );
}

interface FillEditorProps {
  value: string;
  defs: string;
  onChange: (v: string) => void;
  onLinear: () => void;
  onRadial: () => void;
  onUpdateGradStop: (stops: { offset: number; color: string }[]) => void;
}
function FillEditor({ value, defs, onChange, onLinear, onRadial, onUpdateGradStop }: FillEditorProps) {
  const isGrad = value.startsWith("url(");
  const stops = isGrad ? extractGradientStops(defs, value) : [];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange("oklch(0.78 0.18 195)")}
          title="Solid"
          className={`grid size-6 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground ${!isGrad ? "bg-secondary text-foreground" : ""}`}
        >
          <SquareIcon className="size-3.5" />
        </button>
        <button
          onClick={onLinear}
          title="Linear gradient"
          className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Palette className="size-3.5" />
        </button>
        <button
          onClick={onRadial}
          title="Radial gradient"
          className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <span className="block size-3 rounded-full bg-gradient-radial from-foreground to-transparent" />
        </button>
      </div>
      {!isGrad && <ColorInput value={value} onChange={onChange} />}
      {isGrad && (
        <div className="space-y-1.5 rounded-md border border-border bg-input/30 p-2">
          <div className="h-4 rounded" style={{ background: cssGradientPreview(stops) }} />
          {stops.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-10 text-[10px] tabular-nums text-muted-foreground">{Math.round(s.offset * 100)}%</span>
              <ColorInput
                value={s.color}
                onChange={(c) => {
                  const next = stops.map((x, j) => (j === i ? { ...x, color: c } : x));
                  onUpdateGradStop(next);
                }}
              />
            </div>
          ))}
          <button
            onClick={() => onChange("oklch(0.78 0.18 195)")}
            className="w-full rounded-md border border-border bg-input/40 px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Convert to solid
          </button>
        </div>
      )}
    </div>
  );
}

function extractGradientStops(defs: string, value: string): { offset: number; color: string }[] {
  const m = value.match(/url\(#([^)]+)\)/);
  if (!m) return [];
  const id = m[1];
  // crude regex parse of <linearGradient|radialGradient id="X">...</...>
  const re = new RegExp(`<(linearGradient|radialGradient)\\s[^>]*id="${id}"[^>]*>([\\s\\S]*?)</\\1>`);
  const found = defs.match(re);
  if (!found) return [];
  const inner = found[2];
  const stops: { offset: number; color: string }[] = [];
  const stopRe = /<stop[^>]*\boffset="([^"]+)"[^>]*\bstop-color="([^"]+)"[^>]*\/?>/g;
  const stopRe2 = /<stop[^>]*\bstop-color="([^"]+)"[^>]*\boffset="([^"]+)"[^>]*\/?>/g;
  let sm: RegExpExecArray | null;
  while ((sm = stopRe.exec(inner))) {
    stops.push({ offset: parseOffset(sm[1]), color: sm[2] });
  }
  if (!stops.length) {
    while ((sm = stopRe2.exec(inner))) {
      stops.push({ offset: parseOffset(sm[2]), color: sm[1] });
    }
  }
  return stops;
}

function parseOffset(s: string): number {
  if (s.endsWith("%")) return parseFloat(s) / 100;
  return parseFloat(s);
}

function cssGradientPreview(stops: { offset: number; color: string }[]): string {
  if (!stops.length) return "transparent";
  return `linear-gradient(90deg, ${stops.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ")})`;
}

function updateGradientStops(
  defs: string,
  value: string,
  stops: { offset: number; color: string }[],
  _appendDef: (xml: string) => void,
  setDefs: (defs: string) => void,
) {
  const m = value.match(/url\(#([^)]+)\)/);
  if (!m) return;
  const id = m[1];
  const re = new RegExp(`(<(linearGradient|radialGradient)\\s[^>]*id="${id}"[^>]*>)([\\s\\S]*?)(</\\2>)`);
  const found = defs.match(re);
  if (!found) return;
  const newStops = stops.map((s) => `<stop offset="${Math.round(s.offset * 100)}%" stop-color="${s.color}"/>`).join("");
  const replaced = defs.replace(re, `$1${newStops}$4`);
  setDefs(replaced);
}
