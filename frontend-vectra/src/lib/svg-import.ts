import type {
  Shape,
  RectShape,
  EllipseShape,
  LineShape,
  TextShape,
  PathShape,
  BlendMode,
} from "@/lib/editor-store";
import { newId } from "@/lib/editor-store";

export interface ImportResult {
  shapes: Shape[];
  width: number;
  height: number;
  bg: string;
  defs: string;
}

const SVG_NS = "http://www.w3.org/2000/svg";

const num = (v: string | null | undefined, d = 0) => {
  if (v == null) return d;
  const n = parseFloat(v);
  return isFinite(n) ? n : d;
};

function parseStyle(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  const s = el.getAttribute("style");
  if (!s) return out;
  s.split(";").forEach((part) => {
    const i = part.indexOf(":");
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = v;
  });
  return out;
}

function getProp(el: Element, name: string): string | null {
  const style = parseStyle(el);
  if (style[name] != null) return style[name];
  return el.getAttribute(name);
}

function inherit(el: Element, name: string): string | null {
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1) {
    const v = getProp(cur, name);
    if (v && v !== "inherit") return v;
    if (cur.tagName.toLowerCase() === "svg") return null;
    cur = cur.parentElement;
  }
  return null;
}

// Compute average color from a gradient definition (best-effort fallback).
function gradientFallback(root: Document | Element, refUrl: string): string | null {
  const m = refUrl.match(/url\(#([^)]+)\)/);
  if (!m) return null;
  const id = m[1];
  const grad = root.querySelector(`#${CSS.escape(id)}`);
  if (!grad) return null;
  const stops = Array.from(grad.querySelectorAll("stop"));
  if (!stops.length) return null;
  // Use middle stop as fallback color
  const mid = stops[Math.floor(stops.length / 2)];
  const c = mid.getAttribute("stop-color") || parseStyle(mid)["stop-color"];
  return c || null;
}

function paint(el: Element, name: "fill" | "stroke", root: SVGSVGElement, defaultColor: string): { value: string; isUrl: boolean } {
  const v = inherit(el, name);
  if (v == null) return { value: defaultColor, isUrl: false };
  const trimmed = v.trim();
  if (trimmed === "none") return { value: "transparent", isUrl: false };
  if (trimmed === "currentColor") return { value: "oklch(0.97 0.01 270)", isUrl: false };
  if (trimmed.startsWith("url(")) {
    // Keep the url ref so gradient/pattern still renders via preserved <defs>
    return { value: trimmed, isUrl: true };
  }
  return { value: trimmed, isUrl: false };
}

function matrixToString(m: DOMMatrix): string {
  if (m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1 && m.e === 0 && m.f === 0) return "";
  return `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`;
}

function pointsToPath(points: string, close: boolean): string {
  const nums = points.trim().split(/[\s,]+/).map(parseFloat).filter((n) => isFinite(n));
  if (nums.length < 4) return "";
  let d = `M ${nums[0]} ${nums[1]}`;
  for (let i = 2; i < nums.length; i += 2) d += ` L ${nums[i]} ${nums[i + 1]}`;
  if (close) d += " Z";
  return d;
}

const EXTRA_KEYS = [
  "fill-opacity",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "fill-rule",
  "clip-rule",
  "vector-effect",
  "paint-order",
  "filter",
  "clip-path",
  "mask",
  "font-family",
  "font-style",
  "letter-spacing",
  "text-anchor",
] as const;

function commonProps(el: Element, root: SVGSVGElement) {
  const f = paint(el, "fill", root, "#000000");
  const s = paint(el, "stroke", root, "transparent");
  const strokeWidth = num(inherit(el, "stroke-width"), s.value === "transparent" ? 0 : 1);
  const opacity = num(inherit(el, "opacity"), 1);
  const display = inherit(el, "display");
  const visibility = inherit(el, "visibility");
  const visible = display !== "none" && visibility !== "hidden";
  const blendStyle = (inherit(el, "mix-blend-mode") as BlendMode) || "normal";

  const extra: Record<string, string> = {};
  for (const k of EXTRA_KEYS) {
    const v = inherit(el, k);
    if (v != null && v !== "inherit") extra[k] = v;
  }

  let ctmStr = "";
  try {
    const svgEl = el as SVGGraphicsElement;
    const ctm = svgEl.getCTM?.();
    const rootCTM = root.getCTM?.();
    if (ctm && rootCTM) ctmStr = matrixToString(rootCTM.inverse().multiply(ctm));
    else if (ctm) ctmStr = matrixToString(ctm);
  } catch {
    /* noop */
  }

  return {
    fill: f.value,
    stroke: s.value,
    strokeWidth,
    opacity,
    blend: blendStyle,
    visible,
    locked: false,
    rotation: 0,
    transform: ctmStr || undefined,
    extraAttrs: Object.keys(extra).length ? extra : undefined,
  };
}

function bbox(el: SVGGraphicsElement): { x: number; y: number; w: number; h: number } {
  try {
    const b = el.getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  } catch {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
}

// Expand <use href="#x"/> into a clone of the referenced node, preserving the use's transform.
function expandUses(root: SVGSVGElement) {
  const uses = Array.from(root.querySelectorAll("use"));
  for (const u of uses) {
    const href = u.getAttribute("href") || u.getAttribute("xlink:href") || "";
    if (!href.startsWith("#")) continue;
    const target = root.querySelector(href);
    if (!target) continue;
    const clone = target.cloneNode(true) as Element;
    // Wrap in <g> with use's transform/x/y so positioning is preserved.
    const g = document.createElementNS(SVG_NS, "g");
    const ux = num(u.getAttribute("x"));
    const uy = num(u.getAttribute("y"));
    const t = u.getAttribute("transform") || "";
    const trans = `${t} translate(${ux} ${uy})`.trim();
    if (trans) g.setAttribute("transform", trans);
    // Inherit style from the <use>
    for (const a of Array.from(u.attributes)) {
      if (["href", "xlink:href", "x", "y", "transform", "width", "height", "id"].includes(a.name)) continue;
      g.setAttribute(a.name, a.value);
    }
    g.appendChild(clone);
    u.parentNode?.replaceChild(g, u);
  }
}

export function parseSVG(svgText: string): ImportResult {
  // Mount offscreen so getBBox / getCTM are accurate
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-99999px;top:-99999px;width:0;height:0;overflow:hidden;visibility:hidden;";
  container.innerHTML = svgText.trim();
  const root = container.querySelector("svg") as SVGSVGElement | null;
  if (!root) throw new Error("Invalid SVG file");
  document.body.appendChild(container);

  // Resolve <use> references first
  try { expandUses(root); } catch { /* noop */ }

  // Determine canvas size from viewBox / width / height
  let width = 1200, height = 720;
  const vb = root.getAttribute("viewBox");
  if (vb) {
    const [, , vw, vh] = vb.split(/[\s,]+/).map(parseFloat);
    if (isFinite(vw) && isFinite(vh)) { width = vw; height = vh; }
  } else {
    width = num(root.getAttribute("width"), 1200);
    height = num(root.getAttribute("height"), 720);
  }

  // Resolve url(#..) fallbacks against root
  const resolveFill = (v: string) => {
    if (!v.startsWith("url(")) return v;
    return v; // keep as-is; defs preserved separately
  };

  // Capture defs so gradients/patterns/filters/clipPaths render via the editor
  const defsParts: string[] = [];
  Array.from(root.querySelectorAll("defs")).forEach((d) => defsParts.push(d.innerHTML));
  // Top-level gradients/patterns may live outside <defs>
  const topLevelDefs = ["linearGradient", "radialGradient", "pattern", "filter", "clipPath", "mask", "symbol"];
  for (const tag of topLevelDefs) {
    Array.from(root.querySelectorAll(`:scope > ${tag}`)).forEach((n) => defsParts.push(n.outerHTML));
  }
  const defs = defsParts.join("\n");

  const shapes: Shape[] = [];
  let count = 0;

  const skip = new Set([
    "defs", "metadata", "title", "desc", "style", "script",
    "linearGradient", "radialGradient", "pattern", "filter", "clipPath", "mask", "symbol", "marker", "stop",
  ]);

  const walk = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    if (skip.has(tag)) return;

    if (tag === "g" || tag === "svg" || tag === "a" || tag === "switch") {
      Array.from(el.children).forEach(walk);
      return;
    }

    const cp = commonProps(el, root);
    cp.fill = resolveFill(cp.fill);
    cp.stroke = resolveFill(cp.stroke);

    const handle = (sh: Shape) => { shapes.push(sh); count++; };

    switch (tag) {
      case "rect": {
        const x = num(el.getAttribute("x"));
        const y = num(el.getAttribute("y"));
        const w = num(el.getAttribute("width"));
        const h = num(el.getAttribute("height"));
        const rx = num(el.getAttribute("rx") ?? el.getAttribute("ry"));
        if (w <= 0 || h <= 0) return;
        handle({
          id: newId(), type: "rect", name: `Rect ${++count}`,
          x, y, w, h, radius: rx, ...cp,
        } as RectShape);
        return;
      }
      case "circle": {
        const cx = num(el.getAttribute("cx"));
        const cy = num(el.getAttribute("cy"));
        const r = num(el.getAttribute("r"));
        if (r <= 0) return;
        handle({
          id: newId(), type: "ellipse", name: `Circle ${++count}`,
          x: cx - r, y: cy - r, w: r * 2, h: r * 2, ...cp,
        } as EllipseShape);
        return;
      }
      case "ellipse": {
        const cx = num(el.getAttribute("cx"));
        const cy = num(el.getAttribute("cy"));
        const rx = num(el.getAttribute("rx"));
        const ry = num(el.getAttribute("ry"));
        if (rx <= 0 || ry <= 0) return;
        handle({
          id: newId(), type: "ellipse", name: `Ellipse ${++count}`,
          x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2, ...cp,
        } as EllipseShape);
        return;
      }
      case "line": {
        const x1 = num(el.getAttribute("x1"));
        const y1 = num(el.getAttribute("y1"));
        const x2 = num(el.getAttribute("x2"));
        const y2 = num(el.getAttribute("y2"));
        handle({
          id: newId(), type: "line", name: `Line ${++count}`,
          x: x1, y: y1, x2, y2,
          w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
          ...cp,
          fill: "transparent",
          strokeWidth: cp.strokeWidth || 1,
          stroke: cp.stroke === "transparent" ? "oklch(0.97 0.01 270)" : cp.stroke,
        } as LineShape);
        return;
      }
      case "text":
      case "tspan": {
        const b = bbox(el as SVGGraphicsElement);
        const fontSize = num(inherit(el, "font-size"), 16);
        const fontWeight = num(inherit(el, "font-weight"), 400);
        const text = (el.textContent || "").trim();
        if (!text) return;
        handle({
          id: newId(), type: "text", name: `Text ${++count}`,
          x: b.x, y: b.y, w: b.w || text.length * fontSize * 0.6, h: b.h || fontSize,
          text, fontSize, fontWeight, ...cp,
        } as TextShape);
        return;
      }
      case "polygon":
      case "polyline": {
        const d = pointsToPath(el.getAttribute("points") || "", tag === "polygon");
        if (!d) return;
        const b = bbox(el as SVGGraphicsElement);
        handle({
          id: newId(), type: "path", name: `${tag === "polygon" ? "Polygon" : "Polyline"} ${++count}`,
          x: b.x, y: b.y, w: b.w, h: b.h, d, ...cp,
        } as PathShape);
        return;
      }
      case "path": {
        const d = el.getAttribute("d") || "";
        if (!d) return;
        const b = bbox(el as SVGGraphicsElement);
        handle({
          id: newId(), type: "path", name: `Path ${++count}`,
          x: b.x, y: b.y, w: b.w, h: b.h, d, ...cp,
        } as PathShape);
        return;
      }
      case "image": {
        // Represent as rect with image fill via extraAttrs (best-effort: shows bounds + href in export)
        const x = num(el.getAttribute("x"));
        const y = num(el.getAttribute("y"));
        const w = num(el.getAttribute("width"));
        const h = num(el.getAttribute("height"));
        const href = el.getAttribute("href") || el.getAttribute("xlink:href") || "";
        if (w <= 0 || h <= 0) return;
        const extra = { ...(cp.extraAttrs || {}), "data-href": href };
        handle({
          id: newId(), type: "rect", name: `Image ${++count}`,
          x, y, w, h, radius: 0, ...cp, extraAttrs: extra,
          fill: "oklch(0.3 0.02 270)",
        } as RectShape);
        return;
      }
      case "foreignobject":
        return;
      default:
        if (el.children.length) Array.from(el.children).forEach(walk);
    }
  };

  Array.from(root.children).forEach(walk);

  document.body.removeChild(container);

  return {
    shapes,
    width,
    height,
    bg: "oklch(0.18 0.02 270)",
    defs,
  };
}
