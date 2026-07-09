export type Priority = 'low' | 'med' | 'high';

export type MaterialKey = 'aluminum' | 'walnut' | 'graphite' | 'red';

export type Category = {
  id: string;
  name: string;
  material: MaterialKey;
};

export interface Task {
  id: string;
  title: string;
  categoryId: string | null;
  priority: Priority;
  createdAt: number;
  completedAt: number | null;
  seed: number;
}

export type FieldPrimitiveType =
  | 'roundBox'
  | 'box'
  | 'octahedron'
  | 'wedge'
  | 'cylinder'
  | 'capsule'
  | 'roundCone';

export type Archetype = 'HOLDER' | 'VESSEL' | 'HANDHELD' | 'TRAY' | 'MONUMENT';

export type Vec3 = [number, number, number];

export interface FieldPrimitive {
  taskId: string;
  type: FieldPrimitiveType;
  mass: number;
  aspect: number;
  complexity: number;
  material: MaterialKey;
  rotationSeed: number;
  cornerRadius: number;
  position: Vec3;
}

/** @deprecated v1 alias */
export type StoneParams = FieldPrimitive & {
  primitive: FieldPrimitiveType;
  jitter: [number, number];
};

export interface FieldFeatures {
  flattenBase: boolean;
  boreRadius: number;
  mirrorX: boolean;
  concavity: number;
}

export interface FusedStructure {
  primitives: FieldPrimitive[];
  blendK: number;
  blendScale: number;
  blueprintId: string;
  archetype: Archetype;
  resolvedArchetype: Archetype | null;
  features: FieldFeatures;
  serial: string;
  totalHeight: number;
  dominantMaterial: MaterialKey;
}

export interface MeshData {
  positions: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
}

export interface MeshJob {
  primitives: FieldPrimitive[];
  blendK: number;
  features: FieldFeatures;
  resolution: number;
  cacheKey: string;
}

export type GenerativeMode = 'cairn' | 'voronoi';

export type AppView = 'main' | 'library';

export type ColorScheme = 'light' | 'dark';

/** @deprecated v1 stacking */
export interface PlacedStone {
  params: StoneParams;
  position: Vec3;
  rotation: number;
  height: number;
}

/** @deprecated v1 — use FusedStructure */
export interface CairnStructure {
  stones: PlacedStone[];
  totalHeight: number;
  lean: [number, number];
  serial: string;
}

export interface VoronoiCell {
  params: FieldPrimitive;
  position: Vec3;
  height: number;
  polygon: [number, number][];
}

export interface VoronoiStructure {
  cells: VoronoiCell[];
  serial: string;
  radius: number;
}

export interface FormEntry {
  task: Task;
  params: FieldPrimitive;
  category: Category | null;
}

export type LibrarySort = 'date' | 'material' | 'primitive' | 'category';

export interface LibraryFilters {
  material: MaterialKey | 'all';
  primitive: FieldPrimitiveType | 'all';
  categoryId: string | 'all';
  sort: LibrarySort;
}

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  HOLDER: 'Holder',
  VESSEL: 'Vessel',
  HANDHELD: 'Handheld',
  TRAY: 'Tray',
  MONUMENT: 'Object',
};
