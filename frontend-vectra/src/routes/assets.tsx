import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowDownAZ,
  ArrowDownUp,
  ArrowUpAZ,
  Copy,
  Download,
  FileImage,
  FolderKanban,
  Image as ImageIcon,
  LayoutGrid,
  LogOut,
  MoreVertical,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authStateFn } from "@/integrations/authStateFn";
import type { GeneratedImagesQuery, SVGConversionsQuery } from "@/hooks/use-image-generation";
import { useFileCleanup, useGetImageGenerations, useGetSVGConversions } from "@/hooks/use-image-generation";
import { useUserStore } from "@/lib/user-store";
import { useClerk } from "@clerk/tanstack-react-start";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

const NAV = [
  { icon: LayoutGrid, label: "Overview", to: "/dashboard" },
  { icon: Wand2, label: "Generate", to: "/generate" },
  { icon: ImageIcon, label: "Editor", to: "/editor" },
  { icon: Sparkles, label: "Convert", to: "/convertSVG" },
  { icon: FolderKanban, label: "Assets", to: "/assets", active: true },
];

type TabValue = "images" | "svg";

type AssetCardProps = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  badge: string;
  metadata: string[];
  createdAt?: string;
  filename: string;
  onDelete: (url: string) => Promise<void>;
};

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "Assets - Vectra" },
      {
        name: "description",
        content: "Search, filter, sort, download, and manage generated images and SVG conversions.",
      },
    ],
  }),
  validateSearch: (search) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: AssetsPage,
  beforeLoad: async () => await authStateFn(),
});

