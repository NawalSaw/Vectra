import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Layers,
  Settings2,
  Download,
  Heart,
  Copy,
  Shuffle,
  Loader2,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  History,
  Cpu,
  Zap,
  Crown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { authStateFn } from "@/integrations/authStateFn";
import { makePayload, useImageGenerationAPI } from "@/hooks/use-image-generation";
import { useUser } from "@clerk/tanstack-react-start";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";
import { useUserStore } from "@/lib/user-store";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "AI Studio — Generate Images | Vectra" },
      { name: "description", content: "Generate stunning AI images with advanced controls, style presets, and a real-time queue." },
      { property: "og:title", content: "Vectra AI Studio" },
      { property: "og:description", content: "Generate stunning AI images with Vectra." },
    ],
  }),
  component: GeneratePage,
  beforeLoad: async () => await authStateFn(),
  loader: async ({ context }) => {
    return { userId: context.userId }
  },
});

const MODELS = [
  { id: "flux", name: "Flux", tag: "Fast & Quality Inference", icon: Zap, desc: "Pro quality, quick drafts, 2s/image" },
  { id: "lightning", name: "Lightning", tag: "Balanced", icon: Cpu, desc: "Pro quality, fast" },
  { id: "sdxl", name: "SDXL", tag: "Premium", icon: Crown, desc: "Max fidelity & detail" },
];

const STYLES = [
  "Photorealistic", "Cinematic", "Anime", "3D Render", "Watercolor",
  "Vector Art", "Cyberpunk", "Minimal", "Oil Painting", "Pixel Art", "Isometric", "Neon",
];

const ASPECTS = [
  { id: "1:1", label: "Square", icon: Square, w: 1, h: 1 },
  { id: "16:9", label: "Landscape", icon: RectangleHorizontal, w: 16, h: 9 },
  { id: "9:16", label: "Portrait", icon: RectangleVertical, w: 9, h: 16 },
  { id: "4:3", label: "Classic", icon: RectangleHorizontal, w: 4, h: 3 },
];

const SUGGESTIONS = [
  "A holographic jellyfish drifting through a neon Tokyo alley, cinematic, volumetric light",
  "Isometric tiny floating island with crystal waterfalls, pastel sky, 3D render",
  "Portrait of an astronaut covered in bioluminescent moss, dramatic studio lighting",
  "Minimal vector logo of a fox made from a single continuous gradient line",
];

const GENERATED_IMAGES_LIMIT = 15;

