// Browser-side raster -> SVG vectorization using imagetracerjs
// Loads the library lazily so SSR never tries to evaluate it.

export type ColorMode = "color" | "binary";
export type SplineMode = "spline" | "polygon" | "none";

export interface VectorizeOptions {
        file: File;
        colormode: 'color' | 'binary';
        hierarchical: 'stacked' | 'cutout';
        mode: 'spline' | 'polygon' | 'none';
        filter_speckle: number;
        color_precision: number;
        layer_difference: number;
        corner_threshold: number;
        length_threshold: number;
        max_iterations: number;
        splice_threshold: number;
        path_precision: number;
        clerk_user_id: string;
}

export const defaultOptions: VectorizeOptions = {
  file: new File([], ""),
  colormode: "color",
  hierarchical: "stacked" ,
  mode: "spline",
  corner_threshold: 60,
  filter_speckle: 4,
  layer_difference: 16,
  color_precision: 6,
  path_precision: 8,
  max_iterations: 10,
  splice_threshold: 45,
  length_threshold: 4.0,
  clerk_user_id: "",
};

// Helper: composite image over white background
async function compositeOnWhite(dataUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL();
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
