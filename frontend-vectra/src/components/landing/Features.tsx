import { motion } from "framer-motion";
import {
  Wand2, Layers, MousePointer2, Palette, Zap, Shapes, GitBranch, Lock,
} from "lucide-react";

const features = [
  { icon: Wand2, title: "AI image generation", desc: "Prompt, refine, and iterate with state-of-the-art models tuned for design." },
  { icon: Shapes, title: "Pixel → vector", desc: "Trace any image into clean SVG paths with control over color and detail." },
  { icon: Layers, title: "Infinite canvas", desc: "Multi-layer editing with smart guides, snapping, and a tactile minimap." },
  { icon: MousePointer2, title: "Pen & node editing", desc: "Bezier curves, node sculpting, boolean ops — like Illustrator, only faster." },
  { icon: Palette, title: "Design tokens", desc: "Bring your palette, gradients, and type. Apply across every artboard." },
  { icon: Zap, title: "Realtime preview", desc: "See SVG output stream as you generate. Tweak parameters live." },
  { icon: GitBranch, title: "Version history", desc: "Time-travel through every change. Branch, compare, and restore." },
  { icon: Lock, title: "Yours, forever", desc: "Export to SVG, PNG, PDF. No lock-in, no watermarks." },
];

export function Features() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Features"
          title="Every tool a designer keeps reaching for"
          subtitle="Vectra blends generative AI with a serious vector editor — so the loop from idea to artwork is one place."
        />

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-soft text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-display text-base font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>

              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow, title, subtitle, align = "center",
}: { eyebrow?: string; title: string; subtitle?: string; align?: "center" | "left" }) {
  const a = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${a}`}>
      {eyebrow && (
        <div className={`mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground`}>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {eyebrow}
        </div>
      )}
      <h2 className="font-display text-3xl font-bold leading-tight md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-balance text-muted-foreground md:text-lg">{subtitle}</p>}
    </div>
  );
}
