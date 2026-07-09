import { Delaunay } from 'd3-delaunay';
import * as THREE from 'three';
import type { Category, FieldPrimitive, Task, VoronoiCell, VoronoiStructure } from '../types';
import { taskToPrimitive } from './mapping';
import { mulberry32 } from './rng';
import { buildSerial, getCompletedTasks } from './structure';

export const VORONOI_DISC_RADIUS = 1.35;
export const VORONOI_BASE_HEIGHT = 0.15;

export function buildVoronoiStructure(
  tasks: Task[],
  categories: Category[],
): VoronoiStructure {
  const completed = getCompletedTasks(tasks);
  const serial = buildSerial(completed);

  if (completed.length === 0) {
    return { cells: [], serial, radius: VORONOI_DISC_RADIUS };
  }

  const points: [number, number][] = [];
  const meta: { params: FieldPrimitive; height: number }[] = [];

  for (const task of completed) {
    const category = categories.find((c) => c.id === task.categoryId) ?? null;
    const params = taskToPrimitive(task, category);
    const rng = mulberry32(task.seed);
    const angle = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * VORONOI_DISC_RADIUS;
    points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
    meta.push({
      params,
      height: Math.max(VORONOI_BASE_HEIGHT, params.mass * params.aspect * 0.35),
    });
  }

  const bounds = VORONOI_DISC_RADIUS * 1.2;
  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi([-bounds, -bounds, bounds, bounds]);

  const cells: VoronoiCell[] = [];
  for (let i = 0; i < points.length; i++) {
    const polygon = voronoi.cellPolygon(i);
    if (!polygon || polygon.length < 3) continue;
    const ring: [number, number][] = polygon.map((p: [number, number]) => [p[0], p[1]]);
    const [cx, cz] = points[i];
    cells.push({
      params: meta[i].params,
      position: [cx, meta[i].height / 2, cz],
      height: meta[i].height,
      polygon: ring,
    });
  }

  return { cells, serial, radius: VORONOI_DISC_RADIUS };
}

export function buildVoronoiCellGeometry(cell: VoronoiCell): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  cell.polygon.forEach(([x, z], i) => {
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();
  const height = cell.height;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  geo.translate(-(box.max.x + box.min.x) / 2, -box.min.y, -(box.max.z + box.min.z) / 2);
  return geo;
}
