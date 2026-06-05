import { create } from "zustand";
import {
  defaultOptions,
  fileToDataUrl,
  type VectorizeOptions,
} from "./vectorize";

export type JobStatus = "pending" | "processing" | "done" | "error";

export interface Job {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  width: number;
  height: number;
  svg?: string;
  status: JobStatus;
  error?: string;
  durationMs?: number;
  file?: File; // Store the original file for API conversion
}

interface ConverterState {
  jobs: Job[];
  activeId: string | null;
  options: VectorizeOptions;
  isConverting: boolean;
  setActive: (id: string) => void;
  addFiles: (files: File[]) => Promise<void>;
  removeJob: (id: string) => void;
  clear: () => void;
  updateOption: <K extends keyof VectorizeOptions>(key: K, value: VectorizeOptions[K]) => void;
  resetOptions: () => void;
  convertActive: (apiConvertFn?: (file: File, options: VectorizeOptions) => Promise<string>) => Promise<void>;
  convertAll: (apiConvertFn?: (file: File, options: VectorizeOptions) => Promise<string>) => Promise<void>;
}

const uid = () => Math.random().toString(36).slice(2, 10);

async function readImageMeta(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export const useConverter = create<ConverterState>((set, get) => ({
  jobs: [],
  activeId: null,
  options: { ...defaultOptions },
  isConverting: false,

  setActive: (id) => set({ activeId: id }),

  addFiles: async (files) => {
    const newJobs: Job[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      const dataUrl = await fileToDataUrl(f);
      const meta = await readImageMeta(dataUrl).catch(() => ({ width: 0, height: 0 }));
      newJobs.push({
        id: uid(),
        name: f.name,
        size: f.size,
        dataUrl,
        width: meta.width,
        height: meta.height,
        status: "pending",
        file: f, // Store original file for API conversion
      });
    }
    set((s) => ({
      jobs: [...s.jobs, ...newJobs],
      activeId: s.activeId ?? newJobs[0]?.id ?? null,
    }));
  },

  removeJob: (id) =>
    set((s) => {
      const jobs = s.jobs.filter((j) => j.id !== id);
      return {
        jobs,
        activeId: s.activeId === id ? jobs[0]?.id ?? null : s.activeId,
      };
    }),

  clear: () => set({ jobs: [], activeId: null }),

  updateOption: (key, value) =>
    set((s) => ({ options: { ...s.options, [key]: value } })),

  resetOptions: () => set({ options: { ...defaultOptions } }),

  convertActive: async (apiConvertFn) => {
    const { activeId, jobs, options } = get();
    const job = jobs.find((j) => j.id === activeId);

    if (!job) return;
    set({ isConverting: true });
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === job.id ? { ...j, status: "processing", error: undefined } : j)),
    }));

    const t0 = performance.now();
    try {
      let svg: string;
      if (apiConvertFn && job.file) {
        console.log(job.file)
        console.log("Converting with options:", options);
        svg = await apiConvertFn(job.file, options);
      }
      const dur = performance.now() - t0;
      set((s) => ({
        jobs: s.jobs.map((j) =>
          j.id === job.id ? { ...j, svg, status: "done", durationMs: dur } : j,
        ),
        isConverting: false,
      }));
    } catch (e) {
      set((s) => ({
        jobs: s.jobs.map((j) =>
          j.id === job.id ? { ...j, status: "error", error: (e as Error).message } : j,
        ),
        isConverting: false,
      }));
    }
  },

  convertAll: async (apiConvertFn) => {
    const { jobs, options } = get();
    set({ isConverting: true });
    for (const job of jobs) {
      set((s) => ({
        jobs: s.jobs.map((j) => (j.id === job.id ? { ...j, status: "processing" } : j)),
      }));
      const t0 = performance.now();
      try {
        let svg: string;
        if (apiConvertFn && job.file) {
          svg = await apiConvertFn(job.file, options);
        }
        const dur = performance.now() - t0;
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === job.id ? { ...j, svg, status: "done", durationMs: dur } : j,
          ),
        }));
      } catch (e) {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === job.id ? { ...j, status: "error", error: (e as Error).message } : j,
          ),
        }));
      }
    }
    set({ isConverting: false });
  },
}));
