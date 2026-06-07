import { useUserStore } from "@/lib/user-store";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Coins, Sparkles, Zap } from "lucide-react";

export function Header() {
  let windowObj: Window | undefined;
  try {
    windowObj = window;
  } catch {
    windowObj = undefined;
  }

  const currentPath = windowObj?.location?.pathname;
  const currentUser = useUserStore((state) => state.user);

  return (
    <header className="glass-strong flex h-14 items-center justify-between border-b border-border px-4 fixed inset-x-0 top-0 z-50 mb-4">
      <div className="flex items-center gap-2.5">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="relative grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[oklch(0.78_0.18_195)] to-[oklch(0.65_0.25_320)] shadow-[0_0_24px_-4px_var(--glow)]">
          <Sparkles className="size-4 text-background" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">
            Vectra<span className="text-gradient">.</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            SVG Studio
          </div>
        </div>
      </div>

      <nav className="hidden items-center gap-1 rounded-lg border border-border bg-input/40 p-0.5 md:flex">
        <Link to="/convertSVG" className={`rounded-md px-3 py-1.5 text-xs font-medium ${currentPath === '/convertSVG' ? 'text-foreground bg-secondary' : 'text-muted-foreground transition hover:text-foreground'}`}>Convert</Link>
        <Link to="/editor" className={`rounded-md px-3 py-1.5 text-xs font-medium ${currentPath === '/editor' ? 'text-foreground bg-secondary' : 'text-muted-foreground transition hover:text-foreground'}`}>Editor</Link>
        <Link to="/generate" className={`rounded-md px-3 py-1.5 text-xs font-medium ${currentPath === '/generate' ? 'text-foreground bg-secondary' : 'text-muted-foreground transition hover:text-foreground'}`}>Generate</Link>
        <Link to="/dashboard" className={`rounded-md px-3 py-1.5 text-xs font-medium ${currentPath === '/dashboard' ? 'text-foreground bg-secondary' : 'text-muted-foreground transition hover:text-foreground'}`}>Dashboard</Link>
      </nav>


      <div className="flex items-center gap-6">
      <div className="flex flex-row gap-2">
        <Coins className="size-4 text-primary" />
        <span className="text-sm font-semibold ">{currentUser?.current_credit || 0}</span>
      </div>
        <div className="hidden items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/30 md:flex">
          <Zap className="size-3" />
          Local · 100% private
        </div>
      </div>
    </header>
  );
}