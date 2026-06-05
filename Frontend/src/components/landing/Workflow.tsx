import { motion } from "framer-motion";
import { MessageSquare, Wand2, PenTool, Download } from "lucide-react";
import { SectionHeading } from "./Features";

const steps = [
  { icon: MessageSquare, title: "Prompt", desc: "Describe your idea or drop a reference. Vectra suggests styles, palettes, and refinements." },
  { icon: Wand2, title: "Generate", desc: "Our model streams previews live. Pick variations, upscale, or fork into directions." },
  { icon: PenTool, title: "Vectorize & edit", desc: "Trace to clean SVG paths and shape it in our editor — nodes, gradients, masks, the works." },
  { icon: Download, title: "Export anywhere", desc: "Ship to SVG, PNG, PDF, or paste into Figma. Your assets, your way." },
];

export function Workflow() {
  return (
    <section id="workflow" className="relative py-32">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Workflow"
          title="Idea → artwork in four moves"
          subtitle="A loop tight enough to keep you in flow, deep enough to ship production-ready vectors."
        />

        <div className="relative mt-20">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-soft animate-pulse-glow" />
                  <div className="glass-strong relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 shadow-glow">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary font-mono text-xs font-bold text-primary-foreground shadow-glow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-center font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-center text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
