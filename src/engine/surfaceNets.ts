/**
 * SurfaceNets in JavaScript — vendored from isosurface (MIT)
 * https://github.com/mikolalysenko/isosurface
 */

export type SurfaceNetsResult = {
  positions: number[][];
  cells: number[][];
};

export type SurfaceNetsFn = (
  dims: [number, number, number],
  potential: (x: number, y: number, z: number) => number,
  bounds?: [[number, number, number], [number, number, number]],
) => SurfaceNetsResult;

const cubeEdges = new Int32Array(24);
const edgeTable = new Int32Array(256);

(function initTables() {
  let k = 0;
  for (let i = 0; i < 8; ++i) {
    for (let j = 1; j <= 4; j <<= 1) {
      const p = i ^ j;
      if (i <= p) {
        cubeEdges[k++] = i;
        cubeEdges[k++] = p;
      }
    }
  }

  for (let i = 0; i < 256; ++i) {
    let em = 0;
    for (let j = 0; j < 24; j += 2) {
      const a = !!(i & (1 << cubeEdges[j]));
      const b = !!(i & (1 << cubeEdges[j + 1]));
      em |= a !== b ? 1 << (j >> 1) : 0;
    }
    edgeTable[i] = em;
  }
})();

const buffer: number[] = new Array(4096).fill(0);

export const surfaceNets: SurfaceNetsFn = (dims, potential, bounds) => {
  if (!bounds) {
    bounds = [
      [0, 0, 0],
      [dims[0], dims[1], dims[2]],
    ];
  }

  const scale = [0, 0, 0];
  const shift = [0, 0, 0];
  for (let i = 0; i < 3; ++i) {
    scale[i] = (bounds[1][i] - bounds[0][i]) / dims[i];
    shift[i] = bounds[0][i];
  }

  const vertices: number[][] = [];
  const faces: number[][] = [];
  let n = 0;
  const x = [0, 0, 0];
  const R = [1, dims[0] + 1, (dims[0] + 1) * (dims[1] + 1)];
  const grid = [0, 0, 0, 0, 0, 0, 0, 0];
  let bufNo = 1;

  if (R[2] * 2 > buffer.length) {
    const ol = buffer.length;
    buffer.length = R[2] * 2;
    for (let i = ol; i < buffer.length; ++i) buffer[i] = 0;
  }

  for (x[2] = 0; x[2] < dims[2] - 1; ++x[2], (n += dims[0]), (bufNo ^= 1), (R[2] = -R[2])) {
    let m = 1 + (dims[0] + 1) * (1 + bufNo * (dims[1] + 1));

    for (x[1] = 0; x[1] < dims[1] - 1; ++x[1], ++n, (m += 2)) {
      for (x[0] = 0; x[0] < dims[0] - 1; ++x[0], ++n, ++m) {
        let mask = 0;
        let g = 0;
        for (let k = 0; k < 2; ++k) {
          for (let j = 0; j < 2; ++j) {
            for (let i = 0; i < 2; ++i, ++g) {
              const p = potential(
                scale[0] * (x[0] + i) + shift[0],
                scale[1] * (x[1] + j) + shift[1],
                scale[2] * (x[2] + k) + shift[2],
              );
              grid[g] = p;
              mask |= p < 0 ? 1 << g : 0;
            }
          }
        }

        if (mask === 0 || mask === 0xff) continue;

        const edgeMask = edgeTable[mask];
        const v = [0, 0, 0];
        let eCount = 0;

        for (let i = 0; i < 12; ++i) {
          if (!(edgeMask & (1 << i))) continue;
          ++eCount;

          const e0 = cubeEdges[i << 1];
          const e1 = cubeEdges[(i << 1) + 1];
          const g0 = grid[e0];
          const g1 = grid[e1];
          let t = g0 - g1;
          if (Math.abs(t) > 1e-6) {
            t = g0 / t;
          } else {
            continue;
          }

          for (let j = 0, bit = 1; j < 3; ++j, (bit <<= 1)) {
            const a = e0 & bit;
            const b = e1 & bit;
            if (a !== b) {
              v[j] += a ? 1.0 - t : t;
            } else {
              v[j] += a ? 1.0 : 0;
            }
          }
        }

        const s = 1.0 / eCount;
        for (let i = 0; i < 3; ++i) {
          v[i] = scale[i] * (x[i] + s * v[i]) + shift[i];
        }

        buffer[m] = vertices.length;
        vertices.push(v);

        for (let i = 0; i < 3; ++i) {
          if (!(edgeMask & (1 << i))) continue;

          const iu = (i + 1) % 3;
          const iv = (i + 2) % 3;

          if (x[iu] === 0 || x[iv] === 0) continue;

          const du = R[iu];
          const dv = R[iv];

          if (mask & 1) {
            faces.push([buffer[m], buffer[m - du], buffer[m - dv]]);
            faces.push([buffer[m - dv], buffer[m - du], buffer[m - du - dv]]);
          } else {
            faces.push([buffer[m], buffer[m - dv], buffer[m - du]]);
            faces.push([buffer[m - du], buffer[m - dv], buffer[m - du - dv]]);
          }
        }
      }
    }
  }

  return { positions: vertices, cells: faces };
};
