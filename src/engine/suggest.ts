import * as THREE from 'three';
import type { StoneParams } from '../types';

// ── Tunable constants ──────────────────────────────────────────────
const UNIT_TO_MM = 10;
const SMALL_VOLUME_THRESHOLD = 8000; // mm³
const TALL_RATIO = 2.4;
const FLAT_RATIO = 0.35;

export function suggestObject(params: StoneParams, geo: THREE.BufferGeometry): string {
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const w = (box.max.x - box.min.x) * UNIT_TO_MM;
  const h = (box.max.y - box.min.y) * UNIT_TO_MM;
  const d = (box.max.z - box.min.z) * UNIT_TO_MM;
  const footprint = Math.max(w, d);
  const V = w * h * d;

  if (h / footprint > TALL_RATIO && footprint < 40) {
    return 'Incense holder / taper stand / pen vessel';
  }
  if (Math.abs(w - h) < w * 0.3 && Math.abs(w - d) < w * 0.3 && V < SMALL_VOLUME_THRESHOLD) {
    return 'USB drive / keycap / cufflink / worry object';
  }
  if (h / footprint < FLAT_RATIO) {
    return 'Coaster / catch tray / trivet';
  }
  if (V > 15000 && h > footprint * 0.8 && params.complexity < 0.7) {
    return 'Vessel / cup / vase';
  }
  if (V > 12000 && params.complexity >= 0.6) {
    return 'Sculptural object / bookend / paperweight';
  }
  return 'Desk object — form TBD';
}

/** Seam for future AI integration — not implemented in MVP */
export async function suggestObjectAI(_params: StoneParams): Promise<string> {
  throw new Error('suggestObjectAI not implemented');
}

export function getDimensions(geo: THREE.BufferGeometry): {
  width: number;
  height: number;
  depth: number;
  volume: number;
} {
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const w = (box.max.x - box.min.x) * UNIT_TO_MM;
  const h = (box.max.y - box.min.y) * UNIT_TO_MM;
  const d = (box.max.z - box.min.z) * UNIT_TO_MM;
  return { width: w, height: h, depth: d, volume: w * h * d };
}
