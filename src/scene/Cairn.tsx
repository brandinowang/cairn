import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CairnStructure, PlacedStone } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Stone } from './Stone';
import { Plinth } from './Plinth';

interface CairnProps {
  structure: CairnStructure;
  lastCompletedId: string | null;
  removingStone: PlacedStone | null;
  onAnimationComplete: () => void;
}

const STATIC_SWAY_COUNT = 3;

export function Cairn({
  structure,
  lastCompletedId,
  removingStone,
  onAnimationComplete,
}: CairnProps) {
  const groupRef = useRef<THREE.Group>(null);
  const staticRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const lean = structure.lean;
  const reducedMotion = useReducedMotion();

  const { staticStones, dynamicStones } = useMemo(() => {
    const animating = new Set<string>();
    if (lastCompletedId) animating.add(lastCompletedId);
    if (removingStone) animating.add(removingStone.params.taskId);

    const dynamicIds = new Set(animating);
    const topCount = STATIC_SWAY_COUNT;
    for (let i = Math.max(0, structure.stones.length - topCount); i < structure.stones.length; i++) {
      dynamicIds.add(structure.stones[i].params.taskId);
    }

    return {
      staticStones: structure.stones.filter((s) => !dynamicIds.has(s.params.taskId)),
      dynamicStones: structure.stones.filter((s) => dynamicIds.has(s.params.taskId)),
    };
  }, [structure.stones, lastCompletedId, removingStone]);

  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion) return;
    timeRef.current += delta;
    const t = timeRef.current;
    groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.008 + lean[0];
    groupRef.current.rotation.z = Math.cos(t * 0.35) * 0.006 + lean[1];

    if (staticRef.current) {
      staticRef.current.matrixAutoUpdate = false;
    }
  });

  return (
    <group ref={groupRef}>
      <Plinth />
      <group ref={staticRef}>
        {staticStones.map((stone) => (
          <Stone key={stone.params.taskId} stone={stone} />
        ))}
      </group>
      {dynamicStones.map((stone) => {
        const isNew = stone.params.taskId === lastCompletedId;
        const isRemoving = removingStone?.params.taskId === stone.params.taskId;
        return (
          <Stone
            key={stone.params.taskId}
            stone={stone}
            isNew={isNew}
            isRemoving={isRemoving}
            onSettled={isNew || isRemoving ? onAnimationComplete : undefined}
          />
        );
      })}
      {removingStone && !dynamicStones.find((s) => s.params.taskId === removingStone.params.taskId) && (
        <Stone
          key={`removing-${removingStone.params.taskId}`}
          stone={removingStone}
          isRemoving
          onSettled={onAnimationComplete}
        />
      )}
    </group>
  );
}
