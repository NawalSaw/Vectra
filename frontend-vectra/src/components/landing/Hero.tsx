import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Show } from "@clerk/tanstack-react-start";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-32 pt-40 md:pt-48">
      <div className="grid-bg absolute inset-0 -z-10" />

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-24 top-32 -z-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 25, 0], x: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-24 top-48 -z-10 h-80 w-80 rounded-full bg-accent/30 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Now with real-time vector tracing
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
        >
          The studio where{" "}
          <span className="text-gradient animate-gradient">pixels become vectors</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl"
        >
          Generate stunning AI imagery, vectorize anything to crisp SVG, and edit with a
          Figma-grade canvas — all in one premium workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Show when={"signed-in"}>
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow-strong hover:opacity-95">
                Start creating <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Show>
          
          <Show when={"signed-out"}>
            <Link to="/login">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow-strong hover:opacity-95">
                Start creating <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Show>
          
          <Button size="lg" variant="outline" className="glass">
            <Play className="h-4 w-4" /> Watch demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="glass-strong relative overflow-hidden rounded-3xl border border-border p-2 shadow-elevated">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-destructive/70" />
              <span className="h-3 w-3 rounded-full bg-amber-400/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">vectra.studio / project / nebula-mark</span>
            </div>
            <HeroCanvas />
          </div>

          {/* Glow underneath */}
          <div className="absolute inset-x-10 -bottom-10 -z-10 h-40 rounded-full bg-gradient-primary opacity-50 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}

function HeroCanvas() {
  return (
    <div className="grid h-[440px] grid-cols-12 gap-2 rounded-2xl bg-background/40 p-3">
      {/* Left tools */}
      <div className="col-span-1 flex flex-col items-center gap-2 rounded-xl bg-surface/60 py-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`h-8 w-8 rounded-lg ${i === 2 ? "bg-gradient-primary shadow-glow" : "bg-secondary/60"}`}
          />
        ))}
      </div>

      {/* Canvas */}
      <div className="relative col-span-8 overflow-hidden rounded-xl bg-surface-2/40">
        <svg viewBox="0 0 500 400" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0" stopColor="oklch(0.78 0.18 200)" />
              <stop offset="1" stopColor="oklch(0.7 0.22 330)" />
            </linearGradient>
            <radialGradient id="g2">
              <stop offset="0" stopColor="oklch(0.78 0.18 200 / 0.8)" />
              <stop offset="1" stopColor="oklch(0.78 0.18 200 / 0)" />
            </radialGradient>
          </defs>
          <circle cx="250" cy="200" r="160" fill="url(#g2)" />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            d="M120 280 C 160 120, 340 120, 380 280 S 500 380, 250 360 S 80 320, 120 280 Z"
            stroke="url(#g1)"
            strokeWidth="2.5"
            fill="oklch(0.78 0.18 200 / 0.08)"
          />
          {[
            [120, 280], [380, 280], [250, 130], [250, 360],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 5} y={y - 5} width="10" height="10" fill="oklch(0.78 0.18 200)" stroke="white" strokeWidth="1.5" />
            </g>
          ))}
          <text x="250" y="210" textAnchor="middle" fontFamily="Space Grotesk" fontSize="40" fontWeight="700" fill="url(#g1)">
            VECTRA
          </text>
        </svg>

        {/* floating prompt chip */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="glass-strong absolute bottom-4 left-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono">a nebula logo, neon, vector</span>
        </motion.div>
      </div>

      {/* Right properties */}
      <div className="col-span-3 flex flex-col gap-2 rounded-xl bg-surface/60 p-3">
        <div className="text-xs font-semibold text-muted-foreground">Properties</div>
        {["Fill", "Stroke", "Path", "Effects"].map((label, i) => (
          <div key={label} className="rounded-lg bg-secondary/40 p-2">
            <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{label}</span><span>{i === 0 ? "Gradient" : "—"}</span>
            </div>
            <div className={`h-2 rounded-full ${i === 0 ? "bg-gradient-primary" : "bg-secondary"}`} />
          </div>
        ))}
        <div className="mt-auto rounded-lg bg-gradient-soft p-2 text-[10px] text-muted-foreground">
          AI ready · 12 layers
        </div>
      </div>
    </div>
  );
}
