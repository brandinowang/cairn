import type { Archetype, FieldFeatures, FieldPrimitiveType } from '../types';
import { mulberry32, xfnv1a } from './rng';

export type AttachmentDir =
  | 'left'
  | 'right'
  | 'front'
  | 'back'
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'topFront';

export type AnchorKind = 'base' | 'previous' | 'spine';

export interface GrowthStep {
  anchor: AnchorKind;
  direction: AttachmentDir;
  massScale: number;
  aspectScale?: number;
  jitter?: number;
}

export interface FormBlueprint {
  id: string;
  steps: GrowthStep[];
  repeatFrom: number;
  primaryTypes: FieldPrimitiveType[];
  aspectRange: [number, number];
  blendScale: number;
  features: Partial<FieldFeatures>;
}

export interface ResolvedFormProfile {
  blueprintId: string;
  archetype: Archetype;
  steps: GrowthStep[];
  repeatFrom: number;
  primaryTypes: FieldPrimitiveType[];
  primaryType: FieldPrimitiveType;
  aspectRange: [number, number];
  baseRotation: number;
  blendScale: number;
  facetCount: number;
  jitterScale: number;
  spread: number;
  features: FieldFeatures;
}

/** Tasks 2–4: wings + first vertical rise off the spine */
const OPENING_DEPOSITS: GrowthStep[] = [
  { anchor: 'base', direction: 'left', massScale: 0.78, aspectScale: 0.54, jitter: 0.002 },
  { anchor: 'base', direction: 'front', massScale: 0.72, aspectScale: 0.54, jitter: 0.002 },
  { anchor: 'spine', direction: 'top', massScale: 0.74, aspectScale: 0.82, jitter: 0.002 },
];

/** Mix vertical extrusion with lateral add-ons — tower grows upward over time */
const ADD_ON_CYCLE: GrowthStep[] = [
  { anchor: 'previous', direction: 'top', massScale: 0.68, aspectScale: 0.88, jitter: 0.002 },
  { anchor: 'previous', direction: 'topLeft', massScale: 0.62, aspectScale: 0.76, jitter: 0.002 },
  { anchor: 'previous', direction: 'left', massScale: 0.64, aspectScale: 0.58, jitter: 0.002 },
  { anchor: 'previous', direction: 'top', massScale: 0.6, aspectScale: 0.84, jitter: 0.002 },
  { anchor: 'previous', direction: 'topRight', massScale: 0.58, aspectScale: 0.74, jitter: 0.002 },
  { anchor: 'previous', direction: 'front', massScale: 0.62, aspectScale: 0.56, jitter: 0.002 },
  { anchor: 'previous', direction: 'topFront', massScale: 0.56, aspectScale: 0.8, jitter: 0.002 },
  { anchor: 'previous', direction: 'back', massScale: 0.58, aspectScale: 0.54, jitter: 0.002 },
];

/** Light touch — keeps layouts readable, not scrambled */
function subtleVariant(steps: GrowthStep[], seed: number): GrowthStep[] {
  const rng = mulberry32(seed ^ 0x7f4a7c15);
  const massBias = 0.97 + rng() * 0.06;
  return steps.map((step) => ({
    ...step,
    massScale: step.massScale * massBias,
    aspectScale: (step.aspectScale ?? 1) * (0.96 + rng() * 0.06),
    jitter: step.jitter ?? 0.003,
  }));
}

