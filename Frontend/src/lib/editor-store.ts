import { create } from "zustand";
import { pointsToPath } from "./bezier";

export type ShapeType = "rect" | "ellipse" | "line" | "text" | "path";
export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "difference";

export interface BaseShape {
  id: string;
  type: ShapeType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  blend: BlendMode;
  visible: boolean;
  locked: boolean;
  transform?: string;
  extraAttrs?: Record<string, string>;
  groupId?: string;
}

export interface RectShape extends BaseShape {
  type: "rect";
  radius: number;
}
export interface EllipseShape extends BaseShape {
  type: "ellipse";
}
export interface LineShape extends BaseShape {
  type: "line";
  x2: number;
  y2: number;
}
export interface TextShape extends BaseShape {
  type: "text";
  text: string;
  fontSize: number;
  fontWeight: number;
}

export interface BezierPoint {
  x: number;
  y: number;

  handleIn?: {
    x: number;
    y: number;
  };

  handleOut?: {
    x: number;
    y: number;
  };
}

export interface PathShape extends BaseShape {
  type: "path";
  d: string;
  points: BezierPoint[];
  closed?: boolean;
}

export type Shape = RectShape | EllipseShape | LineShape | TextShape | PathShape;

export type Tool =
  | "select"
  | "rect"
  | "node-edit"
  | "ellipse"
  | "line"
  | "text"
  | "pen"
  | "pencil"
  | "hand";

export type AlignMode = "left" | "right" | "hcenter" | "top" | "bottom" | "vcenter";
export type DistributeAxis = "h" | "v";

export interface Guide { axis: "v" | "h"; pos: number; from: number; to: number }

interface State {
  shapes: Shape[];
  selectedIds: string[];
  tool: Tool;
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  showRulers: boolean;
  snap: boolean;
  history: Shape[][];
  future: Shape[][];
  canvasW: number;
  canvasH: number;
  bg: string;
  defs: string;
  guides: Guide[];
  nodeEditId: string | null;
  activeGroupId: string | null;
  clipboard: Shape[];
}

interface Actions {
  setTool: (t: Tool) => void;
  setZoom: (z: number) => void;
  setPan: (p: { x: number; y: number }) => void;
  addShape: (s: Shape) => void;
  updateShape: (id: string, patch: Partial<Shape>) => void;
  deleteSelected: () => void;
  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  bringForward: () => void;
  sendBackward: () => void;
  duplicate: () => void;
  group: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;
  rename: (id: string, name: string) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  setShowGrid: (v: boolean) => void;
  setShowRulers: (v: boolean) => void;
  setSnap: (v: boolean) => void;
  setBg: (c: string) => void;
  loadShapes: (s: Shape[], opts?: { canvasW?: number; canvasH?: number; bg?: string; defs?: string; replace?: boolean }) => void;
  reset: () => void;
  align: (mode: AlignMode) => void;
  distribute: (axis: DistributeAxis) => void;
  setGuides: (g: Guide[]) => void;
  appendDef: (xml: string) => void;
  applyMaskFromTopSelection: () => void;
  setNodeEditId: (id: string | null) => void;
  setActiveGroupId: (id: string | null) => void;
  copySelected: () => void;
  paste: () => void;
  updatePathPoint: (
    id: string,
    index: number,
    x: number,
    y: number
  ) => void;