function AssetsPage() {
  const queryClient = useQueryClient();
    
  let { q } = Route.useSearch();
  const { mutateAsync: cleanupFile, isPending: isDeleting } = useFileCleanup();

  const [activeTab, setActiveTab] = useState<TabValue>("images");
  const [imagePage, setImagePage] = useState(1);
  const [svgPage, setSvgPage] = useState(1);
  const [imageLimit, setImageLimit] = useState(24);
  const [svgLimit, setSvgLimit] = useState(24);

  const [imageFilters, setImageFilters] = useState<GeneratedImagesQuery>({
    search: q || "",
    model: "",
    sort_by: "created_at",
    sort_order: "desc",
  }); 

  const [svgFilters, setSvgFilters] = useState<SVGConversionsQuery>({
    search: q || "",
    colormode: "",
    mode: "",
    hierarchical: "",
    sort_by: "created_at",
    sort_order: "desc",
  });

  const imageQuery = useMemo(
    () => compactQuery(imageFilters),
    [imageFilters],
  ) as GeneratedImagesQuery;

  const svgQuery = useMemo(
    () => compactQuery(svgFilters),
    [svgFilters],
  ) as SVGConversionsQuery;

  const {
    data: generatedImages,
    isLoading: imagesLoading,
    isFetching: imagesFetching,
  } = useGetImageGenerations(imagePage, imageLimit, imageQuery);

  const {
    data: svgConversions,
    isLoading: svgLoading,
    isFetching: svgFetching,
  } = useGetSVGConversions(svgPage, svgLimit, svgQuery);

  async function handleDelete(url: string) {
    const result = await cleanupFile(url);

    if (!result.success) {
      toast.error("Asset deletion failed");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["image_generations"] });
    queryClient.invalidateQueries({ queryKey: ["svg_conversions"] });
    toast.success("Asset deleted");
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar activeTab={activeTab} />
        <main className="flex-1 px-4 pb-12 pt-5 sm:px-6 lg:px-10">
          <section className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                Full API filter surface
              </div>
              <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Assets
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Browse generated images and SVG conversions with every search, filter, sort, and page option exposed by the API.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{generatedImages?.pagination?.total || 0} images</Badge>
              <Badge variant="secondary">{svgConversions?.pagination?.total || 0} SVGs</Badge>
              {(imagesFetching || svgFetching || isDeleting) && (
                <Badge variant="outline">Syncing</Badge>
              )}
            </div>
          </section>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
            <TabsList className="mb-4 h-10 bg-secondary/70">
              <TabsTrigger value="images" className="gap-2">
                <FileImage className="h-4 w-4" />
                Generated
              </TabsTrigger>
              <TabsTrigger value="svg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                SVG conversions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="images" className="mt-0">
              <GeneratedImagesPanel
                data={generatedImages}
                loading={imagesLoading}
                filters={imageFilters}
                page={imagePage}
                limit={imageLimit}
                onDelete={handleDelete}
                onPageChange={setImagePage}
                onLimitChange={(limit) => {
                  setImageLimit(limit);
                  setImagePage(1);
                }}
                onFiltersChange={(filters) => {
                  setImageFilters(filters);
                  setImagePage(1);
                }}
              />
            </TabsContent>

            <TabsContent value="svg" className="mt-0">
              <SVGConversionsPanel
                data={svgConversions}
                loading={svgLoading}
                filters={svgFilters}
                page={svgPage}
                limit={svgLimit}
                onDelete={handleDelete}
                onPageChange={setSvgPage}
                onLimitChange={(limit) => {
                  setSvgLimit(limit);
                  setSvgPage(1);
                }}
                onFiltersChange={(filters) => {
                  setSvgFilters(filters);
                  setSvgPage(1);
                }}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function GeneratedImagesPanel({
  data,
  loading,
  filters,
  page,
  limit,
  onDelete,
  onPageChange,
  onLimitChange,
  onFiltersChange,
}: {
  data: any;
  loading: boolean;
  filters: GeneratedImagesQuery;
  page: number;
  limit: number;
  onDelete: (url: string) => Promise<void>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onFiltersChange: (filters: GeneratedImagesQuery) => void;
}) {
  const items = data?.data || [];

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <FilterPanel title="Generated filters" onReset={() => onFiltersChange({
        search: "",
        model: "",
        sort_by: "created_at",
        sort_order: "desc",
      })}>
        <Field label="Prompt search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search || ""}
              onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
              placeholder="Search prompt"
              className="bg-secondary/40 pl-8"
            />
          </div>
        </Field>
        <Field label="Model">
          <Select
            value={filters.model || "all"}
            onValueChange={(model) => onFiltersChange({ ...filters, model: model === "all" ? "" : model })}
          >
            <SelectTrigger className="bg-secondary/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All models</SelectItem>
              <SelectItem value="flux">Flux</SelectItem>
              <SelectItem value="lightning">Lightning</SelectItem>
              <SelectItem value="sdxl">SDXL</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <SortFields
          value={filters.sort_by || "created_at"}
          order={filters.sort_order || "desc"}
          fields={[
            ["created_at", "Created"],
            ["width", "Width"],
            ["height", "Height"],
            ["size_bytes", "Size"],
            ["model", "Model"],
          ]}
          onFieldChange={(sort_by) => onFiltersChange({ ...filters, sort_by: sort_by as GeneratedImagesQuery["sort_by"] })}
          onOrderChange={(sort_order) => onFiltersChange({ ...filters, sort_order })}
        />
        <LimitSelect limit={limit} onLimitChange={onLimitChange} />
      </FilterPanel>

      <AssetResults
        title="Generated images"
        loading={loading}
        emptyText="No generated images match these filters."
        pagination={data?.pagination}
        page={page}
        onPageChange={onPageChange}
      >
        {items.map((image: any) => (
          <AssetCard
            key={image.id}
            id={image.id}
            title={image.prompt || "Generated image"}
            subtitle={image.model || "Model"}
            url={image.cloudinary_url}
            badge="AI"
            createdAt={image.created_at}
            filename={`image_${image.id}.png`}
            metadata={[
              `${image.width || "-"} x ${image.height || "-"}`,
              formatBytes(image.size_bytes),
              image.seed ? `Seed ${image.seed}` : "No seed",
            ]}
            onDelete={onDelete}
          />
        ))}
      </AssetResults>
    </div>
  );
}