const MONUMENT_BLUEPRINTS: FormBlueprint[] = [
  {
    id: 'pedestal',
    steps: [
      { anchor: 'spine', direction: 'top', massScale: 0.88, aspectScale: 0.62, jitter: 0.002 },
      { anchor: 'spine', direction: 'top', massScale: 0.76, aspectScale: 0.58, jitter: 0.002 },
      { anchor: 'spine', direction: 'topFront', massScale: 0.62, aspectScale: 0.55, jitter: 0.002 },
    ],
    repeatFrom: 0,
    primaryTypes: ['box'],
    aspectRange: [0.58, 0.78],
    blendScale: 0.82,
    features: { mirrorX: true, concavity: 0, boreRadius: 0 },
  },
  {
    id: 'winged-base',
    steps: [
      { anchor: 'base', direction: 'left', massScale: 0.9, aspectScale: 0.52, jitter: 0.002 },
      { anchor: 'base', direction: 'right', massScale: 0.9, aspectScale: 0.52, jitter: 0.002 },
      { anchor: 'spine', direction: 'top', massScale: 0.72, aspectScale: 0.56, jitter: 0.002 },
    ],
    repeatFrom: 2,
    primaryTypes: ['box'],
    aspectRange: [0.52, 0.72],
    blendScale: 0.8,
    features: { mirrorX: true, concavity: 0, boreRadius: 0 },
  },
  {
    id: 'stepped-mass',
    steps: [
      { anchor: 'spine', direction: 'top', massScale: 0.92, aspectScale: 0.5, jitter: 0.002 },
      { anchor: 'spine', direction: 'top', massScale: 0.82, aspectScale: 0.48, jitter: 0.002 },
      { anchor: 'spine', direction: 'top', massScale: 0.7, aspectScale: 0.46, jitter: 0.002 },
    ],
    repeatFrom: 1,
    primaryTypes: ['box'],
    aspectRange: [0.46, 0.68],
    blendScale: 0.84,
    features: { mirrorX: true, concavity: 0, boreRadius: 0 },
  },
];

const VESSEL_BLUEPRINTS: FormBlueprint[] = [
  {
    id: 'bowl',
    steps: [
      { anchor: 'base', direction: 'left', massScale: 0.88, aspectScale: 0.48, jitter: 0.002 },
      { anchor: 'base', direction: 'right', massScale: 0.88, aspectScale: 0.48, jitter: 0.002 },
      { anchor: 'spine', direction: 'top', massScale: 0.68, aspectScale: 0.54, jitter: 0.002 },
    ],
    repeatFrom: 2,
    primaryTypes: ['box'],
    aspectRange: [0.48, 0.68],
    blendScale: 0.8,
    features: { mirrorX: true, boreRadius: 0.06, concavity: 0 },
  },
];

const TRAY_BLUEPRINTS: FormBlueprint[] = [
  {
    id: 'slab',
    steps: [
      { anchor: 'base', direction: 'left', massScale: 0.86, aspectScale: 0.36, jitter: 0.002 },
      { anchor: 'base', direction: 'right', massScale: 0.86, aspectScale: 0.36, jitter: 0.002 },
    ],
    repeatFrom: 0,
    primaryTypes: ['box'],
    aspectRange: [0.32, 0.46],
    blendScale: 0.78,
    features: { mirrorX: true, concavity: 0.02, boreRadius: 0 },
  },
];

const HANDHELD_BLUEPRINTS: FormBlueprint[] = [
  {
    id: 'bar',
    steps: [
      { anchor: 'previous', direction: 'top', massScale: 0.9, aspectScale: 0.72, jitter: 0.002 },
      { anchor: 'previous', direction: 'top', massScale: 0.82, aspectScale: 0.68, jitter: 0.002 },
    ],
    repeatFrom: 0,
    primaryTypes: ['box'],
    aspectRange: [0.62, 0.82],
    blendScale: 0.8,
    features: { mirrorX: false, concavity: 0, boreRadius: 0 },
  },
];

const HOLDER_BLUEPRINTS: FormBlueprint[] = [
  {
    id: 'fork',
    steps: [
      { anchor: 'base', direction: 'left', massScale: 0.72, aspectScale: 0.68, jitter: 0.002 },
      { anchor: 'base', direction: 'right', massScale: 0.72, aspectScale: 0.68, jitter: 0.002 },
      { anchor: 'spine', direction: 'top', massScale: 0.58, aspectScale: 0.6, jitter: 0.002 },
    ],
    repeatFrom: 2,
    primaryTypes: ['box'],
    aspectRange: [0.58, 0.78],
    blendScale: 0.78,
    features: { mirrorX: true, boreRadius: 0.04, concavity: 0 },
  },
];

