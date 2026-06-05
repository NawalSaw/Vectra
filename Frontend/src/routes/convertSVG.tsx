import { createFileRoute } from "@tanstack/react-router";
import { Dropzone } from "@/components/converter/Dropzone";
import { FileList } from "@/components/converter/FileList";
import { ControlsPanel } from "@/components/converter/ControlsPanel";
import { PreviewCanvas } from "@/components/converter/PreviewCanvas";
import { ArrowLeft, Sparkles, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { authStateFn } from "@/integrations/authStateFn";

export const Route = createFileRoute("/convertSVG")({
  head: () => ({
    meta: [
      { title: "Vectra — AI-powered raster to SVG converter" },
      {
        name: "description",
        content:
          "Convert images to crisp, scalable SVGs in your browser. Real-time vectorization controls with a pro-grade compare canvas.",
      },
      { property: "og:title", content: "Vectra — Image to SVG, in your browser" },
      {
        property: "og:description",
        content:
          "Drop images, tune vectorization in real time, export production-ready SVGs.",
      },
    ],
  }),
  component: ConverterApp,
  beforeLoad: async () => await authStateFn(),
  loader: async ({ context }) => {
    return { userId: context.userId }
  },
}); 

function ConverterApp() {
  return (
    <div className="flex h-screen flex-col overflow-hidden mt-12">
      <div className="flex flex-1 gap-3 overflow-hidden p-3">
        {/* Left: files */}
        <aside className="hidden w-[280px] shrink-0 flex-col gap-3 lg:flex">
          <div className="glass rounded-xl p-3">
            <Dropzone compact />
          </div>
          <div className="glass flex-1 overflow-y-auto rounded-xl p-3">
            <FileList />
            <EmptyFiles />
          </div>
        </aside>

        {/* Center: canvas */}
        <main className="glass flex-1 overflow-hidden rounded-xl">
          <PreviewCanvas />
        </main>

        {/* Right: controls */}
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="glass h-full overflow-hidden rounded-xl">
            <ControlsPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}

function EmptyFiles() {
  return (
    <div className="hidden only:block">
      <div className="px-2 py-8 text-center text-xs text-muted-foreground">
        No files yet. Add one above to get started.
      </div>
    </div>
  );
}
