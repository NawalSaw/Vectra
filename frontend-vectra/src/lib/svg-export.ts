import type { Shape, RectShape, LineShape, TextShape, PathShape } from "@/lib/editor-store";

export function shapesToSVG(shapes: Shape[], w: number, h: number, bg: string, defs = "") {
  const body = shapes
    .filter((s) => s.visible)
    .map((s) => {
      const rot = s.rotation ? `rotate(${s.rotation} ${s.x + s.w / 2} ${s.y + s.h / 2})` : "";
      const trv = [s.transform, rot].filter(Boolean).join(" ");
      const transform = trv ? ` transform="${trv}"` : "";
      const op = s.opacity !== 1 ? ` opacity="${s.opacity}"` : "";
      const blend = s.blend !== "normal" ? ` style="mix-blend-mode:${s.blend}"` : "";
      const stroke = s.stroke && s.stroke !== "transparent" ? ` stroke="${s.stroke}" stroke-width="${s.strokeWidth}"` : "";
      const fill = ` fill="${s.fill}"`;
      const extra = s.extraAttrs
        ? Object.entries(s.extraAttrs).map(([k, v]) => ` ${k}="${escapeAttr(v)}"`).join("")
        : "";
      switch (s.type) {
        case "rect": {
          const r = s as RectShape;
          return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.radius}"${fill}${stroke}${op}${blend}${extra}${transform}/>`;
        }
        case "ellipse":
          return `<ellipse cx="${s.x + s.w / 2}" cy="${s.y + s.h / 2}" rx="${s.w / 2}" ry="${s.h / 2}"${fill}${stroke}${op}${blend}${extra}${transform}/>`;
        case "line": {
          const l = s as LineShape;
          return `<line x1="${l.x}" y1="${l.y}" x2="${l.x2}" y2="${l.y2}"${stroke}${op}${blend}${extra}${transform}/>`;
        }
        case "text": {
          const t = s as TextShape;
          return `<text x="${t.x}" y="${t.y + t.fontSize}" font-size="${t.fontSize}" font-weight="${t.fontWeight}" font-family="Space Grotesk, Inter, system-ui"${fill}${op}${blend}${extra}${transform}>${escape(t.text)}</text>`;
        }
        case "path": {
          const p = s as PathShape;
          return `<path d="${p.d}"${fill}${stroke}${op}${blend}${extra}${transform}/>`;
        }
      }
    })
    .join("\n  ");

  const defsBlock = defs ? `\n  <defs>${defs}</defs>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defsBlock}
  <rect width="${w}" height="${h}" fill="${bg}"/>
  ${body}
</svg>`;
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function downloadText(filename: string, content: string, mime = "image/svg+xml") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
