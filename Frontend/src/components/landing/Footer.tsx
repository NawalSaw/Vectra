import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";

const groups = [
  { title: "Product", links: ["Features", "Editor", "AI Models", "Templates", "Changelog"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Resources", links: ["Docs", "Tutorials", "Community", "Status"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background/40 px-4 pb-10 pt-20 backdrop-blur">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2 font-display text-base font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </span>
              Vectra
            </a>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The studio where pixels become vectors. Generate, vectorize, and edit in one place.
            </p>
            <div className="mt-5 flex gap-2">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.title}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{g.title}</div>
              <ul className="space-y-2">
                {g.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} Vectra Studio. All rights reserved.</span>
          <span className="font-mono">crafted with care · v1.0</span>
        </div>
      </div>
    </footer>
  );
}
