import * as THREE from 'three';
import type { StoneParams } from '../types';
import { mulberry32, xfnv1a } from './rng';

const geometryCache = new Map<string, THREE.BufferGeometry>();

function taskRng(params: StoneParams, offset = 0): () => number {
  return mulberry32(xfnv1a(params.taskId) + offset);
}

export function geometryCacheKey(params: StoneParams): string {
  return [
    params.taskId,
    params.type,
    params.mass.toFixed(4),
    params.aspect.toFixed(4),
    params.complexity.toFixed(4),
  ].join('|');
}

function centerOnBase(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const cx = (box.max.x + box.min.x) / 2;
  const cz = (box.max.z + box.min.z) / 2;
  geo.translate(-cx, -box.min.y, -cz);
  return geo;
}

function applyComplexityNoise(
  geo: THREE.BufferGeometry,
  complexity: number,
  seed: number,
): void {
  if (complexity <= 0.05) return;
  const pos = geo.attributes.position;
  const rng = mulberry32(seed);
  const amp = complexity * 0.08;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n =
      Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 + seed) * amp +
      (rng() - 0.5) * amp * 0.5;
    pos.setY(i, y + n * (1 + Math.abs(y) * 0.2));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function buildSlab(params: StoneParams): THREE.BufferGeometry {
  const w = 0.9 * params.mass;
  const d = 0.7 * params.mass;
  const h = 0.25 * params.aspect * params.mass;
  const segments = Math.max(1, Math.floor(params.complexity * 3));
  return new THREE.BoxGeometry(w, h, d, segments, 1, segments);
}

function buildShard(params: StoneParams): THREE.BufferGeometry {
  const rng = taskRng(params, 11);
  const sides = 3 + Math.floor(rng() * 4);
  const radius = 0.45 * params.mass;
  const height = 0.6 * params.aspect * params.mass;
  const shape = new THREE.Shape();
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const r = radius * (0.85 + rng() * 0.3);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: params.complexity > 0.3,
    bevelThickness: 0.02 * params.complexity,
    bevelSize: 0.02 * params.complexity,
    bevelSegments: Math.max(1, Math.floor(params.complexity * 2)),
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function buildCore(params: StoneParams): THREE.BufferGeometry {
  const rng = taskRng(params, 23);
  const sides = 4 + Math.floor(rng() * 5);
  const radius = 0.35 * params.mass;
  const height = 0.55 * params.aspect * params.mass;
  const segments = Math.max(1, Math.floor(params.complexity * 4));
  return new THREE.CylinderGeometry(radius, radius * 0.92, height, sides, segments);
}

function buildNodule(params: StoneParams): THREE.BufferGeometry {
  const detail = Math.max(0, Math.floor(params.complexity * 2));
  const geo = new THREE.IcosahedronGeometry(0.38 * params.mass, detail);
  applyComplexityNoise(geo, params.complexity, xfnv1a(params.taskId));
  geo.scale(1, params.aspect * 0.85, 1);
  return geo;
}

function buildRawGeometry(params: StoneParams): THREE.BufferGeometry {
  switch (params.type) {
    case 'box':
    case 'wedge':
    case 'octahedron':
      return buildSlab(params);
    case 'roundCone':
      return buildShard(params);
    case 'cylinder':
      return buildCore(params);
    case 'capsule':
      return buildNodule(params);
    default:
      return buildCore(params);
  }
}

export function getGeometryHeight(geo: THREE.BufferGeometry): number {
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  return box.max.y - box.min.y;
}

export function getGeometryBounds(geo: THREE.BufferGeometry): THREE.Box3 {
  geo.computeBoundingBox();
  return geo.boundingBox!.clone();
}

export function buildGeometry(params: StoneParams): THREE.BufferGeometry {
  const key = geometryCacheKey(params);
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const geo = centerOnBase(buildRawGeometry(params));
  geometryCache.set(key, geo);
  return geo;
}

export function clearGeometryCache(): void {
  geometryCache.forEach((g) => g.dispose());
  geometryCache.clear();
}
