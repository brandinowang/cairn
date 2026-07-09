import * as THREE from 'three';
import type { ColorScheme, MaterialKey } from '../types';

export interface MaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
}

const MATERIAL_BY_SCHEME: Record<ColorScheme, Record<MaterialKey, MaterialConfig>> = {
  light: {
    aluminum: { color: '#B8BDC2', metalness: 0.88, roughness: 0.32 },
    walnut: { color: '#4A3828', metalness: 0.0, roughness: 0.68 },
    graphite: { color: '#2A2D30', metalness: 0.12, roughness: 0.88 },
    red: { color: '#B83228', metalness: 0.75, roughness: 0.35 },
  },
  dark: {
    aluminum: { color: '#D2D7DD', metalness: 0.9, roughness: 0.26 },
    walnut: { color: '#8A6848', metalness: 0.02, roughness: 0.58 },
    graphite: { color: '#9AA1A9', metalness: 0.22, roughness: 0.72 },
    red: { color: '#E04A40', metalness: 0.78, roughness: 0.3 },
  },
};

/** @deprecated use MATERIAL_BY_SCHEME */
export const MATERIAL_CONFIG = MATERIAL_BY_SCHEME.light;

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function cacheKey(scheme: ColorScheme, key: MaterialKey): string {
  return `${scheme}:${key}`;
}

export function createMaterial(
  key: MaterialKey,
  scheme: ColorScheme = 'light',
): THREE.MeshStandardMaterial {
  const id = cacheKey(scheme, key);
  const cached = materialCache.get(id);
  if (cached) return cached;

  const cfg = MATERIAL_BY_SCHEME[scheme][key];
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    metalness: cfg.metalness,
    roughness: cfg.roughness,
  });
  materialCache.set(id, mat);
  return mat;
}

export function getMaterial(key: MaterialKey, scheme: ColorScheme = 'light'): THREE.MeshStandardMaterial {
  return createMaterial(key, scheme);
}
