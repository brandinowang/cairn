import type { Archetype, FieldFeatures, FieldPrimitive, Vec3 } from '../types';

// ── Tunable constants ──────────────────────────────────────────────
export const MIN_BLEND_K = 0.006;
export const MAX_BLEND_K = 0.38;
export const LIVE_BLEND_MIN = 0.006;
export const LIVE_BLEND_MAX = 0.48;

/** Weld strength — controlled by refine slider only, not task count */
export function computeBlendK(_taskCount: number, refineLevel: number): number {
  const t = Math.pow(Math.max(0, Math.min(1, refineLevel)), 0.82);
  return MIN_BLEND_K + t * (MAX_BLEND_K - MIN_BLEND_K);
}

/** Temporary weld swell when a task is first completed */
export function depositBlendBoost(): number {
  return 0;
}

/** Viewport live slider — dramatic sharp↔smooth for real-time preview */
export function blendFromLiveSmoothness(smoothness: number): number {
  const t = Math.max(0, Math.min(1, smoothness));
  return LIVE_BLEND_MIN + t * (LIVE_BLEND_MAX - LIVE_BLEND_MIN);
}

/** Viewport blend — live slider only */
export function resolveRenderBlendK(
  liveSmoothness: number,
  depositBoost = 0,
): number {
  return Math.min(blendFromLiveSmoothness(liveSmoothness) + depositBoost, 0.42);
}