  updateHandle: (
    id: string,
    index: number,
    handle: "in" | "out",
    x: number,
    y: number
  ) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const seed = (): Shape[] => [
  {
    id: uid(),
    type: "rect",
    name: "Background card",
    x: 120,
    y: 120,
    w: 360,
    h: 220,
    rotation: 0,
    fill: "oklch(0.78 0.18 195)",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
    blend: "normal",
    visible: true,
    locked: false,
    radius: 24,
  } as RectShape,
  {
    id: uid(),
    type: "ellipse",
    name: "Glow orb",
    x: 380,
    y: 220,
    w: 240,
    h: 240,
    rotation: 0,
    fill: "oklch(0.65 0.25 320)",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 0.85,
    blend: "screen",
    visible: true,
    locked: false,
  } as EllipseShape,
  {
    id: uid(),
    type: "text",
    name: "Headline",
    x: 160,
    y: 410,
    w: 420,
    h: 60,
    rotation: 0,
    fill: "oklch(0.97 0.01 270)",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
    blend: "normal",
    visible: true,
    locked: false,
    text: "Design without limits.",
    fontSize: 44,
    fontWeight: 700,
  } as TextShape,
];

export const useEditor = create<State & Actions>((set, get) => ({
  shapes: seed(),
  selectedIds: [],
  tool: "select",
  zoom: 1,
  pan: { x: 0, y: 0 },
  showGrid: true,
  showRulers: true,
  snap: true,
  history: [],
  future: [],
  canvasW: 1200,
  canvasH: 720,
  bg: "oklch(0.18 0.02 270)",
  defs: "",
  guides: [],
  nodeEditId: null,
  activeGroupId: null,
  clipboard: [],
  setTool: (tool) => set({ tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(8, zoom)) }),
  setPan: (pan) => set({ pan }),

  pushHistory: () =>
    set((s) => ({
      history: [...s.history.slice(-49), s.shapes.map((x) => ({ ...x }))],
      future: [],
    })),

  addShape: (s) => {
    get().pushHistory();
    set((st) => ({ shapes: [...st.shapes, s], selectedIds: [s.id] }));
  },

  updateShape: (id, patch) =>
    set((st) => ({
      shapes: st.shapes.map((s) => (s.id === id ? ({ ...s, ...patch } as Shape) : s)),
    })),

  deleteSelected: () => {
    get().pushHistory();
    set((st) => ({
      shapes: st.shapes.filter((s) => !st.selectedIds.includes(s.id)),
      selectedIds: [],
    }));
  },

  select: (ids) => {
    // Expand to include all members of any selected group, except the active group
    const all = get().shapes;
    const active = get().activeGroupId;
    const groups = new Set<string>();
    ids.forEach((id) => {
      const s = all.find((x) => x.id === id);
      if (s?.groupId && s.groupId !== active) groups.add(s.groupId);
    });
    const expanded = groups.size
      ? Array.from(new Set([...ids, ...all.filter((s) => s.groupId && groups.has(s.groupId)).map((s) => s.id)]))
      : ids;
    set({ selectedIds: expanded });
  },
  toggleSelect: (id) =>
    set((st) => ({
      selectedIds: st.selectedIds.includes(id)
        ? st.selectedIds.filter((i) => i !== id)
        : [...st.selectedIds, id],
    })),

  bringForward: () => {
    get().pushHistory();
    set((st) => {
      const next = [...st.shapes];
      st.selectedIds.forEach((id) => {
        const i = next.findIndex((s) => s.id === id);
        if (i >= 0 && i < next.length - 1) {
          [next[i], next[i + 1]] = [next[i + 1], next[i]];
        }
      });
      return { shapes: next };
    });
  },

  sendBackward: () => {
    get().pushHistory();
    set((st) => {
      const next = [...st.shapes];
      st.selectedIds.forEach((id) => {
        const i = next.findIndex((s) => s.id === id);
        if (i > 0) {
          [next[i], next[i - 1]] = [next[i - 1], next[i]];
        }
      });
      return { shapes: next };
    });
  },

  duplicate: () => {
    const { selectedIds, shapes } = get();
    if (!selectedIds.length) return;
    get().pushHistory();
    const dupes: Shape[] = shapes
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => ({ ...s, id: uid(), x: s.x + 24, y: s.y + 24, name: s.name + " copy" } as Shape));
    set((st) => ({ shapes: [...st.shapes, ...dupes], selectedIds: dupes.map((d) => d.id) }));
  },

  group: () => {},

  toggleVisible: (id) =>
    set((st) => ({
      shapes: st.shapes.map((s) => (s.id === id ? ({ ...s, visible: !s.visible } as Shape) : s)),
    })),
  toggleLocked: (id) =>
    set((st) => ({
      shapes: st.shapes.map((s) => (s.id === id ? ({ ...s, locked: !s.locked } as Shape) : s)),
    })),
  rename: (id, name) =>
    set((st) => ({ shapes: st.shapes.map((s) => (s.id === id ? ({ ...s, name } as Shape) : s)) })),

  undo: () =>
    set((st) => {
      if (!st.history.length) return st;
      const prev = st.history[st.history.length - 1];
      return {
        shapes: prev,
        history: st.history.slice(0, -1),
        future: [st.shapes, ...st.future].slice(0, 50),
      };
    }),

  redo: () =>
    set((st) => {
      if (!st.future.length) return st;
      const [next, ...rest] = st.future;
      return {
        shapes: next,
        future: rest,
        history: [...st.history, st.shapes].slice(-50),
      };
    }),

  setShowGrid: (showGrid) => set({ showGrid }),
  setShowRulers: (showRulers) => set({ showRulers }),
  setSnap: (snap) => set({ snap }),
  setBg: (bg) => set({ bg }),
  loadShapes: (shapes, opts) => {
    get().pushHistory();
    const cur = get();
    const merged = opts?.replace === false ? [...cur.shapes, ...shapes] : shapes;
    set({
      shapes: merged,
      selectedIds: shapes.map((s) => s.id),
      canvasW: opts?.canvasW ?? cur.canvasW,
      canvasH: opts?.canvasH ?? cur.canvasH,
      bg: opts?.bg ?? cur.bg,
      defs: opts?.defs !== undefined ? (opts.replace === false ? cur.defs + opts.defs : opts.defs) : cur.defs,
    });
  },
  reset: () => set({ shapes: seed(), selectedIds: [], history: [], future: [], defs: "", guides: [], nodeEditId: null, activeGroupId: null }),

  setGuides: (guides) => set({ guides }),
  appendDef: (xml) => set((st) => ({ defs: st.defs + "\n" + xml })),
  setNodeEditId: (id) => set({ nodeEditId: id }),
  setActiveGroupId: (id) => set({ activeGroupId: id, selectedIds: [] }),

  copySelected: () => {
    const { selectedIds, shapes } = get();
    const sel = shapes.filter((s) => selectedIds.includes(s.id));
    set({ clipboard: sel.map((s) => ({ ...s })) });
  },

  paste: () => {
    const { clipboard } = get();
    if (!clipboard.length) return;
    get().pushHistory();
    // Remap groupIds so groups stay together but distinct
    const groupMap = new Map<string, string>();
    const dupes: Shape[] = clipboard.map((s) => {
      let gid = s.groupId;
      if (gid) {
        if (!groupMap.has(gid)) groupMap.set(gid, uid());
        gid = groupMap.get(gid)!;
      }
      return { ...s, id: uid(), x: s.x + 16, y: s.y + 16, name: s.name + " copy", groupId: gid } as Shape;
    });
    set((st) => ({ shapes: [...st.shapes, ...dupes], selectedIds: dupes.map((d) => d.id) }));
  },

  groupSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.length < 2) return;
    get().pushHistory();
    const gid = uid();
    set((st) => ({
      shapes: st.shapes.map((s) =>
        selectedIds.includes(s.id) ? ({ ...s, groupId: gid } as Shape) : s
      ),
    }));
  },
  ungroupSelected: () => {
    const { selectedIds, shapes } = get();
    if (!selectedIds.length) return;
    get().pushHistory();
    const groups = new Set(
      shapes.filter((s) => selectedIds.includes(s.id) && s.groupId).map((s) => s.groupId!)
    );
    set((st) => ({
      shapes: st.shapes.map((s) =>
        s.groupId && groups.has(s.groupId) ? ({ ...s, groupId: undefined } as Shape) : s
      ),
    }));
  },

  align: (mode) => {
    const { selectedIds, shapes, canvasW, canvasH } = get();
    if (!selectedIds.length) return;
    get().pushHistory();
    const sel = shapes.filter((s) => selectedIds.includes(s.id));
    let bx = 0, by = 0, bw = canvasW, bh = canvasH;
    if (sel.length > 1) {
      bx = Math.min(...sel.map((s) => s.x));
      by = Math.min(...sel.map((s) => s.y));
      bw = Math.max(...sel.map((s) => s.x + s.w)) - bx;
      bh = Math.max(...sel.map((s) => s.y + s.h)) - by;
    }
    set((st) => ({
      shapes: st.shapes.map((s) => {
        if (!selectedIds.includes(s.id)) return s;
        let nx = s.x, ny = s.y;
        if (mode === "left") nx = bx;
        else if (mode === "right") nx = bx + bw - s.w;
        else if (mode === "hcenter") nx = bx + (bw - s.w) / 2;
        else if (mode === "top") ny = by;
        else if (mode === "bottom") ny = by + bh - s.h;
        else if (mode === "vcenter") ny = by + (bh - s.h) / 2;
        return { ...s, x: nx, y: ny } as Shape;
      }),
    }));
  },

  distribute: (axis) => {
    const { selectedIds, shapes } = get();
    if (selectedIds.length < 3) return;
    get().pushHistory();
    const sel = [...shapes.filter((s) => selectedIds.includes(s.id))].sort((a, b) =>
      axis === "h" ? a.x - b.x : a.y - b.y
    );
    const first = sel[0], last = sel[sel.length - 1];
    const total = axis === "h" ? last.x + last.w - first.x : last.y + last.h - first.y;
    const sumSize = sel.reduce((acc, s) => acc + (axis === "h" ? s.w : s.h), 0);
    const gap = (total - sumSize) / (sel.length - 1);
    let cursor = axis === "h" ? first.x : first.y;
    const patch = new Map<string, Partial<Shape>>();
    sel.forEach((s) => {
      patch.set(s.id, axis === "h" ? { x: cursor } : { y: cursor });
      cursor += (axis === "h" ? s.w : s.h) + gap;
    });
    set((st) => ({
      shapes: st.shapes.map((s) => (patch.has(s.id) ? ({ ...s, ...patch.get(s.id) } as Shape) : s)),
    }));
  },

  applyMaskFromTopSelection: () => {
    const { selectedIds, shapes } = get();
    if (selectedIds.length < 2) return;
    get().pushHistory();
    // Top of selection = last in shapes order
    const sel = shapes.filter((s) => selectedIds.includes(s.id));
    const top = sel[sel.length - 1];
    const targets = sel.filter((s) => s.id !== top.id);
    const clipId = "clip-" + uid();

    // Build a clipPath element from the top shape
    const clipBody = (() => {
      const sh = top;
      switch (sh.type) {
        case "rect": {
          const r = sh as RectShape;
          return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.radius}"/>`;
        }
        case "ellipse":
          return `<ellipse cx="${sh.x + sh.w / 2}" cy="${sh.y + sh.h / 2}" rx="${sh.w / 2}" ry="${sh.h / 2}"/>`;
        case "path": {
          const p = sh as PathShape;
          return `<path d="${p.d}"/>`;
        }
        default:
          return `<rect x="${sh.x}" y="${sh.y}" width="${sh.w}" height="${sh.h}"/>`;
      }
    })();

    const def = `<clipPath id="${clipId}">${clipBody}</clipPath>`;
    set((st) => ({
      defs: st.defs + "\n" + def,
      shapes: st.shapes
        .map((s) => {
          if (s.id === top.id) return { ...s, visible: false } as Shape;
          if (targets.find((t) => t.id === s.id)) {
            const extra = { ...(s.extraAttrs || {}), "clip-path": `url(#${clipId})` };
            return { ...s, extraAttrs: extra } as Shape;
          }
          return s;
        }),
      selectedIds: targets.map((t) => t.id),
    }));
  },

updatePathPoint: (id, index, x, y) =>
  set((st) => ({
    shapes: st.shapes.map((shape) => {
      if (shape.id !== id || shape.type !== "path")
        return shape;

      const points = [...shape.points];

      points[index] = {
        ...points[index],
        x,
        y,
      };

      return {
        ...shape,
        points,
        d: pointsToPath(points),
      };
    }),
  })),

  updateHandle: (
  id,
  index,
  handle,
  x,
  y
) =>
  set((st) => ({
    shapes: st.shapes.map((shape) => {
      if (shape.id !== id || shape.type !== "path")
        return shape;

      const points = [...shape.points];

      const point = {
        ...points[index],
      };

      if (handle === "in") {
        point.handleIn = { x, y };
      } else {
        point.handleOut = { x, y };
      }

      points[index] = point;

      return {
        ...shape,
        points,
        d: pointsToPath(points),
      };
    }),
  })),
}));

export const newId = uid;
