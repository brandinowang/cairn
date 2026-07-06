import * as THREE from 'three';
import type { MaterialKey } from '../types';

export interface MaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
}

export const MATERIAL_CONFIG: Record<MaterialKey, MaterialConfig> = {
  aluminum: { color: '#9BA0A4', metalness: 0.9, roughness: 0.32 },
  walnut: { color: '#3B2A1E', metalness: 0.0, roughness: 0.72 },
  graphite: { color: '#141618', metalness: 0.15, roughness: 0.95 },
  red: { color: '#C4291E', metalness: 0.7, roughness: 0.4 },
};

const materialCache = new Map<MaterialKey, THREE.MeshStandardMaterial>();

export function createMaterial(key: MaterialKey): THREE.MeshStandardMaterial {
  const cached = materialCache.get(key);
  if (cached) return cached;

  const cfg = MATERIAL_CONFIG[key];
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    metalness: cfg.metalness,
    roughness: cfg.roughness,
  });
  materialCache.set(key, mat);
  return mat;
}

export function getMaterial(key: MaterialKey): THREE.MeshStandardMaterial {
  return createMaterial(key);
}
