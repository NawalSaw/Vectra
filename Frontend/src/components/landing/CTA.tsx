import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <section className="relative px-4 py-32">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-elevated md:p-16">
        <div className="absolute inset-0 -z-10 bg-gradient-soft opacity-80" />
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-40 -z-10 bg-[conic-gradient(from_0deg,transparent,oklch(0.78_0.18_200/0.2),transparent_30%)]"
        />

        <h2 className="font-display text-3xl font-bold leading-tight md:text-5xl">
          Your next great mark <span className="text-gradient">starts here</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground md:text-lg">
          Join thousands of designers using Vectra to generate, vectorize, and ship work they're proud of.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/generate">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow-strong hover:opacity-95">
              Start free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
