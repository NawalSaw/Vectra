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

export function pointsToPath(points: BezierPoint[]) {
  if (!points.length) return "";

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    d += `
      C
      ${prev.handleOut?.x ?? prev.x}
      ${prev.handleOut?.y ?? prev.y}
      ${curr.handleIn?.x ?? curr.x}
      ${curr.handleIn?.y ?? curr.y}
      ${curr.x}
      ${curr.y}
    `;
  }

  return d;
}