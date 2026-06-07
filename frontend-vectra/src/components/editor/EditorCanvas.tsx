import { useEditor, type Shape, type RectShape, type EllipseShape, type LineShape, type TextShape, type PathShape, type Guide, newId } from "@/lib/editor-store";
import { parsePath, serializePath, getAnchors, moveAnchor, moveHandle } from "@/lib/path-nodes";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

interface Props {
  width: number;
  height: number;
}

export function EditorCanvas({ width, height }: Props) {
  const {
    shapes, selectedIds, tool, zoom, pan, showGrid, snap,
    canvasW, canvasH, bg, defs, guides, nodeEditId, activeGroupId,
    setPan, setZoom, select, addShape, updateShape, pushHistory, setTool,
    setGuides, setNodeEditId, setActiveGroupId,
  } = useEditor();

  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<null | {
    mode: "pan" | "create" | "move" | "resize" | "marquee" | "node" | "handle";
    startX: number; startY: number;
    handle?: string;
    initial?: Shape[];
    tempId?: string;
    nodeIdx?: number;
    initialPath?: string;
    marquee?: { x: number; y: number; w: number; h: number };
  }>(null);

  // Pen tool: in-progress polyline points
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([]);
  const [penHover, setPenHover] = useState<{ x: number; y: number } | null>(null);

  // viewport -> world
  const toWorld = useCallback((cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: (cx - r.left - pan.x) / zoom,
      y: (cy - r.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const snapVal = (v: number) => (snap ? Math.round(v / 8) * 8 : v);

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      const newZoom = Math.max(0.1, Math.min(8, zoom * (1 + delta)));
      const r = svgRef.current!.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const wx = (cx - pan.x) / zoom;
      const wy = (cy - pan.y) / zoom;
      setPan({ x: cx - wx * newZoom, y: cy - wy * newZoom });
      setZoom(newZoom);
    } else {
      setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const w = toWorld(e.clientX, e.clientY);
    const handle = (e.target as HTMLElement).dataset?.handle;
    const shapeIdAttr = (e.target as HTMLElement).dataset?.shapeId;
    const nodeIdxAttr = (e.target as HTMLElement).dataset?.nodeIdx;
    const handleType =(e.target as HTMLElement).dataset?.handleType;


    if (tool === "hand" || e.button === 1 || e.altKey) {
      setDrag({ mode: "pan", startX: e.clientX - pan.x, startY: e.clientY - pan.y });
      return;
    }

    // Pen tool: click to add anchor
    if (tool === "pen") {
      pushHistory();
      setPenPoints((pts) => [...pts, { x: snapVal(w.x), y: snapVal(w.y) }]);
      return;
    }

    // Pencil tool: start freehand drawing
    if (tool === "pencil") {
      pushHistory();
      const id = newId();
      const sh: PathShape = {
        id, type: "path", name: `Sketch ${shapes.length + 1}`,
        x: w.x, y: w.y, w: 0, h: 0, rotation: 0,
        d: `M ${w.x} ${w.y}`,
        fill: "transparent",
        stroke: "oklch(0.78 0.18 195)", strokeWidth: 2,
        opacity: 1, blend: "normal", visible: true, locked: false,
        points: [],
      };
      addShape(sh);
      setDrag({ mode: "create", startX: w.x, startY: w.y, tempId: id, initialPath: `M ${w.x} ${w.y}` });
      return;
    }

    if (
  handleType &&
  nodeIdxAttr &&
  nodeEditId
) {
  const sh = shapes.find(
    (s) => s.id === nodeEditId
  ) as PathShape;

  setDrag({
    mode: "handle",
    startX: w.x,
    startY: w.y,
    nodeIdx: Number(nodeIdxAttr),
    tempId: nodeEditId,
    handle: handleType,
    initialPath: sh.d,
  });

  return;
}

    // Node-edit drag
    if (nodeIdxAttr && nodeEditId) {
      const sh = shapes.find((s) => s.id === nodeEditId) as PathShape | undefined;
      if (sh) {
        pushHistory();
        setDrag({
          mode: "node",
          startX: w.x, startY: w.y,
          nodeIdx: Number(nodeIdxAttr),
          tempId: nodeEditId,
          initialPath: sh.d,
        });
        return;
      }
    }

    if (tool === "select") {
      if (handle && selectedIds.length) {
        pushHistory();
        setDrag({
          mode: "resize",
          startX: w.x, startY: w.y, handle,
          initial: shapes.filter((s) => selectedIds.includes(s.id)).map((s) => ({ ...s })),
        });
        return;
      }
      if (shapeIdAttr) {
        const sh = shapes.find((s) => s.id === shapeIdAttr);
        if (sh && !sh.locked) {
          // Expand to include groupmates
          let ids: string[];
          if (selectedIds.includes(shapeIdAttr)) {
            ids = selectedIds;
          } else {
            const base = e.shiftKey ? [...selectedIds, shapeIdAttr] : [shapeIdAttr];
            const groups = new Set<string>();
            base.forEach((id) => {
              const x = shapes.find((s) => s.id === id);
              if (x?.groupId) groups.add(x.groupId);
            });
            ids = groups.size
              ? Array.from(new Set([...base, ...shapes.filter((s) => s.groupId && groups.has(s.groupId)).map((s) => s.id)]))
              : base;
            select(ids);
          }
          pushHistory();
          setDrag({
            mode: "move",
            startX: w.x, startY: w.y,
            initial: shapes.filter((s) => ids.includes(s.id)).map((s) => ({ ...s })),
          });
          return;
        }
      }
      // marquee
      if (!e.shiftKey) select([]);
      setNodeEditId(null);
      if (activeGroupId) setActiveGroupId(null);
      setDrag({ mode: "marquee", startX: w.x, startY: w.y, marquee: { x: w.x, y: w.y, w: 0, h: 0 } });
      return;
    }

    if (["rect", "ellipse", "line", "text"].includes(tool)) {
      const id = newId();
      let s: Shape;
      const base = {
        id, name: `${tool[0].toUpperCase() + tool.slice(1)} ${shapes.length + 1}`,
        x: snapVal(w.x), y: snapVal(w.y), w: 0, h: 0, rotation: 0,
        fill: tool === "line" ? "transparent" : "oklch(0.78 0.18 195)",
        stroke: tool === "line" ? "oklch(0.97 0.01 270)" : "transparent",
        strokeWidth: tool === "line" ? 2 : 0,
        opacity: 1, blend: "normal" as const, visible: true, locked: false,
      };
      if (tool === "rect") s = { ...base, type: "rect", radius: 8 } as RectShape;
      else if (tool === "ellipse") s = { ...base, type: "ellipse" } as EllipseShape;
      else if (tool === "line") s = { ...base, type: "line", x2: base.x, y2: base.y } as LineShape;
      else s = { ...base, type: "text", text: "Type here", fontSize: 32, fontWeight: 600, w: 240, h: 40 } as TextShape;
      addShape(s);
      setDrag({ mode: "create", startX: w.x, startY: w.y, tempId: id });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    if (drag.mode === "pan") {
      setPan({ x: e.clientX - drag.startX, y: e.clientY - drag.startY });
      return;
    }
    const w = toWorld(e.clientX, e.clientY);

    if (
  drag.mode === "handle" &&
  drag.tempId &&
  drag.nodeIdx != null &&
  drag.initialPath
) {
  const cmds = parsePath(
    drag.initialPath
  );

  const next = moveHandle(
    cmds,
    editingAnchors[drag.nodeIdx].cmdIndex,
    drag.handle as "in" | "out",
    w.x,
    w.y
  );

  updateShape(
    drag.tempId,
    {
      d: serializePath(next),
    } as Partial<PathShape>
  );

  return;
}

    if (drag.mode === "create" && drag.tempId) {
      const dx = w.x - drag.startX;
      const dy = w.y - drag.startY;
      const sh = shapes.find((s) => s.id === drag.tempId);
      if (!sh) return;
      if (sh.type === "line") {
        updateShape(sh.id, { x2: snapVal(w.x), y2: snapVal(w.y) } as Partial<LineShape>);
      } else if (sh.type === "path") {
        const p = sh as PathShape;
        const newD = p.d + ` L ${w.x.toFixed(1)} ${w.y.toFixed(1)}`;
        updateShape(sh.id, { d: newD } as Partial<PathShape>);
      } else {
        updateShape(sh.id, {
          x: snapVal(Math.min(drag.startX, w.x)),
          y: snapVal(Math.min(drag.startY, w.y)),
          w: Math.abs(dx),
          h: Math.abs(dy),
        });
      }
      return;
    }

    if (drag.mode === "node" && drag.tempId && drag.initialPath != null && drag.nodeIdx != null) {
      const sh = shapes.find((s) => s.id === drag.tempId) as PathShape | undefined;
      if (!sh) return;
      const cmds = parsePath(drag.initialPath);
      const anchors = getAnchors(cmds);
      const a = anchors[drag.nodeIdx];
      if (!a) return;
      const dx = w.x - drag.startX;
      const dy = w.y - drag.startY;
      const next = moveAnchor(cmds, a.cmdIndex, snapVal(a.x + dx), snapVal(a.y + dy));
      updateShape(sh.id, { d: serializePath(next) } as Partial<PathShape>);
      return;
    }

    if (drag.mode === "move" && drag.initial) {
      const rawDx = w.x - drag.startX;
      const rawDy = w.y - drag.startY;
      const others = shapes.filter((s) => !drag.initial!.find((i) => i.id === s.id));
      const moving = drag.initial.map((s) => ({ ...s, x: s.x + rawDx, y: s.y + rawDy }));
      const { dx: sdx, dy: sdy, gs } = computeSnap(moving, others, canvasW, canvasH, 8 / zoom);
      const dx = rawDx + sdx;
      const dy = rawDy + sdy;
      drag.initial.forEach((s) => {
        updateShape(s.id, { x: snapVal(s.x + dx), y: snapVal(s.y + dy) });
      });
      setGuides(gs);
      return;
    }

    if (drag.mode === "resize" && drag.initial && drag.handle) {
      const dx = w.x - drag.startX;
      const dy = w.y - drag.startY;
      drag.initial.forEach((s) => {
        let nx = s.x, ny = s.y, nw = s.w, nh = s.h;
        if (drag.handle!.includes("e")) nw = Math.max(4, s.w + dx);
        if (drag.handle!.includes("s")) nh = Math.max(4, s.h + dy);
        if (drag.handle!.includes("w")) { nx = s.x + dx; nw = Math.max(4, s.w - dx); }
        if (drag.handle!.includes("n")) { ny = s.y + dy; nh = Math.max(4, s.h - dy); }
        updateShape(s.id, { x: snapVal(nx), y: snapVal(ny), w: nw, h: nh });
      });
      return;
    }

    if (drag.mode === "marquee") {
      setDrag({
        ...drag,
        marquee: {
          x: Math.min(drag.startX, w.x),
          y: Math.min(drag.startY, w.y),
          w: Math.abs(w.x - drag.startX),
          h: Math.abs(w.y - drag.startY),
        },
      });
    }
  };

  const onPointerUp = () => {
    if (drag?.mode === "marquee" && drag.marquee && drag.marquee.w > 4 && drag.marquee.h > 4) {
      const m = drag.marquee;
      const ids = shapes
        .filter((s) => s.x >= m.x && s.y >= m.y && s.x + s.w <= m.x + m.w && s.y + s.h <= m.y + m.h)
        .map((s) => s.id);
      select(ids);
    }
    if (drag?.mode === "create" && drag.tempId) {
      const sh = shapes.find((s) => s.id === drag.tempId);
      if (sh?.type === "path") {
        const anchors = getAnchors(parsePath((sh as PathShape).d));
        if (anchors.length >= 2) {
          const minX = Math.min(...anchors.map((a) => a.x));
          const minY = Math.min(...anchors.map((a) => a.y));
          const maxX = Math.max(...anchors.map((a) => a.x));
          const maxY = Math.max(...anchors.map((a) => a.y));
          updateShape(sh.id, { x: minX, y: minY, w: maxX - minX, h: maxY - minY });
        }
      }
      setTool("select");
    }
    if (drag?.mode === "move" || drag?.mode === "node") setGuides([]);
    setDrag(null);
  };

  const finalizePen = useCallback((close: boolean) => {
    if (penPoints.length < 2) { setPenPoints([]); setPenHover(null); return; }
    const xs = penPoints.map((p) => p.x);
    const ys = penPoints.map((p) => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const maxX = Math.max(...xs), maxY = Math.max(...ys);
    const d = penPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + (close ? " Z" : "");
    const sh: PathShape = {
      id: newId(), type: "path", name: `Path ${shapes.length + 1}`,
      x: minX, y: minY, w: maxX - minX, h: maxY - minY,
      d, rotation: 0,
      fill: close ? "oklch(0.78 0.18 195 / 0.4)" : "transparent",
      stroke: "oklch(0.78 0.18 195)", strokeWidth: 2,
      opacity: 1, blend: "normal", visible: true, locked: false,
      points: [],
    };
    addShape(sh);
    setPenPoints([]); setPenHover(null);
    setTool("select");
  }, [penPoints, shapes.length, addShape, setTool]);

  // Pen tool: keyboard finalize
  useEffect(() => {
    if (tool !== "pen") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); finalizePen(false); }
      if (e.key === "Escape") { e.preventDefault(); setPenPoints([]); setPenHover(null); setTool("select"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, finalizePen, setTool]);

  // Track pen hover position for preview
  const onMouseMoveSvg = (e: React.MouseEvent) => {
    if (tool === "pen" && penPoints.length) {
      const w = toWorld(e.clientX, e.clientY);
      setPenHover({ x: snapVal(w.x), y: snapVal(w.y) });
    }
  };

  // Double-click on a path → enter node-edit mode
  // Double-click to enter group / edit nodes
  const onDoubleClick = (e: React.MouseEvent) => {
    const id = (e.target as HTMLElement).dataset?.shapeId;
    if (!id) {
      if (activeGroupId) setActiveGroupId(null);
      return;
    }
    const sh = shapes.find((s) => s.id === id);
    if (sh?.groupId && sh.groupId !== activeGroupId) {
      setActiveGroupId(sh.groupId);
      select([id]);
      return;
    }
    if (sh?.type === "path") {
      setNodeEditId(id);
      select([id]);
    } else if (tool === "pen" && penPoints.length >= 2) {
      finalizePen(false);
    }
  };

  const selBounds = useMemo(() => {
    const sel = shapes.filter((s) => selectedIds.includes(s.id));
    if (!sel.length) return null;
    const x = Math.min(...sel.map((s) => s.x));
    const y = Math.min(...sel.map((s) => s.y));
    const x2 = Math.max(...sel.map((s) => s.x + s.w));
    const y2 = Math.max(...sel.map((s) => s.y + s.h));
    return { x, y, w: x2 - x, h: y2 - y };
  }, [shapes, selectedIds]);

  const editingPath = nodeEditId ? (shapes.find((s) => s.id === nodeEditId) as PathShape | undefined) : undefined;
  const editingAnchors = useMemo(() => (editingPath ? getAnchors(parsePath(editingPath.d)) : []), [editingPath]);

  const anchorOffset = useMemo(() => {
  if (!editingPath) return { dx: 0, dy: 0 };

  const anchors = getAnchors(
    parsePath(editingPath.d)
  );

  if (!anchors.length)
    return { dx: 0, dy: 0 };

  const minX = Math.min(
    ...anchors.map((a) => a.x)
  );

  const minY = Math.min(
    ...anchors.map((a) => a.y)
  );

  return {
    dx: editingPath.x - minX,
    dy: editingPath.y - minY,
  };
}, [editingPath]);
  return (
    <svg
      ref={svgRef}
      className="block h-full w-full cursor-default touch-none select-none"
      width={width}
      height={height}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => { onPointerMove(e); onMouseMoveSvg(e); }}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
      style={{ cursor: tool === "hand" ? "grab" : tool === "select" ? "default" : "crosshair" }}
    >
      <defs>
        <pattern id="ed-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth="1" />
        </pattern>
        <pattern id="ed-grid-major" width="160" height="160" patternUnits="userSpaceOnUse">
          <path d="M 160 0 L 0 0 0 160" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="1" />
        </pattern>
        <filter id="art-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="20" stdDeviation="20" floodColor="oklch(0 0 0 / 0.4)" />
        </filter>
      </defs>
      {defs && <defs dangerouslySetInnerHTML={{ __html: defs }} />}

      <rect width="100%" height="100%" fill="oklch(0.13 0.02 270)" />
      {showGrid && (
        <>
          <rect width="100%" height="100%" fill="url(#ed-grid)" />
          <rect width="100%" height="100%" fill="url(#ed-grid-major)" />
        </>
      )}

      <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
        {/* artboard */}
        <rect x={0} y={0} width={canvasW} height={canvasH} fill={bg} filter="url(#art-shadow)" rx={8} />
        <rect x={0} y={0} width={canvasW} height={canvasH} fill="none" stroke="oklch(1 0 0 / 0.08)" />

        {shapes.map((s) => s.visible && <ShapeNode key={s.id} shape={s} />)}

        {/* selection */}
        {selBounds && (
          <g pointerEvents="none">
            <rect
              x={selBounds.x - 1 / zoom}
              y={selBounds.y - 1 / zoom}
              width={selBounds.w + 2 / zoom}
              height={selBounds.h + 2 / zoom}
              fill="none"
              stroke="oklch(0.78 0.18 195)"
              strokeWidth={1.5 / zoom}
            />
            {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((h) => {
              const cx =
                selBounds.x + (h.includes("w") ? 0 : h.includes("e") ? selBounds.w : selBounds.w / 2);
              const cy =
                selBounds.y + (h.includes("n") ? 0 : h.includes("s") ? selBounds.h : selBounds.h / 2);
              const sz = 8 / zoom;
              return (
                <rect
                  key={h}
                  x={cx - sz / 2}
                  y={cy - sz / 2}
                  width={sz}
                  height={sz}
                  fill="oklch(0.18 0.02 270)"
                  stroke="oklch(0.78 0.18 195)"
                  strokeWidth={1.5 / zoom}
                  data-handle={h}
                  pointerEvents="all"
                  style={{ cursor: `${h}-resize` }}
                />
              );
            })}
          </g>
        )}

        {/* marquee */}
        {drag?.mode === "marquee" && drag.marquee && (
          <rect
            x={drag.marquee.x}
            y={drag.marquee.y}
            width={drag.marquee.w}
            height={drag.marquee.h}
            fill="oklch(0.78 0.18 195 / 0.1)"
            stroke="oklch(0.78 0.18 195)"
            strokeDasharray="4 3"
            strokeWidth={1 / zoom}
            pointerEvents="none"
          />
        )}

        {/* smart guides */}
        {guides.map((g, i) => (
          <line
            key={i}
            x1={g.axis === "v" ? g.pos : g.from}
            y1={g.axis === "v" ? g.from : g.pos}
            x2={g.axis === "v" ? g.pos : g.to}
            y2={g.axis === "v" ? g.to : g.pos}
            stroke="oklch(0.78 0.6 0)"
            strokeWidth={1 / zoom}
            strokeDasharray={`${4 / zoom} ${3 / zoom}`}
            pointerEvents="none"
          />
        ))}

        {/* pen preview */}
        {tool === "pen" && penPoints.length > 0 && (
          <g pointerEvents="none">
            <path
              d={penPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
                (penHover ? ` L ${penHover.x} ${penHover.y}` : "")}
              fill="none"
              stroke="oklch(0.78 0.18 195)"
              strokeWidth={1.5 / zoom}
              strokeDasharray={`${4 / zoom} ${3 / zoom}`}
            />
            {penPoints.map((p, i) => (
              <rect key={i} x={p.x - 4 / zoom} y={p.y - 4 / zoom} width={8 / zoom} height={8 / zoom}
                fill="oklch(0.18 0.02 270)" stroke="oklch(0.78 0.18 195)" strokeWidth={1.5 / zoom} />
            ))}
          </g>
        )}

      {editingPath &&
  editingAnchors.map((a, i) => (
    <g key={i}>
      {a.handleIn && (
        <>
          <line
            x1={a.x + anchorOffset.dx}
            y1={a.y + anchorOffset.dy}
            x2={a.handleIn.x + anchorOffset.dx}
      y2={a.handleIn.y + anchorOffset.dy}
            stroke="white"
            strokeWidth={1 / zoom}
          />

          <circle
            cx={a.handleIn.x}
            cy={a.handleIn.y}
            r={4 / zoom}
            fill="white"
            data-node-idx={i}
            data-handle-type="in"
          />
        </>
      )}

      <circle
       cx={a.x + anchorOffset.dx}
cy={a.y + anchorOffset.dy}
        r={5 / zoom}
        fill="oklch(0.18 0.02 270)"
        stroke="oklch(0.65 0.25 320)"
        strokeWidth={1.5 / zoom}
        data-node-idx={i}
      />
    </g>
))}
        {editingPath && editingAnchors.map((a, i) => (
          <circle
            key={i}
            cx={a.x + anchorOffset.dx}
            cy={a.y + anchorOffset.dy}
            r={5 / zoom}
            fill="oklch(0.18 0.02 270)"
            stroke="oklch(0.65 0.25 320)"
            strokeWidth={1.5 / zoom}
            data-node-idx={i}
            style={{ cursor: "move" }}
          />
        ))}
      </g>
    </svg>
  );
}

// Compute snap delta + visible guide segments while moving shapes.
function computeSnap(
  moving: { id: string; x: number; y: number; w: number; h: number }[],
  others: { id: string; x: number; y: number; w: number; h: number }[],
  canvasW: number,
  canvasH: number,
  threshold: number,
): { dx: number; dy: number; gs: Guide[] } {
  if (!moving.length) return { dx: 0, dy: 0, gs: [] };
  const bx = Math.min(...moving.map((s) => s.x));
  const by = Math.min(...moving.map((s) => s.y));
  const bw = Math.max(...moving.map((s) => s.x + s.w)) - bx;
  const bh = Math.max(...moving.map((s) => s.y + s.h)) - by;

  const vTargets: number[] = [0, canvasW / 2, canvasW];
  const hTargets: number[] = [0, canvasH / 2, canvasH];
  others.forEach((o) => {
    vTargets.push(o.x, o.x + o.w / 2, o.x + o.w);
    hTargets.push(o.y, o.y + o.h / 2, o.y + o.h);
  });
  const myV = [bx, bx + bw / 2, bx + bw];
  const myH = [by, by + bh / 2, by + bh];

  let bestDx = 0, bestDxAbs = Infinity, bestDxPos = 0;
  myV.forEach((v) => {
    vTargets.forEach((t) => {
      const d = t - v;
      if (Math.abs(d) < bestDxAbs && Math.abs(d) < threshold) {
        bestDxAbs = Math.abs(d); bestDx = d; bestDxPos = t;
      }
    });
  });
  let bestDy = 0, bestDyAbs = Infinity, bestDyPos = 0;
  myH.forEach((v) => {
    hTargets.forEach((t) => {
      const d = t - v;
      if (Math.abs(d) < bestDyAbs && Math.abs(d) < threshold) {
        bestDyAbs = Math.abs(d); bestDy = d; bestDyPos = t;
      }
    });
  });

  const gs: Guide[] = [];
  if (bestDxAbs < Infinity) gs.push({ axis: "v", pos: bestDxPos, from: -2000, to: canvasH + 2000 });
  if (bestDyAbs < Infinity) gs.push({ axis: "h", pos: bestDyPos, from: -2000, to: canvasW + 2000 });
  return { dx: bestDx, dy: bestDy, gs };
}

function ShapeNode({ shape }: { shape: Shape }) {
  const rot = shape.rotation
    ? `rotate(${shape.rotation} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})`
    : "";
  const tr = [shape.transform, rot].filter(Boolean).join(" ") || undefined;
  const common = {
    "data-shape-id": shape.id,
    opacity: shape.opacity,
    transform: tr,
    style: { mixBlendMode: shape.blend as React.CSSProperties["mixBlendMode"] },
    ...(shape.extraAttrs || {}),
  } as Record<string, unknown>;

  if (shape.type === "rect") {
    return (
      <rect
        {...common}
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        rx={(shape as RectShape).radius}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
      />
    );
  }
  if (shape.type === "ellipse") {
    return (
      <ellipse
        {...common}
        cx={shape.x + shape.w / 2}
        cy={shape.y + shape.h / 2}
        rx={shape.w / 2}
        ry={shape.h / 2}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
      />
    );
  }
  if (shape.type === "line") {
    const l = shape as LineShape;
    return (
      <line
        {...common}
        x1={l.x}
        y1={l.y}
        x2={l.x2}
        y2={l.y2}
        stroke={l.stroke}
        strokeWidth={l.strokeWidth}
        strokeLinecap="round"
      />
    );
  }
  if (shape.type === "text") {
    const t = shape as TextShape;
    return (
      <text
        {...common}
        x={t.x}
        y={t.y + t.fontSize}
        fill={t.fill}
        fontSize={t.fontSize}
        fontWeight={t.fontWeight}
        fontFamily="Space Grotesk, Inter, system-ui"
      >
        {t.text}
      </text>
    );
  }
  if (shape.type === "path") {
    const p = shape as PathShape;
    const anchors = getAnchors(parsePath(p.d));
    const minX = anchors.length ? Math.min(...anchors.map((a) => a.x)) : 0;
    const minY = anchors.length ? Math.min(...anchors.map((a) => a.y)) : 0;
    const dx = p.x - minX;
    const dy = p.y - minY;
    const baseT = (dx || dy) ? `translate(${dx} ${dy})` : "";
    const tr2 = [shape.transform, baseT, rot].filter(Boolean).join(" ") || undefined;
    return (
      <path
        {...common}
        transform={tr2}
        d={p.d}
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth}
      />
    );
  }
  return null;
}
