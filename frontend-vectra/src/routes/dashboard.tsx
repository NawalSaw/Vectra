import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles, LayoutGrid, Image as ImageIcon, FolderKanban, Wand2,
  Settings, CreditCard, LifeBuoy, Search, Plus, MoreHorizontal,
  TrendingUp, Zap, Clock, Download, Star, ArrowUpRight, Filter,
  LogOut,
  MoreVertical,
  Trash2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { authStateFn } from "@/integrations/authStateFn";
import { useClerk } from "@clerk/tanstack-react-start";
import JSZip from "jszip";
import saveAs from "file-saver";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCleanup, useFileCleanup, useGetImageGenerations, useGetSVGConversions } from "@/hooks/use-image-generation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api-config';
import { useCurrentUser } from "@/hooks/use-user";
import { useUserStore } from "@/lib/user-store";
import { useState } from "react";

const NAV = [
  { icon: LayoutGrid, label: "Overview", to: "/dashboard", active: true },
  { icon: Wand2, label: "Generate", to: "/generate" },
  { icon: ImageIcon, label: "Editor", to: "/editor" },
  { icon: Sparkles, label: "Convert", to: "/convertSVG" },
  { icon: FolderKanban, label: "Assets", to: "/assets" },
  // { icon: FolderKanban, label: "Projects" },
  // { icon: ImageIcon, label: "Assets" },
  // { icon: Star, label: "Favorites" },
];

type Generation = {
  created_at: string;
};

function getLast14DaysChartData(data: Generation[]) {
  const days: { label: string; value: number }[] = [];

  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dayKey = date.toISOString().split("T")[0];

    const count = data.filter((item) => {
      const createdDay = new Date(item.created_at)
        .toISOString()
        .split("T")[0];

      return createdDay === dayKey;
    }).length;

    days.push({
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: count,
    });
  }

  return days;
}
function calculateWeeklyIncreasePercent(data: any[]) {
  const now = new Date();

  if (!data || data.length === 0) {
    return {
      thisWeekCount: 0,
      lastWeekCount: 0,
      increasePercent: 0,
    };
  }
  
  // Start of this week (Monday)
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfThisWeek.setHours(0, 0, 0, 0);

  // Start of last week
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const thisWeekCount = data.filter((item) => {
    const createdAt = new Date(item.created_at);
    return createdAt >= startOfThisWeek;
  }).length;

  const lastWeekCount = data.filter((item) => {
    const createdAt = new Date(item.created_at);
    return (
      createdAt >= startOfLastWeek &&
      createdAt < startOfThisWeek
    );
  }).length;

  // Avoid division by zero
  if (lastWeekCount === 0) {
    return {
      thisWeekCount,
      lastWeekCount,
      increasePercent: 100,
    };
  }

  const increasePercent =
    ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;

  return {
    thisWeekCount,
    lastWeekCount,
    increasePercent: Number(increasePercent.toFixed(2)),
  };
}
async function exportAllAssetsAsZip(
  images: any[],
  conversions: any[],
) {
  const zip = new JSZip();

  const imageFolder = zip.folder("generated-images");
  const svgFolder = zip.folder("vector-conversions");

  const assets = [
    ...images.map((img) => ({
      folder: imageFolder,
      url: img.cloudinary_url,
      filename: `image_${img.id}.png`,
    })),

    ...conversions.map((conv) => ({
      folder: svgFolder,
      url: conv.cloudinary_url,
      filename: `${conv.original_filename.replace(/\.[^/.]+$/, "")}.svg`,
    })),
  ];

  await Promise.all(
    assets.map(async (asset) => {
      try {
        const response = await fetch(asset.url);

        const blob = await response.blob();

        asset.folder?.file(asset.filename, blob);
      } catch (err) {
        console.error("Failed to fetch asset:", asset.url, err);
      }
    }),
  );

  const content = await zip.generateAsync({
    type: "blob",
  });

  saveAs(
    content,
    `assets-export-${new Date().toISOString().split("T")[0]}.zip`,
  );
}
const handleDownload = async (url: string, filename: string) => {
  const response = await fetch(url);

  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = blobUrl;
  a.download = filename;

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(blobUrl);
};
const handleCopy = async (url: string) => {
  await navigator.clipboard.writeText(url);
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vectra" },
      { name: "description", content: "Your creative workspace. Manage projects, assets, and usage across Vectra." },
      { property: "og:title", content: "Vectra Dashboard" },
      { property: "og:description", content: "Manage your AI-generated assets, projects, and team usage." },
    ],
  }),
  component: DashboardPage,
  beforeLoad: async () => await authStateFn(),
  loader: async ({ context }) => {
    return { userId: context.userId }
  },
});

