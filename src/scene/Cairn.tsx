import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CairnStructure, PlacedStone } from '../types';
import { Stone } from './Stone';
import { Plinth } from './Plinth';

interface CairnProps {
  structure: CairnStructure;
  lastCompletedId: string | null;
  removingStone: PlacedStone | null;
  onAnimationComplete: () => void;
}

export function Cairn({
  structure,
  lastCompletedId,
  removingStone,
  onAnimationComplete,
}: CairnProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const lean = structure.lean;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.008 + lean[0];
    groupRef.current.rotation.z = Math.cos(t * 0.35) * 0.006 + lean[1];
  });

  return (
    <group ref={groupRef}>
      <Plinth structure={structure} empty={structure.stones.length === 0 && !removingStone} />
      {structure.stones.map((stone) => (
        <Stone
          key={stone.params.taskId}
          stone={stone}
          isNew={stone.params.taskId === lastCompletedId}
          onSettled={
            stone.params.taskId === lastCompletedId ? onAnimationComplete : undefined
          }
        />
      ))}
      {removingStone && (
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
