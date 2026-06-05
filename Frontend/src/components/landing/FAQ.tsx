import { SectionHeading } from "./Features";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  { q: "Do I own the work I generate?", a: "Yes. Everything you create — generations, vectors, edits — is yours. Commercial use is included on every paid plan." },
  { q: "What formats can I export?", a: "SVG, PNG, JPG, PDF, and EPS. Studio and Team plans add layered exports and component libraries." },
  { q: "How accurate is the pixel-to-vector tracing?", a: "We use a multi-pass tracer with controls for color count, smoothing, and corner threshold. For most logos and icons, the output is production-ready." },
  { q: "Is there a free tier?", a: "Yes. Starter is free forever and includes 50 generations a month, basic tracing, and exports — plenty to ship a small project." },
  { q: "Can I use my own AI models?", a: "On Team you can plug in private endpoints. We support OpenAI-compatible image APIs and major open models." },
  { q: "Do you offer team collaboration?", a: "Realtime co-editing is on the Team plan, with shared libraries, SSO, and audit logs." },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-32">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />

        <Accordion type="single" collapsible className="mt-12 space-y-3">
          {items.map((it, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="glass rounded-2xl border-none px-5"
            >
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {it.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