function DashboardPage() {
  const currentUser = useUserStore((state) => state.user);

  const PAGE = 1;
  const LIMIT = 10;

  const { mutateAsync: cleanupFile } = useFileCleanup();
  const { mutateAsync: cleanupMutation } = useCleanup(cleanupFile, PAGE, LIMIT)

  const { data: userImages, isLoading: isLoadingImages } = useGetImageGenerations(PAGE, LIMIT)
  const { data: userConversions, isLoading: isLoadingConversions } = useGetSVGConversions(PAGE, LIMIT)

  const conversions = userConversions?.data || [];
  const imagesData = userImages?.data || [];


  // STATS
  const STATS = [
    {
      label: "Generations",
      value:
        userImages?.pagination?.total ||
        0,
      delta: `${calculateWeeklyIncreasePercent(imagesData).increasePercent}%`,
      icon: Wand2,
      hue: "from-cyan-400 to-blue-500",
    },

    {
      label: "Credits left",
      value: `${currentUser?.current_credit || 0}`,
      delta: "of 200",
      icon: Zap,
      hue: "from-fuchsia-400 to-pink-500",
    },

    {
      label: "Assets",
      value:
        (userImages?.pagination
          ?.total || 0) +
        (userConversions?.pagination
          ?.total || 0),
      delta: `${calculateWeeklyIncreasePercent(conversions).increasePercent}%`,
      icon: ImageIcon,
      hue: "from-violet-400 to-indigo-500",
    },

    {
      label: "Avg. render",
      value: "3.4s",
      delta: "0.6s",
      icon: Clock,
      hue: "from-amber-300 to-orange-500",
    },
  ];

  // CLEANUP
  async function handleCleanup(
    cloudinaryUrl: string
  ) {
    await cleanupMutation(
      cloudinaryUrl
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-6 pb-12 pt-6 lg:px-10">
          <Hero />
          <StatsRow stats={STATS} />
          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <UsageChart images={imagesData || []} />
            <CreditsCard currentCredit={currentUser?.current_credit || 0} />
          </div>
          <div className="overflow-scroll max-h-[calc(100vh-200px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <RecentAssets loading={(isLoadingImages && isLoadingConversions)} images={imagesData || []} conversions={conversions || []} handleCleanup={handleCleanup} />
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const { signOut } = useClerk();
  const clearUser = useUserStore((state) => state.clearUser);
  return (
    <aside className="glass sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border p-4 lg:flex">
      <Link to="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </span>
        <span className="font-display text-base font-semibold">Vectra</span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((n) => {
          const Icon = n.icon;
          const cls = `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            n.active
              ? "bg-gradient-soft text-foreground"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          }`;
          return n.to ? (
            <Link key={n.label} to={n.to} className={cls}>
              <Icon className="h-4 w-4" /> {n.label}
            </Link>
          ) : (
            <button key={n.label} className={cls + " text-left"}>
              <Icon className="h-4 w-4" /> {n.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5">
        <Button
          variant="ghost"
          onClick={() => {
            clearUser();
            signOut({ redirectUrl: "/login" });
          }}
          className="flex justify-start items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}

function TopBar() {
  const currentUser = useUserStore((state) => state.user);
  const fallbackInitial = currentUser?.name?.[0] || currentUser?.email?.[0] || "U";

  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  return (
    <header className="glass sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-base font-semibold">Overview</h1>
        <span className="hidden text-xs text-muted-foreground sm:inline">· {new Date().toLocaleDateString().split('/').join('-')}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets, projects…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                navigate({
                  to: "/assets",
                  search: {
                    q: search.trim(),
                  },
                });
              }
            }}
            className="h-8 w-72 bg-secondary/40 pl-8 text-sm"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
        <Button asChild size="sm" className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
          <Link to="/generate"><Plus className="h-3.5 w-3.5" /> New generation</Link>
        </Button>
        {currentUser?.image_url ? (
          <img
            src={currentUser.image_url}
            alt={currentUser.name || "User"}
            className="ml-1 h-8 w-8 rounded-full object-cover shadow-glow"
          />
        ) : (
          <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold uppercase text-primary-foreground shadow-glow">
            {fallbackInitial}
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  const currentUser = useUserStore((state) => state.user);
  const firstName = currentUser?.name?.split(" ")[0] || "there";
  const credits = currentUser?.current_credit ?? 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong relative overflow-hidden rounded-3xl border border-border p-6 lg:p-8"
    >
      <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "var(--gradient-mesh)" }} />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Welcome back, {firstName}
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Let's make something <span className="text-gradient">extraordinary</span>.
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {credits} credits left this cycle. Keep building your image and SVG library from one workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="bg-secondary/40">
            <Link to="/editor">Open Editor</Link>
          </Button>
          <Button asChild className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
            <Link to="/generate"><Wand2 className="h-3.5 w-3.5" /> Generate</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

function StatsRow({ stats }: { stats: any[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="glass relative overflow-hidden rounded-2xl border border-border p-4"
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${stat.hue} opacity-25 blur-2xl`} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{stat.value}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" /> {stat.delta}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function UsageChart({ images }: { images: any[] }) {
  const chartData = getLast14DaysChartData(images);
  const max = Math.max(...chartData.map((item) => item.value), 1);

  return (
    <div className="glass rounded-2xl border border-border p-5 xl:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Generations</div>
          <div className="mt-1 font-display text-xl font-semibold">Last 14 days</div>
        </div>
        <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground"><Filter className="h-3.5 w-3.5" /> All models</Button>
      </div>
      <div className="mt-6 flex h-44 items-end gap-2">
        {chartData.map((day, i) => (
          <motion.div
            key={day.label}
            initial={{ height: 0 }}
            animate={{
              height: `${(day.value / max) * 100}%`,
            }}
            transition={{
              delay: i * 0.03,
              duration: 0.6,
              ease: "easeOut",
            }}
            className="group relative flex-1 rounded-t-md bg-gradient-to-t from-primary/40 via-primary/70 to-accent shadow-glow"
          >
            <div className="absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-background px-1.5 py-0.5 text-[10px] text-foreground shadow group-hover:block">
              {day.value}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
        {chartData.map((v, i) => (
          <span key={i}>{v.label}</span>
        ))}
      </div>
    </div>
  );
}

function CreditsCard({currentCredit}: {currentCredit:number}) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl border border-border p-5">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-primary opacity-25 blur-3xl" />
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Credits</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold tabular-nums">{currentCredit}</span>
        <span className="text-sm text-muted-foreground">/ 200</span>
      </div>
      <Progress value={(currentCredit/200) * 100} className="mt-3 h-1.5" />
      {/* <p className="mt-3 text-xs text-muted-foreground">Renews May 28. Pro members get unlimited generations and team seats.</p> */}
      {/* <Button size="sm" className="mt-4 w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">Upgrade plan</Button> */}
    </div>
  );
}

function RecentAssets({loading, images, conversions, handleCleanup}: {loading: boolean , images: any[], conversions: any[], handleCleanup: (publicId: string) => Promise<void>}) {
const assets = [
  ...images.map((img) => ({
    id: img.id,
    type: "image" as const,
    url: img.cloudinary_url,
    title: img.prompt,
    subtitle: img.model,
    created_at: img.created_at,
    filename: `image_${img.id}.png`,
  })),

  ...conversions.map((conv) => ({
    id: conv.id,
    type: "svg" as const,
    url: conv.cloudinary_url,
    title: conv.original_filename,
    subtitle: conv.mode,
    created_at: conv.created_at,
    filename: `${conv.original_filename.replace(/\.[^/.]+$/, "")}.svg`,
  })),
]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .slice(0, 12);

  const navigate = useNavigate()

  return (
    <div className="glass rounded-2xl border border-border p-5 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">
          Recent assets
        </h3>
        <div>
        <Button
          variant="ghost"
          size="sm"
           onClick={() => exportAllAssetsAsZip(images, conversions)}
          className="gap-1 text-muted-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          Export all
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() =>navigate({to: "/assets", search: {"q": ""}}) }
          className="gap-1 text-muted-foreground"
        >
          <ArrowUpRight className="size-4"/>
          View more
        </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {!loading && assets.map((asset, i) => (
         <motion.div
  key={asset.id}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: i * 0.03 }}
  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
>
  <img
    src={asset.url}
    alt={asset.title}
    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
  />

  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

  <div className="absolute left-2 top-2 rounded-md bg-background/70 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">
    {asset.type === "image" ? "AI" : "SVG"}
  </div>

  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7 backdrop-blur"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            handleDownload(asset.url, asset.filename)
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleCopy(asset.url)}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy URL
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() =>
            handleCleanup(asset.url)
          }
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-background/70 p-2 text-[10px] backdrop-blur transition-transform group-hover:translate-y-0">
    <div className="truncate font-medium">
      {asset.title}
    </div>

    <div className="mt-0.5 flex items-center justify-between text-muted-foreground">
      <span className="truncate">
        {asset.subtitle}
      </span>

      <Star className="h-3 w-3" />
    </div>
  </div>
</motion.div>
        ))}
      </div>
        {loading && (
          <div className="text-xl text-gray-300">
            Loading...
          </div>
        )}
    </div>
  );
}