function SVGConversionsPanel({
  data,
  loading,
  filters,
  page,
  limit,
  onDelete,
  onPageChange,
  onLimitChange,
  onFiltersChange,
}: {
  data: any;
  loading: boolean;
  filters: SVGConversionsQuery;
  page: number;
  limit: number;
  onDelete: (url: string) => Promise<void>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onFiltersChange: (filters: SVGConversionsQuery) => void;
}) {
  const items = data?.data || [];

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <FilterPanel title="SVG filters" onReset={() => onFiltersChange({
        search: "",
        colormode: "",
        mode: "",
        hierarchical: "",
        sort_by: "created_at",
        sort_order: "desc",
      })}>
        <Field label="Filename search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search || ""}
              onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
              placeholder="Search filename"
              className="bg-secondary/40 pl-8"
            />
          </div>
        </Field>
        <Field label="Color mode">
          <Select
            value={filters.colormode || "all"}
            onValueChange={(colormode) => onFiltersChange({ ...filters, colormode: colormode === "all" ? "" : colormode })}
          >
            <SelectTrigger className="bg-secondary/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All color modes</SelectItem>
              <SelectItem value="color">Color</SelectItem>
              <SelectItem value="bw">Black and white</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Trace mode">
          <Select
            value={filters.mode || "all"}
            onValueChange={(mode) => onFiltersChange({ ...filters, mode: mode === "all" ? "" : mode })}
          >
            <SelectTrigger className="bg-secondary/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All trace modes</SelectItem>
              <SelectItem value="spline">Spline</SelectItem>
              <SelectItem value="pixel">Pixel</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Hierarchy">
          <Select
            value={filters.hierarchical || "all"}
            onValueChange={(hierarchical) => onFiltersChange({ ...filters, hierarchical: hierarchical === "all" ? "" : hierarchical })}
          >
            <SelectTrigger className="bg-secondary/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All hierarchies</SelectItem>
              <SelectItem value="stacked">Stacked</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <SortFields
          value={filters.sort_by || "created_at"}
          order={filters.sort_order || "desc"}
          fields={[
            ["created_at", "Created"],
            ["original_filename", "Filename"],
            ["original_size_bytes", "Original size"],
            ["svg_size_bytes", "SVG size"],
            ["color_precision", "Color precision"],
            ["path_precision", "Path precision"],
          ]}
          onFieldChange={(sort_by) => onFiltersChange({ ...filters, sort_by: sort_by as SVGConversionsQuery["sort_by"] })}
          onOrderChange={(sort_order) => onFiltersChange({ ...filters, sort_order })}
        />
        <LimitSelect limit={limit} onLimitChange={onLimitChange} />
      </FilterPanel>

      <AssetResults
        title="SVG conversions"
        loading={loading}
        emptyText="No SVG conversions match these filters."
        pagination={data?.pagination}
        page={page}
        onPageChange={onPageChange}
      >
        {items.map((conversion: any) => (
          <AssetCard
            key={conversion.id}
            id={conversion.id}
            title={conversion.original_filename || "SVG conversion"}
            subtitle={`${conversion.colormode || "-"} / ${conversion.mode || "-"} / ${conversion.hierarchical || "-"}`}
            url={conversion.cloudinary_url}
            badge="SVG"
            createdAt={conversion.created_at}
            filename={`${(conversion.original_filename || conversion.id).replace(/\.[^/.]+$/, "")}.svg`}
            metadata={[
              formatBytes(conversion.original_size_bytes),
              formatBytes(conversion.svg_size_bytes),
              conversion.mode || "Trace",
            ]}
            onDelete={onDelete}
          />
        ))}
      </AssetResults>
    </div>
  );
}