const BLUEPRINTS: Record<Archetype, FormBlueprint[]> = {
  MONUMENT: MONUMENT_BLUEPRINTS,
  VESSEL: VESSEL_BLUEPRINTS,
  TRAY: TRAY_BLUEPRINTS,
  HANDHELD: HANDHELD_BLUEPRINTS,
  HOLDER: HOLDER_BLUEPRINTS,
};

function baseFeatures(archetype: Archetype): FieldFeatures {
  switch (archetype) {
    case 'HOLDER':
      return { flattenBase: true, boreRadius: 0.04, mirrorX: true, concavity: 0 };
    case 'VESSEL':
      return { flattenBase: true, boreRadius: 0.06, mirrorX: true, concavity: 0 };
    case 'HANDHELD':
      return { flattenBase: true, boreRadius: 0, mirrorX: false, concavity: 0 };
    case 'TRAY':
      return { flattenBase: true, boreRadius: 0, mirrorX: true, concavity: 0.02 };
    case 'MONUMENT':
    default:
      return { flattenBase: true, boreRadius: 0, mirrorX: true, concavity: 0 };
  }
}

export function resolveFormProfile(archetype: Archetype, formSeed: number): ResolvedFormProfile {
  const pool = BLUEPRINTS[archetype] ?? MONUMENT_BLUEPRINTS;
  const rng = mulberry32(formSeed);
  const blueprint = pool[Math.floor(rng() * pool.length)] ?? pool[0];
  const base = baseFeatures(archetype);
  const variantRng = mulberry32(formSeed ^ xfnv1a(blueprint.id));

  const aspectShift = 0.96 + variantRng() * 0.08;
  const aspectRange: [number, number] = [
    blueprint.aspectRange[0] * aspectShift,
    blueprint.aspectRange[1] * aspectShift,
  ];

  const quarterTurn = Math.floor(variantRng() * 4) / 4;

  return {
    blueprintId: `${blueprint.id}-${formSeed.toString(16).slice(-4)}`,
    archetype,
    steps: subtleVariant(blueprint.steps, formSeed),
    repeatFrom: blueprint.repeatFrom,
    primaryTypes: blueprint.primaryTypes,
    primaryType: 'box',
    aspectRange,
    baseRotation: quarterTurn * Math.PI * 2,
    blendScale: blueprint.blendScale,
    facetCount: 4,
    jitterScale: 0.22 + variantRng() * 0.12,
    spread: 0.15 + variantRng() * 0.1,
    features: {
      flattenBase: true,
      boreRadius: blueprint.features.boreRadius ?? base.boreRadius,
      mirrorX: blueprint.features.mirrorX ?? base.mirrorX,
      concavity: blueprint.features.concavity ?? base.concavity,
    },
  };
}

export function growthStepForIndex(_profile: ResolvedFormProfile, depositIndex: number): GrowthStep {
  if (depositIndex <= 0) {
    return { anchor: 'base', direction: 'top', massScale: 1, aspectScale: 0.78, jitter: 0 };
  }

  if (depositIndex <= OPENING_DEPOSITS.length) {
    return OPENING_DEPOSITS[depositIndex - 1];
  }

  const cycleIdx = (depositIndex - 1 - OPENING_DEPOSITS.length) % ADD_ON_CYCLE.length;
  return ADD_ON_CYCLE[cycleIdx];
}

export function resolveAnchorIndex(
  anchor: AnchorKind,
  depositIndex: number,
  primitives: { position: [number, number, number] }[],
): number {
  switch (anchor) {
    case 'base':
      return 0;
    case 'previous':
      return Math.max(0, depositIndex - 1);
    case 'spine': {
      let best = 0;
      let maxY = -Infinity;
      for (let i = 0; i < primitives.length; i++) {
        if (primitives[i].position[1] > maxY) {
          maxY = primitives[i].position[1];
          best = i;
        }
      }
      return best;
    }
    default:
      return Math.max(0, depositIndex - 1);
  }
}
