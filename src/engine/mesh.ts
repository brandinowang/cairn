import type { FieldFeatures, FieldPrimitive, MeshData, Vec3 } from '../types';
import {
  computeFieldBounds,
  defaultFeatures,
  structureField,
} from './field';
import { surfaceNets } from './surfaceNets';

const MIN_MESH_BLEND = 0.028;
const DEPOSIT_BLEND = 0.012;

function extractMesh(
  primitives: FieldPrimitive[],
  k: number,
  features: FieldFeatures,
  resolution: number,
  center = true,
): MeshData {
  const weldK = Math.max(k, MIN_MESH_BLEND);
  const field = structureField(primitives, weldK, features);
  const bounds = computeFieldBounds(primitives, weldK);
  const fn = (x: number, y: number, z: number) => field([x, y, z] as Vec3);

  const result = surfaceNets(
    [resolution, resolution, resolution],
    fn,
    bounds,
  );

  const positions = new Float32Array(result.positions.length * 3);
  for (let i = 0; i < result.positions.length; i++) {
    positions[i * 3] = result.positions[i][0];
    positions[i * 3 + 1] = result.positions[i][1];
    positions[i * 3 + 2] = result.positions[i][2];
  }

  const indices = new Uint32Array(result.cells.length * 3);
  for (let i = 0; i < result.cells.length; i++) {
    indices[i * 3] = result.cells[i][0];
    indices[i * 3 + 1] = result.cells[i][1];
    indices[i * 3 + 2] = result.cells[i][2];
  }

  if (positions.length === 0) {
    return { positions, indices, normals: new Float32Array(0) };
  }

  const normals = computeNormals(positions, indices);
  laplacianSmooth(positions, indices, 0);
  if (center) centerOnBase(positions);

  return { positions, indices, normals };
}

/** Single deposit block at its world position — sharp edges for visible add-on */
export function meshDepositBlock(
  prim: FieldPrimitive,
  features: FieldFeatures,
  resolution = 44,
): MeshData {
  return extractMesh([prim], DEPOSIT_BLEND, features, resolution, false);
}

export function meshField(
  primitives: FieldPrimitive[],
  k: number,
  features: FieldFeatures,
  resolution = 56,
): MeshData {
  if (primitives.length === 0) {
    return {
      positions: new Float32Array(0),
      indices: new Uint32Array(0),
      normals: new Float32Array(0),
    };
  }

  let data = extractMesh(primitives, k, features, resolution);

  if (data.positions.length === 0) {
    data = extractMesh(primitives, Math.max(k, 0.1), features, resolution + 6);
  }
  if (data.positions.length === 0) {
    data = extractMesh(primitives, 0.14, features, resolution + 12);
  }

  return data;
}

export function meshPrimitive(prim: FieldPrimitive, resolution = 36): MeshData {
  const positioned = { ...prim, position: [0, prim.mass * prim.aspect * 0.18, 0] as Vec3 };
  return meshField([positioned], 0.05, defaultFeatures('MONUMENT'), resolution);
}

function computeNormals(positions: Float32Array, indices: Uint32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 3;
    const ib = indices[i + 1] * 3;
    const ic = indices[i + 2] * 3;

    const ax = positions[ib] - positions[ia];
    const ay = positions[ib + 1] - positions[ia + 1];
    const az = positions[ib + 2] - positions[ia + 2];
    const bx = positions[ic] - positions[ia];
    const by = positions[ic + 1] - positions[ia + 1];
    const bz = positions[ic + 2] - positions[ia + 2];

    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    for (const j of [ia, ib, ic]) {
      normals[j] += nx;
      normals[j + 1] += ny;
      normals[j + 2] += nz;
    }
  }

  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= len;
    normals[i + 1] /= len;
    normals[i + 2] /= len;
  }

  return normals;
}

function laplacianSmooth(
  positions: Float32Array,
  indices: Uint32Array,
  passes: number,
): void {
  const vertCount = positions.length / 3;
  if (vertCount === 0) return;

  const neighbors: Set<number>[] = Array.from({ length: vertCount }, () => new Set());

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];
    neighbors[a].add(b).add(c);
    neighbors[b].add(a).add(c);
    neighbors[c].add(a).add(b);
  }

  const buf = new Float32Array(positions.length);

  for (let pass = 0; pass < passes; pass++) {
    for (let v = 0; v < vertCount; v++) {
      const nbs = neighbors[v];
      if (nbs.size === 0) continue;
      let sx = 0;
      let sy = 0;
      let sz = 0;
      for (const nb of nbs) {
        sx += positions[nb * 3];
        sy += positions[nb * 3 + 1];
        sz += positions[nb * 3 + 2];
      }
      buf[v * 3] = sx / nbs.size;
      buf[v * 3 + 1] = sy / nbs.size;
      buf[v * 3 + 2] = sz / nbs.size;
    }
    for (let v = 0; v < vertCount; v++) {
      positions[v * 3] = positions[v * 3] * 0.6 + buf[v * 3] * 0.4;
      positions[v * 3 + 1] = positions[v * 3 + 1] * 0.6 + buf[v * 3 + 1] * 0.4;
      positions[v * 3 + 2] = positions[v * 3 + 2] * 0.6 + buf[v * 3 + 2] * 0.4;
    }
  }
}

function centerOnBase(positions: Float32Array): void {
  const n = positions.length / 3;
  if (n === 0) return;

  let minY = Infinity;
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < n; i++) {
    minY = Math.min(minY, positions[i * 3 + 1]);
    cx += positions[i * 3];
    cz += positions[i * 3 + 2];
  }
  cx /= n;
  cz /= n;
  for (let i = 0; i < n; i++) {
    positions[i * 3] -= cx;
    positions[i * 3 + 1] -= minY;
    positions[i * 3 + 2] -= cz;
  }
}

export function estimateWallThickness(_data: MeshData): number {
  return 2.4;
}

export function estimateVolume(data: MeshData): number {
  let vol = 0;
  const p = data.positions;
  for (let i = 0; i < data.indices.length; i += 3) {
    const a = data.indices[i] * 3;
    const b = data.indices[i + 1] * 3;
    const c = data.indices[i + 2] * 3;
    vol += signedTetraVolume(
      [p[a], p[a + 1], p[a + 2]],
      [p[b], p[b + 1], p[b + 2]],
      [p[c], p[c + 1], p[c + 2]],
    );
  }
  return Math.abs(vol) * 1e6;
}

function signedTetraVolume(a: Vec3, b: Vec3, c: Vec3): number {
  return (
    (-c[1] * b[0] * a[2] +
      b[1] * c[0] * a[2] +
      c[1] * a[0] * b[2] -
      a[1] * c[0] * b[2] -
      b[1] * a[0] * c[2] +
      a[1] * b[0] * c[2]) /
    6
  );
}

export function meshDataToGeometry(data: MeshData): {
  positions: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
} {
  return data;
}