function FilterPanel({
  title,
  onReset,
  children,
}: {
  title: string;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <aside className="glass h-fit rounded-lg border border-border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={onReset}>
          <X className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
      <div className="space-y-4">{children}</div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SortFields({
  value,
  order,
  fields,
  onFieldChange,
  onOrderChange,
}: {
  value: string;
  order: "asc" | "desc";
  fields: [string, string][];
  onFieldChange: (value: string) => void;
  onOrderChange: (value: "asc" | "desc") => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_82px] gap-2">
      <Field label="Sort by">
        <Select value={value} onValueChange={onFieldChange}>
          <SelectTrigger className="bg-secondary/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fields.map(([field, label]) => (
              <SelectItem key={field} value={field}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Order">
        <Button
          variant="outline"
          className="h-9 w-full bg-secondary/40 px-0"
          onClick={() => onOrderChange(order === "asc" ? "desc" : "asc")}
          title={order === "asc" ? "Ascending" : "Descending"}
        >
          {order === "asc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
        </Button>
      </Field>
    </div>
  );
}

function LimitSelect({
  limit,
  onLimitChange,
}: {
  limit: number;
  onLimitChange: (value: number) => void;
}) {
  return (
    <Field label="Per page">
      <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
        <SelectTrigger className="bg-secondary/40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option} assets
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function AssetResults({
  title,
  loading,
  emptyText,
  pagination,
  page,
  onPageChange,
  children,
}: {
  title: string;
  loading: boolean;
  emptyText: string;
  pagination?: any;
  page: number;
  onPageChange: (page: number) => void;
  children: ReactNode;
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="min-w-0">
      <div className="glass mb-4 flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {pagination?.total || 0} total assets
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowDownUp className="h-3.5 w-3.5" />
          Page {pagination?.page || page} of {pagination?.total_pages || 1}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/3] rounded-lg" />
          ))}
        </div>
      ) : hasItems ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {children}
        </div>
      ) : (
        <div className="glass flex min-h-64 items-center justify-center rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="outline"
          className="bg-secondary/40"
          disabled={!pagination?.has_prev}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          {pagination?.total ? `${pagination.limit * (pagination.page - 1) + 1}-${Math.min(pagination.limit * pagination.page, pagination.total)} of ${pagination.total}` : "0 assets"}
        </span>
        <Button
          variant="outline"
          className="bg-secondary/40"
          disabled={!pagination?.has_next}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  );
}

function AssetCard({
  title,
  subtitle,
  url,
  badge,
  metadata,
  createdAt,
  filename,
  onDelete,
}: AssetCardProps) {
  return (
    <article className="glass group overflow-hidden rounded-lg border border-border">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={url}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <Badge className="absolute left-2 top-2 bg-background/80 text-foreground backdrop-blur" variant="secondary">
          {badge}
        </Badge>
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload(url, filename)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy(url)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(url)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="space-y-3 p-3">
        <div>
          <h3 className="line-clamp-1 text-sm font-medium">{title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {metadata.map((item) => (
            <span key={item} className="rounded-md bg-secondary/60 px-2 py-1 text-[11px] text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
        {createdAt && (
          <p className="text-[11px] text-muted-foreground">
            {new Date(createdAt).toLocaleString()}
          </p>
        )}
      </div>
    </article>
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
        {NAV.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-gradient-soft text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
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
          className="flex justify-start gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

function TopBar({ activeTab }: { activeTab: TabValue }) {
  const currentUser = useUserStore((state) => state.user);
  const fallbackInitial = currentUser?.name?.[0] || currentUser?.email?.[0] || "U";

  return (
    <header className="glass sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border px-4 sm:px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-base font-semibold">Assets</h1>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {activeTab === "images" ? "Generated images" : "SVG conversions"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-1.5 bg-secondary/40 sm:inline-flex"
          onClick={() => window.location.reload()}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </Button>
        <Button asChild size="sm" className="gap-1.5 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
          <Link to="/generate">
            <Wand2 className="h-3.5 w-3.5" />
            New
          </Link>
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

function compactQuery<T extends Record<string, unknown>>(query: T) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
}

function formatBytes(value?: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

async function handleDownload(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

async function handleCopy(url: string) {
  await navigator.clipboard.writeText(url);
  toast.success("URL copied");
}