type Job = {
  id: string;
  prompt: string;
  style: string;
  model: string;
  aspect: string;
  seed: number;
  status: "queued" | "running" | "done";
  progress: number;
  hue: number;
  imageUrl?: string;
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function GeneratePage() {
  const [prompt, setPrompt] = useState(SUGGESTIONS[0]);
  const [negative, setNegative] = useState("");
  const [model, setModel] = useState(MODELS[1].id);
  const [style, setStyle] = useState(STYLES[1]);
  const [aspect, setAspect] = useState(ASPECTS[0].id);
  const [steps, setSteps] = useState([15]);
  const [guidance, setGuidance] = useState([3.5]);
  const [variations, setVariations] = useState([4]);
  const [seed, setSeed] = useState(48217);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [strength, setStrength] = useState([0.5]);
  const [imageB64, setImageB64] = useState<string | undefined>(undefined);
  const [loadedImagePage, setLoadedImagePage] = useState(1);
  const [hasNextImages, setHasNextImages] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const currentUser = useUserStore((state) => state.user);
  const updateCredits = useUserStore((state) => state.updateCredits);

  const api = useImageGenerationAPI();

  const aspectMeta = useMemo(() => ASPECTS.find((a) => a.id === aspect)!, [aspect]);
  const isFluxModel = model === "flux";

  useEffect(() => {
    if (model !== "flux") return;

    setNegative("");
    setImageB64(undefined);

    setGuidance([7.5]);
    setStrength([1.0]);

    setSteps([2]);
  }, [model]);

  async function loadImages(page: number, append = false) {
    if (!currentUser || isLoadingImages) return;

      try {
        setIsLoadingImages(true);
        const params = new URLSearchParams({
          clerk_user_id: currentUser?.clerk_user_id || "",

          page: page.toString(),
          limit: GENERATED_IMAGES_LIMIT.toString(),

          sort_by: "created_at",
          sort_order: "desc",
        });

        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.GET_GENERATED_IMAGES}?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch images"
          );
        }

        const result = await response.json();

        const loadedJobs: Job[] =
          result.data.map((img: any) => ({
            id: img.id,
            prompt: img.prompt,
            style: img.style ?? "",
            model: img.model,
            aspect:
              img.aspect ?? "1:1",
            seed: img.seed ?? 0,
            status: "done",
            progress: 1,
            imageUrl:
              img.cloudinary_url,
            hue: Math.floor(
              Math.random() * 360
            ),
          }));

        setJobs((prev) => {
          if (!append) return loadedJobs;

          const existingIds = new Set(prev.map((job) => job.id));
          const nextJobs = loadedJobs.filter((job) => !existingIds.has(job.id));

          return [...prev, ...nextJobs];
        });
        setLoadedImagePage(page);
        setHasNextImages(Boolean(result.pagination?.has_next));
      } catch (err) {
        console.error(
          "Failed to load images:",
          err
        );
      } finally {
        setIsLoadingImages(false);
      }
    }

  useEffect(() => {
    if (!currentUser) return;

    setLoadedImagePage(1);
    setHasNextImages(false);
    loadImages(1);
  }, [currentUser]);

  const loadNextImages = () => {
    loadImages(loadedImagePage + 1, true);
  };

  async function generate() {
    setError(null);
    const count = variations[0];
    const enhancedPrompt = `${prompt} in the style of ${style}`;
    
    const newJobs: Job[] = Array.from({ length: count }).map((_, i) => ({
      id: makeId(),
      prompt: enhancedPrompt,
      style,
      model,
      aspect,
      seed,
      status: "running",
      progress: 0,
      hue: Math.floor(Math.random() * 360),
    }));
    setJobs((prev) => [...newJobs, ...prev]);

    // Generate images using the API
    for (let i = 0; i < count; i++) {
      const job = newJobs[i];
      try {
        const payload = makePayload({
          prompt: enhancedPrompt,
          model: model as 'flux' | 'lightning' | 'sdxl',
          negative_prompt: negative || undefined,
          width: aspectMeta.w * 512,
          height: aspectMeta.h * 512,
          num_steps: steps[0],
          guidance: guidance[0],
          strength: strength[0] ,
          seed,
          image_b64: imageB64,
          steps: steps[0],
          clerk_user_id: currentUser?.clerk_user_id
        });

        console.log(payload);
        const result = await api.generateImage(payload);

        if (result.success && result.data) {
          const imageUrl = result.data.cloudinary_url;

          setJobs((prev) =>
            prev.map((x) =>
              x.id === job.id
                ? {
                    ...x,
                    status: "done",
                    progress: 1,
                    imageUrl: imageUrl,
                  }
                : x
            )
          );

          updateCredits((currentUser?.current_credit ?? 0) - 10 * variations[0]);
        } else {
          const errorMsg = result.error || 'Generation failed';
          setError(errorMsg);
          setJobs((prev) =>
            prev.map((x) =>
              x.id === job.id ? { ...x, status: "done", progress: 1 } : x
            )
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Generation failed';
        setError(errorMessage);
        console.error('Generation failed:', err);
        setJobs((prev) =>
          prev.map((x) =>
            x.id === job.id ? { ...x, status: "done", progress: 1 } : x
          )
        );
      }
    }
  }

  async function handleImageUpload(file: File) {
  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;

      // remove data:image/...;base64,
      const base64 = result.split(",")[1];

      setImageB64(base64);
      resolve();
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}
  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative min-h-screen mt-12">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 grid-bg opacity-40" />

        {/* Workspace */}
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-[360px_1fr_320px]">
          {/* LEFT: Prompt + controls */}
          <aside className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Wand2 className="h-4 w-4 text-primary" /> Prompt
                </h3>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setPrompt(SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)])}>
                  <Shuffle className="h-3 w-3" /> Inspire me
                </Button>
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create…"
                className="min-h-[120px] resize-none border-border/60 bg-background/40 text-sm"
              />
              <div className="mt-3">
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Negative prompt</label>
                <Textarea
                  value={negative}
                  onChange={(e) => setNegative(e.target.value)}
                  placeholder={
                    isFluxModel
                      ? "Negative prompt is not supported for Flux"
                      : "blurry, low quality, watermark…"
                  }
                  disabled={isFluxModel}
                  className="min-h-[60px] resize-none border-border/60 bg-background/40 text-xs"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="truncate rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    style={{ maxWidth: 220 }}
                    title={s}
                  >
                    {s.slice(0, 32)}…
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Cpu className="h-4 w-4 text-primary" /> Model
              </h3>
              <div className="space-y-2">
                {MODELS.map((m) => {
                  const Icon = m.icon;
                  const active = model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-primary/50 bg-gradient-soft shadow-glow"
                          : "border-border/60 hover:border-border"
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-gradient-primary text-primary-foreground" : "bg-secondary/60"}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{m.name}</span>
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{m.tag}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition ${active ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Settings2 className="h-4 w-4 text-primary" /> Advanced
              </h3>
              <div className="space-y-4">
                <SliderRow label="Steps" value={steps[0]} onChange={(v) => setSteps([v])} min={1} max={20} />
               <SliderRow
                  label="Guidance"
                  value={guidance[0]}
                  onChange={(v) => setGuidance([v])}
                  min={1}
                  max={20}
                  step={0.5}
                  disabled={isFluxModel}
                />
                <SliderRow label="Variations" value={variations[0]} onChange={(v) => setVariations([v])} min={1} max={8} />
                <SliderRow
                    label="Strength"
                    value={strength[0]}
                    onChange={(v) => setStrength([v])}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={isFluxModel}
                  />
                  <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-muted-foreground">Seed</label>
                  <div className="flex items-center gap-1">
                    <input
                      value={seed}
                      disabled={isFluxModel}
                      onChange={(e) => setSeed(Number(e.target.value) || 0)}
                      className="w-24 rounded-md border border-border/60 bg-background/40 px-2 py-1 text-right font-mono text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isFluxModel}
                      className="h-7 w-7"
                      onClick={() => setSeed(Math.floor(Math.random() * 999999))}
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER: Canvas */}
          <section className="space-y-4">
            <div className="glass rounded-2xl p-3">
              <Tabs defaultValue="style">
                <div className="flex items-center justify-between gap-2">
                  <TabsList className="bg-secondary/40">
                    <TabsTrigger value="style">Style</TabsTrigger>
                    <TabsTrigger value="aspect">Aspect</TabsTrigger>
                    <TabsTrigger value="reference">Reference</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                      {jobs.filter((j) => j.status === "running").length} running
                    </Badge>
                    <Button onClick={generate} disabled={api.isGenerating} className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
                      <Sparkles className="h-4 w-4" /> {api.isGenerating ? 'Generating...' : 'Generate'} ({10 * variations[0]})
                    </Button>
                  </div>
                </div>

                <TabsContent value="style" className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {STYLES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          style === s
                            ? "border-primary/60 bg-gradient-soft text-foreground shadow-glow"
                            : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="aspect" className="mt-3">
                  <div className="grid grid-cols-4 gap-2">
                    {ASPECTS.map((a) => {
                      const Icon = a.icon;
                      const active = aspect === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setAspect(a.id)}
                          className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition ${
                            active ? "border-primary/60 bg-gradient-soft shadow-glow" : "border-border/60 hover:border-border"
                          }`}
                        >
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs font-medium">{a.id}</span>
                          <span className="text-[10px] text-muted-foreground">{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>
           <TabsContent value="reference" className="mt-3">
            <label
              className={`flex h-28 flex-col items-center justify-center rounded-xl border border-dashed bg-background/30 text-xs text-muted-foreground transition ${
                isFluxModel
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:border-primary/50"
              }`}
            >
            <span>
  {isFluxModel
    ? "Reference images are not supported for Flux"
    : imageB64
    ? "Reference image selected"
    : "Upload reference image"}
</span>

            <input
              type="file"
              accept="image/*"
              disabled={isFluxModel}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                await handleImageUpload(file);
              }}
            />
                </label>
              </TabsContent>
              </Tabs>
            </div>

            {/* Results grid */}
            <div className="glass rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ImageIcon className="h-4 w-4 text-primary" /> Results
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{jobs.length} items</span>
                  {hasNextImages && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={loadNextImages}
                      disabled={isLoadingImages}
                    >
                      {isLoadingImages ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      {isLoadingImages ? "Loading" : "Next images"}
                    </Button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <p className="font-semibold">Error:</p>
                  <p className="mt-1">{error}</p>
                </div>
              )}
              {jobs.length === 0 && (
                <div className="mb-3 rounded-lg border border-border/50 bg-background/30 p-3 text-xs text-muted-foreground">
                  <p className="font-semibold">No results yet</p>
                  <p className="mt-1">Generate some images to see them here.</p>
                </div>
              )}
              <div
                className="grid gap-3 overflow-scroll max-h-[calc(100vh-200px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
              >
                <AnimatePresence initial={false}>
                  {jobs.map((j) => (
                    <ResultCard
                      key={j.id}
                      job={j}
                      aspect={aspectMeta}
                      selected={selected === j.id}
                      onSelect={() => setSelected(j.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
              {hasNextImages && jobs.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={loadNextImages}
                    disabled={isLoadingImages}
                  >
                    {isLoadingImages ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {isLoadingImages ? "Loading images" : "Fetch next images"}
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: Queue / history / properties */}
          <aside className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Layers className="h-4 w-4 text-primary" /> Queue
              </h3>
              <ScrollArea className="h-[220px] pr-2">
                <div className="space-y-2">
                  {jobs.slice(0, 10).map((j) => (
                    <div key={j.id} className="rounded-lg border border-border/60 bg-background/30 p-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-muted-foreground">#{j.id}</span>
                        <Badge
                          variant="outline"
                          className={`h-4 px-1.5 text-[10px] ${
                            j.status === "done"
                              ? "border-primary/40 text-primary"
                              : "border-accent/40 text-accent"
                          }`}
                        >
                          {j.status}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-foreground/80">{j.prompt}</p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary/60">
                        <div
                          className="h-full bg-gradient-primary transition-all"
                          style={{ width: `${j.progress * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground">
                      No items in queue yet.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4 text-primary" /> Recent prompts
              </h3>
              <ul className="space-y-2 text-xs">
                {SUGGESTIONS.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setPrompt(s)}
                      className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    >
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      <span className="line-clamp-2">{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground/90">{value}</span>
      </div>

      <Slider
        value={[value]}
        disabled={disabled}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function ResultCard({
  job,
  aspect,
  selected,
  onSelect,
}: {
  job: Job;
  aspect: { w: number; h: number };
  selected: boolean;
  onSelect: () => void;
}) {
  const ratio = `${aspect.w} / ${aspect.h}`;
  const done = job.status === "done";

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!job.imageUrl) return;

    try {
      await navigator.clipboard.writeText(job.imageUrl);

      // optional toast
      console.log("Image URL copied");
    } catch (error) {
      console.error("Failed to copy image URL:", error);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!job.imageUrl) return;

    try {
      const response = await fetch(job.imageUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;

      const extension =
        blob.type.split("/")[1] || "png";

      link.download = `generated-${job.id}.${extension}`;

      document.body.appendChild(link);
      link.click();

      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-xl border text-left transition ${
        selected
          ? "border-primary/70 shadow-glow-strong"
          : "border-border/60 hover:border-border"
      }`}
      style={{ aspectRatio: ratio }}
    >
      {job.imageUrl ? (
        <img
          src={job.imageUrl}
          alt={job.prompt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <ProceduralArt
          hue={job.hue}
          done={done}
          progress={job.progress}
        />
      )}

      {!done && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30 backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />

          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {Math.round(job.progress * 100)}%
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-background/90 via-background/40 to-transparent p-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
        <p className="line-clamp-2 text-[11px] text-foreground/90">
          {job.prompt}
        </p>

        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground">
            seed {job.seed}
          </span>

          <div className="pointer-events-auto flex items-center gap-1">
            <IconBtn label="Like">
              <Heart className="h-3 w-3" />
            </IconBtn>

            <IconBtn label="Copy" onClick={handleCopy}>
              <Copy className="h-3 w-3" />
            </IconBtn>

            <IconBtn label="Download" onClick={handleDownload}>
              <Download className="h-3 w-3" />
            </IconBtn>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-md bg-background/70 backdrop-blur transition hover:bg-background"
    >
      {children}
    </button>
  );
}

function ProceduralArt({ hue, done, progress }: { hue: number; done: boolean; progress: number }) {
  const h2 = (hue + 80) % 360;
  const opacity = done ? 1 : 0.35 + progress * 0.5;
  return (
    <div className="absolute inset-0" style={{ opacity }}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 100% at 20% 10%, hsl(${hue} 90% 60% / 0.85), transparent 60%),
                       radial-gradient(120% 100% at 80% 90%, hsl(${h2} 95% 55% / 0.8), transparent 55%),
                       linear-gradient(135deg, hsl(${hue} 60% 12%), hsl(${h2} 60% 18%))`,
        }}
      />
      <svg className="absolute inset-0 h-full w-full mix-blend-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id={`n-${hue}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.25 0" />
          </filter>
        </defs>
        <rect width="100" height="100" filter={`url(#n-${hue})`} opacity="0.35" />
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from ${hue}deg at 50% 50%, transparent 0deg, hsl(${hue} 100% 70% / 0.18) 90deg, transparent 180deg)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
