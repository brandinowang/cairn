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

export interface StoneParams {
  taskId: string;
  primitive: 'slab' | 'shard' | 'core' | 'nodule' | 'facet';
  mass: number;
  aspect: number;
  complexity: number;
  material: MaterialKey;
  rotationSeed: number;
  jitter: [number, number];
}

export type GenerativeMode = 'cairn' | 'voronoi';

export interface PlacedStone {
  params: StoneParams;
  position: [number, number, number];
  rotation: number;
  height: number;
}

export interface CairnStructure {
  stones: PlacedStone[];
  totalHeight: number;
  lean: [number, number];
  serial: string;
}
