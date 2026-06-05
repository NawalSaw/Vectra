import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useConverter } from "@/lib/converter-store";
import { cn } from "@/lib/utils";
import type { ColorMode, SplineMode } from "@/lib/vectorize";
import { Brain, RotateCcw, Sparkles } from "lucide-react";
import { useSVGConversion } from "@/hooks/use-image-generation";
import type { VectorizeOptions } from "@/lib/vectorize";
import { useUser } from "@clerk/tanstack-react-start";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground/80">{label}</span>
        {value !== undefined && (
          <span className="font-mono text-muted-foreground">{value}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-md border border-border bg-input/40 p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2 py-1.5 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ControlsPanel() {
  const o = useConverter((s) => s.options);
  const update = useConverter((s) => s.updateOption);
  const reset = useConverter((s) => s.resetOptions);
  const convertActive = useConverter((s) => s.convertActive);
  const convertAll = useConverter((s) => s.convertAll);
  const isConverting = useConverter((s) => s.isConverting);
  const jobs = useConverter((s) => s.jobs);
  const activeId = useConverter((s) => s.activeId);
  const hasActive = !!activeId;

  const { user: clerkUser } = useUser();

  const convertToSVG = useSVGConversion();

  const apiConvertFn = async (file: File, options: VectorizeOptions) => {
    const result = await convertToSVG.mutateAsync({ 
      file, 
      colormode: options.colormode,
      hierarchical: options.hierarchical,
      mode: options.mode,
      filter_speckle: options.filter_speckle,
      color_precision: options.color_precision,
      layer_difference: options.layer_difference,
      corner_threshold: options.corner_threshold,
      length_threshold: options.length_threshold,
      max_iterations: options.max_iterations,
      splice_threshold: options.splice_threshold,
      path_precision: options.path_precision,
      clerk_user_id: clerkUser?.id || "",
    });
    // Fetch the SVG content from the cloudinary URL
    if (result.success && result.data) {
      const response = await fetch(result.data.cloudinary_url);
      return await response.text();
    }
    throw new Error(result.error || 'Conversion failed');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Vectorization</div>
          <div className="text-[11px] text-muted-foreground">Real-time controls</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-input/40 px-2 py-1">
            <span className="text-[10px] text-muted-foreground flex flex-row items-center gap-2"><Brain size={15}/> Vision Cortex</span>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <Section title="Color">
          <Row label="Color mode">
            <Segmented<ColorMode>
              value={o.colormode}
              onChange={(v) => update("colormode", v)}
              options={[
                { value: "color", label: "Color" },
                { value: "binary", label: "Binary (Black & White)" },
              ]}
            />
          </Row>
          <Row label="Color precision" value={o.color_precision}>
            <Slider
              value={[o.color_precision]}
              min={1}
              max={8}
              step={1}
              onValueChange={(v) => update("color_precision", v[0])}
            />
          </Row>
          <Row label="Layer difference" value={o.layer_difference}>
            <Slider
              value={[o.layer_difference]}
              min={1}
              max={255}
              step={8}
              onValueChange={(v) => update("layer_difference", v[0])}
            />
          </Row>
        </Section>

        <Section title="Geometry">
          <Row label="Spline mode">
            <Segmented<SplineMode>
              value={o.mode}
              onChange={(v) => update("mode", v)}
              options={[
                { value: "spline", label: "Spline" },
                { value: "polygon", label: "Polygon" },
                { value: "none", label: "None" },
              ]}
            />
          </Row>
          <Row label="Hierarchical mode">
          <Segmented<"stacked" | "cutout">
              value={o.hierarchical}
              onChange={(v) => update("hierarchical", v)}
              options={[
                { value: "stacked", label: "Stacked" },
                { value: "cutout", label: "Cutout" },
              ]}
            />
          </Row>
          <Row label="Corner threshold" value={`${o.corner_threshold}°`}>
            <Slider
              value={[o.corner_threshold]}
              min={0}
              max={180}
              step={1}
              onValueChange={(v) => update("corner_threshold", v[0])}
            />
          </Row>
          <Row label="Path optimization" value={o.path_precision}>
            <Slider
              value={[o.path_precision]}
              min={1}
              max={10}
              step={1}
              onValueChange={(v) => update("path_precision", v[0])}
            />
          </Row>
        </Section>

        <Section title="Filtering">
          <Row label="Speckle filter" value={o.filter_speckle}>
            <Slider
              value={[o.filter_speckle]}
              min={0}
              max={1024}
              step={50}
              onValueChange={(v) => update("filter_speckle", v[0])}
            />
          </Row>
          <Row label="Length threshold" value={o.length_threshold.toFixed(1)}>
            <Slider
              value={[o.length_threshold]}
              min={3.5}
              max={10.0}
              step={0.5}
              onValueChange={(v) => update("length_threshold", v[0])}
            />
          </Row>
          <Row label="Max Iterations" value={o.max_iterations}>
            <Slider
              value={[o.max_iterations]}
              min={0}
              max={25}
              step={1}
              onValueChange={(v) => update("max_iterations", v[0])}
            />
          </Row>
          <Row label="Splice Threshold" value={`${o.splice_threshold}°`}>
            <Slider
              value={[o.splice_threshold]}
              min={0}
              max={180}
              step={1}
              onValueChange={(v) => update("splice_threshold", v[0])}
            />
          </Row>
        </Section>
      </div>

      <div className="space-y-2 border-t border-border bg-card/40 p-3">
        <Button
          className="w-full justify-center gap-2"
          onClick={() => convertActive(apiConvertFn)}
          disabled={!hasActive || isConverting || convertToSVG.isPending}
        >
          <Sparkles className="size-4" />
          {isConverting ? 'Vectorizing...' : 'Vectorize'}
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-center"
          onClick={() => convertAll(apiConvertFn)}
          disabled={jobs.length < 2 || isConverting || convertToSVG.isPending}
        >
          Batch convert all ({jobs.length})
        </Button>
      </div>
    </div>
  );
}