/** Quadratic polynomial smooth-min — k controls fillet radius of the weld */
export function smin(a: number, b: number, k: number): number {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

export function smax(a: number, b: number, k: number): number {
  return -smin(-a, -b, k);
}

export function sdSphere(p: Vec3, r: number): number {
  return Math.hypot(p[0], p[1], p[2]) - r;
}

export function sdRoundBox(p: Vec3, halfExtents: Vec3, cornerRadius: number): number {
  const q: Vec3 = [
    Math.abs(p[0]) - halfExtents[0],
    Math.abs(p[1]) - halfExtents[1],
    Math.abs(p[2]) - halfExtents[2],
  ];
  const outside = Math.hypot(
    Math.max(q[0], 0),
    Math.max(q[1], 0),
    Math.max(q[2], 0),
  );
  const inside = Math.min(Math.max(q[0], Math.max(q[1], q[2])), 0);
  return outside + inside - cornerRadius;
}

export function sdVerticalCapsule(p: Vec3, halfHeight: number, r: number): number {
  const py = Math.abs(p[1]) - halfHeight;
  const q: Vec3 = [p[0], Math.max(py, 0), p[2]];
  return Math.hypot(q[0], q[1], q[2]) + Math.min(py, 0) - r;
}

export function sdCappedCylinder(p: Vec3, halfHeight: number, r: number): number {
  const d = Math.hypot(p[0], p[2]) - r;
  return Math.max(d, Math.abs(p[1]) - halfHeight);
}

export function sdRoundCone(p: Vec3, r1: number, _r2: number, h: number): number {
  const q = h * Math.hypot(p[0], p[2]) / Math.max(r1, 1e-6);
  return Math.max(q, Math.abs(p[1]) - h * 0.5);
}

/** L1-norm SDF — faceted diamond / crystal */
export function sdOctahedron(p: Vec3, r: number): number {
  return (Math.abs(p[0]) + Math.abs(p[1]) + Math.abs(p[2])) - r;
}

/** Elongated pyramid wedge */
export function sdWedge(p: Vec3, width: number, height: number, depth: number): number {
  const lp: Vec3 = [p[0] / width, p[1] / height, p[2] / depth];
  const d = Math.abs(lp[0]) + Math.abs(lp[1]) + Math.abs(lp[2]) - 1;
  return d * Math.min(width, height, depth);
}

export function opSmoothUnion(d1: number, d2: number, k: number): number {
  return smin(d1, d2, k);
}

export function opSubtract(d1: number, d2: number): number {
  return Math.max(d1, -d2);
}

export function opSmoothSubtract(d1: number, d2: number, k: number): number {
  return smax(d1, -d2, k);
}

export function opIntersect(d1: number, d2: number): number {
  return Math.max(d1, d2);
}

export function opMirrorX(p: Vec3): Vec3 {
  return [-p[0], p[1], p[2]];
}

function rotateYAround(p: Vec3, center: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = p[0] - center[0];
  const z = p[2] - center[2];
  return [x * c - z * s + center[0], p[1], x * s + z * c + center[2]];
}

export function evalPrimitive(p: Vec3, prim: FieldPrimitive): number {
  const angle = prim.rotationSeed * Math.PI * 2;
  const wp = rotateYAround(p, prim.position, -angle);
  const local: Vec3 = [
    wp[0] - prim.position[0],
    wp[1] - prim.position[1],
    wp[2] - prim.position[2],
  ];

  const s = prim.mass * 0.34;
  const h = s * prim.aspect;
  let d: number;

  switch (prim.type) {
    case 'box':
      d = sdRoundBox(local, [s * 1.08, h * 0.52, s * 0.92], prim.cornerRadius);
      break;
    case 'octahedron':
      d = sdOctahedron(local, s * (0.82 + h * 0.08));
      break;
    case 'wedge':
      d = sdWedge(local, s * 0.95, h * 0.55, s * 0.62);
      break;
    case 'roundBox':
      d = sdRoundBox(local, [s, h * 0.5, s * 0.85], prim.cornerRadius);
      break;
    case 'cylinder':
      d = sdCappedCylinder(local, h * 0.5, s * 0.75);
      break;
    case 'capsule':
      d = sdVerticalCapsule(local, h * 0.45, s * 0.65);
      break;
    case 'roundCone':
      d = sdRoundCone(local, s * 0.9, s * 0.35, h);
      break;
    default:
      d = sdRoundBox(local, [s, h * 0.5, s], prim.cornerRadius);
  }

  if (prim.complexity > 0.72) {
    const fin: Vec3 = [local[0] * 1.15, local[1] + h * 0.22, local[2] * 0.85];
    d = Math.min(d, sdOctahedron(fin, s * 0.22));
  }

  return d;
}

export interface PrimitiveExtents {
  rx: number;
  ry: number;
  rz: number;
}

/** Axis-aligned half-extents used for attachment placement */
export function getPrimitiveExtents(prim: FieldPrimitive): PrimitiveExtents {
  const s = prim.mass * 0.34;
  const h = s * prim.aspect;

  switch (prim.type) {
    case 'box':
      return { rx: s * 1.08, ry: h * 0.52, rz: s * 0.92 };
    case 'octahedron':
      return { rx: s * 0.78, ry: h * 0.55, rz: s * 0.78 };
    case 'wedge':
      return { rx: s * 0.95, ry: h * 0.55, rz: s * 0.62 };
    case 'roundBox':
      return { rx: s, ry: h * 0.5, rz: s * 0.85 };
    case 'cylinder':
      return { rx: s * 0.75, ry: h * 0.5, rz: s * 0.75 };
    case 'capsule':
      return { rx: s * 0.65, ry: h * 0.45, rz: s * 0.65 };
    case 'roundCone':
      return { rx: s * 0.9, ry: h * 0.5, rz: s * 0.9 };
    default:
      return { rx: s, ry: h * 0.5, rz: s };
  }
}

export function defaultFeatures(archetype: Archetype, _formSeed = 0): FieldFeatures {
  switch (archetype) {
    case 'HOLDER':
      return { flattenBase: true, boreRadius: 0.06, mirrorX: true, concavity: 0 };
    case 'VESSEL':
      return { flattenBase: true, boreRadius: 0.12, mirrorX: true, concavity: 0 };
    case 'HANDHELD':
      return { flattenBase: true, boreRadius: 0, mirrorX: false, concavity: 0 };
    case 'TRAY':
      return { flattenBase: true, boreRadius: 0, mirrorX: true, concavity: 0.08 };
    case 'MONUMENT':
    default:
      return { flattenBase: true, boreRadius: 0, mirrorX: true, concavity: 0 };
  }
}

export function structureField(
  primitives: FieldPrimitive[],
  k: number,
  features: FieldFeatures,
): (p: Vec3) => number {
  return (p: Vec3) => {
    if (primitives.length === 0) {
      return p[1] + 1;
    }

    let d = primitives.reduce(
      (acc, prim) => opSmoothUnion(acc, evalPrimitive(p, prim), k),
      Infinity,
    );

    if (features.mirrorX) {
      const mp = opMirrorX(p);
      const dm = primitives.reduce(
        (acc, prim) => opSmoothUnion(acc, evalPrimitive(mp, prim), k),
        Infinity,
      );
      d = smin(d, dm, k * 0.5);
    }

    if (features.flattenBase) {
      d = Math.max(d, -p[1]);
    }

    if (features.concavity > 0) {
      const bowl = sdSphere([p[0], p[1] + features.concavity * 0.5, p[2]], 0.55);
      d = opSmoothUnion(d, -bowl, k);
    }

    if (features.boreRadius > 0) {
      const bore = sdCappedCylinder(p, 1.2, features.boreRadius);
      d = opSmoothSubtract(d, bore, k * 0.6);
    }

    return d;
  };
}

export function computeFieldBounds(
  primitives: FieldPrimitive[],
  k: number,
): [[number, number, number], [number, number, number]] {
  if (primitives.length === 0) {
    return [[-0.5, 0, -0.5], [0.5, 0.5, 0.5]];
  }

  let minX = Infinity;
  let minY = 0;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const prim of primitives) {
    const e = getPrimitiveExtents(prim);
    const pad = Math.max(e.rx, e.ry, e.rz) + k * 2.5;
    minX = Math.min(minX, prim.position[0] - pad);
    maxX = Math.max(maxX, prim.position[0] + pad);
    minY = Math.min(minY, prim.position[1] - pad);
    maxY = Math.max(maxY, prim.position[1] + pad + e.ry);
    minZ = Math.min(minZ, prim.position[2] - pad);
    maxZ = Math.max(maxZ, prim.position[2] + pad);
  }

  const margin = k * 3 + 0.28;
  return [
    [minX - margin, -margin * 0.15, minZ - margin],
    [maxX + margin, maxY + margin, maxZ + margin],
  ];
}

export function fieldCacheKey(
  taskIds: string[],
  k: number,
  archetype: Archetype,
  resolved: Archetype | null,
): string {
  return `${taskIds.join(',')}|${k.toFixed(4)}|${archetype}|${resolved ?? ''}`;
}
