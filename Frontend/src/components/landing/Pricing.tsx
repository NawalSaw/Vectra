import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./Features";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/forever",
    desc: "Everything to try the studio.",
    features: ["50 generations / mo", "Basic vector tracing", "Editor with 3 layers", "PNG & SVG export"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Studio",
    price: "$19",
    period: "/month",
    desc: "For working designers.",
    features: ["Unlimited generations", "Pro vector tracing", "Full editor + history", "All export formats", "Priority queue"],
    cta: "Go Studio",
    highlight: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/seat / mo",
    desc: "Built for design teams.",
    features: ["Everything in Studio", "Shared libraries", "Realtime co-editing", "SSO & audit logs", "Dedicated support"],
    cta: "Talk to sales",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-32">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans, serious value"
          subtitle="Start free. Upgrade when you need more horsepower."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-3xl border p-6 ${
                t.highlight
                  ? "border-primary/40 bg-card shadow-glow-strong"
                  : "border-border bg-card/60"
              } backdrop-blur`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-glow">
                  Most popular
                </div>
              )}

              <h3 className="font-display text-xl font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.period}</span>
              </div>

              <Button
                className={`mt-6 w-full ${t.highlight ? "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90" : ""}`}
                variant={t.highlight ? "default" : "outline"}
              >
                {t.cta}
              </Button>

              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-soft text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
