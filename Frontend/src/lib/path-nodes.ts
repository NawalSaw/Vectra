// Lightweight SVG path d parsing for node-edit support.
// Supports absolute commands M, L, H, V, C, S, Q, T, Z and a passthrough for everything else.

export interface PathCmd {
  type: string; // single letter, normalized to uppercase for editable types
  args: number[];
  raw?: string; // for unsupported commands, store the raw text
}

const CMD_RE = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;

export function parsePath(d: string): PathCmd[] {
  const out: PathCmd[] = [];
  let m: RegExpExecArray | null;
  let cx = 0, cy = 0, sx = 0, sy = 0;
  while ((m = CMD_RE.exec(d))) {
    const cmd = m[1];
    const nums = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => !isNaN(n));
    const isRel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === "Z") {
      out.push({ type: "Z", args: [] });
      cx = sx; cy = sy;
      continue;
    }
    // Determine arg-stride per command
    const stride: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7 };
    const k = stride[C] ?? nums.length;
    for (let i = 0; i < nums.length; i += k) {
      const chunk = nums.slice(i, i + k);
      let abs = chunk.slice();
      if (isRel) {
        if (C === "H") abs = [chunk[0] + cx];
        else if (C === "V") abs = [chunk[0] + cy];
        else {
          abs = chunk.map((v, idx) => (idx % 2 === 0 ? v + cx : v + cy));
        }
      }
      out.push({ type: C, args: abs });
      // Advance current point
      if (C === "H") cx = abs[0];
      else if (C === "V") cy = abs[0];
      else { cx = abs[abs.length - 2]; cy = abs[abs.length - 1]; }
      if (C === "M" && i === 0) { sx = cx; sy = cy; }
      // Implicit lineto after M
      // (handled by remaining nums in loop)
    }
  }
  return out;
}

export function serializePath(cmds: PathCmd[]): string {
  return cmds.map((c) => c.type === "Z" ? "Z" : `${c.type} ${c.args.map((n) => round(n)).join(" ")}`).join(" ");
}

const round = (n: number) => Math.round(n * 100) / 100;

export interface PathAnchor {
  cmdIndex: number;

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

export function getAnchors(
  cmds: PathCmd[]
): PathAnchor[] {
  const out: PathAnchor[] = [];

  let cx = 0;
  let cy = 0;

  cmds.forEach((c, i) => {
    switch (c.type) {
      case "M":
      case "L":
      case "T": {
        const x = c.args[c.args.length - 2];
        const y = c.args[c.args.length - 1];

        out.push({
          cmdIndex: i,
          x,
          y,
        });

        cx = x;
        cy = y;
        break;
      }

      case "C": {
        const [x1, y1, x2, y2, x, y] = c.args;

        out.push({
          cmdIndex: i,
          x,
          y,

          handleIn: {
            x: x2,
            y: y2,
          },
        });

        cx = x;
        cy = y;
        break;
      }

      case "Q": {
        const [hx, hy, x, y] = c.args;

        out.push({
          cmdIndex: i,
          x,
          y,

          handleIn: {
            x: hx,
            y: hy,
          },
        });

        cx = x;
        cy = y;
        break;
      }

      case "H":
        out.push({
          cmdIndex: i,
          x: c.args[0],
          y: cy,
        });

        cx = c.args[0];
        break;

      case "V":
        out.push({
          cmdIndex: i,
          x: cx,
          y: c.args[0],
        });

        cy = c.args[0];
        break;
    }
  });

  return out;
}

// Move an anchor by delta and rewrite the cmd; returns new cmds list.
export function moveAnchor(cmds: PathCmd[], cmdIndex: number, nx: number, ny: number): PathCmd[] {
  return cmds.map((c, i) => {
    if (i !== cmdIndex) return c;
    const args = c.args.slice();
    if (c.type === "Z") return c;
    if (c.type === "H") args[0] = nx;
    else if (c.type === "V") args[0] = ny;
    else {
      args[args.length - 2] = nx;
      args[args.length - 1] = ny;
    }
    return { ...c, args };
  });
}

export function moveHandle(
  cmds: PathCmd[],
  cmdIndex: number,
  handle: "in" | "out",
  nx: number,
  ny: number
): PathCmd[] {
  return cmds.map((c, i) => {
    if (i !== cmdIndex)
      return c;

    const args = [...c.args];

    if (c.type === "C") {
      if (handle === "in") {
        args[2] = nx;
        args[3] = ny;
      } else {
        args[0] = nx;
        args[1] = ny;
      }
    }

    if (c.type === "Q") {
      args[0] = nx;
      args[1] = ny;
    }

    return {
      ...c,
      args,
    };
  });
}