import { motion } from "framer-motion";
import { SectionHeading } from "./Features";

const quotes = [
  {
    quote: "Vectra collapsed three tools into one. The vector tracing alone earned a permanent spot in my dock.",
    name: "Maya Okafor", role: "Brand Designer, North&Co",
  },
  {
    quote: "Generation that streams into a real editor — finally. I haven't opened Illustrator in two weeks.",
    name: "Liam Park", role: "Independent Illustrator",
  },
  {
    quote: "We standardized our icon system on Vectra. Boolean ops feel native, exports are pristine.",
    name: "Priya Shah", role: "Design Lead, Helio",
  },
  {
    quote: "The command palette and node tools are absurdly fast. It just gets out of my way.",
    name: "Theo Marchetti", role: "Product Designer, Lattice",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading eyebrow="Loved by designers" title="Built for the people who notice the kerning" />

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2">
          {quotes.map((q, i) => (
            <motion.figure
              key={q.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass relative rounded-2xl p-6"
            >
              <blockquote className="text-balance text-base leading-relaxed">
                <span className="text-gradient mr-1 font-display text-3xl leading-none">“</span>
                {q.quote}
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary font-display text-sm font-semibold text-primary-foreground">
                  {q.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
