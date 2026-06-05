import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SectionHeading } from "./Features";

const points = [
  "Pen, pencil, shape, and text tools",
  "Node sculpting with bezier handles",
  "Boolean ops: union, subtract, intersect",
  "Gradients, blurs, masks, blend modes",
  "Layers, groups, symbols, components",
  "Command palette + every shortcut",
];

export function EditorShowcase() {
  return (
    <section id="editor" className="relative py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            eyebrow="Vector editor"
            title="A vector editor that respects your craft"
            subtitle="Built for designers who care where the anchor points land. Familiar muscle memory, modern speed."
            align="left"
          />
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-primary opacity-30 blur-3xl" />
          <div className="glass-strong overflow-hidden rounded-3xl border border-border shadow-elevated">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">monogram.svg</span>
            </div>

            <div className="relative aspect-[4/3] bg-surface-2/60">
              <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="ge" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="oklch(0.78 0.18 200)" />
                    <stop offset="1" stopColor="oklch(0.7 0.22 330)" />
                  </linearGradient>
                </defs>

                {/* dotted grid */}
                <g opacity="0.18">
                  {Array.from({ length: 13 }).map((_, c) =>
                    Array.from({ length: 10 }).map((_, r) => (
                      <circle key={`${c}-${r}`} cx={c * 32 + 16} cy={r * 32 + 14} r="1" fill="currentColor" />
                    ))
                  )}
                </g>

                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  d="M80 220 L80 80 L160 200 L160 80 M220 80 L300 80 Q340 80 340 130 Q340 180 300 180 L220 180 L340 220"
                  stroke="url(#ge)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* anchor points */}
                {[
                  [80, 220], [80, 80], [160, 200], [160, 80],
                  [220, 80], [300, 80], [340, 130], [300, 180], [220, 180], [340, 220],
                ].map(([x, y], i) => (
                  <g key={i}>
                    <rect x={x - 4} y={y - 4} width="8" height="8" fill="oklch(0.16 0.02 270)" stroke="oklch(0.78 0.18 200)" strokeWidth="1.5" />
                  </g>
                ))}

                {/* selection box */}
                <rect x="64" y="64" width="292" height="172" stroke="oklch(0.78 0.18 200)" strokeDasharray="4 4" fill="none" strokeWidth="1" opacity="0.7" />
              </svg>

              {/* Floating layer panel */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="glass-strong absolute right-3 top-3 w-44 rounded-xl p-2"
              >
                <div className="mb-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Layers</div>
                {["Monogram", "Backdrop", "Grid"].map((l, i) => (
                  <div key={l} className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs ${i === 0 ? "bg-primary/15 text-foreground" : "text-muted-foreground"}`}>
                    <span>{l}</span>
                    <span className="font-mono text-[10px]">{i === 0 ? "●" : "○"}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
