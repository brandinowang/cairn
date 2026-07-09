import { useMemo } from 'react';
import { a, useSpring } from '@react-spring/three';
import type { PlacedStone } from '../types';
import { useStore } from '../store/useStore';
import { buildGeometry } from '../engine/geometry';
import { createMaterial } from '../engine/materials';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface StoneProps {
  stone: PlacedStone;
  isNew?: boolean;
  isRemoving?: boolean;
  onSettled?: () => void;
}

function AnimatedStone({
  stone,
  isNew,
  isRemoving,
  onSettled,
  reducedMotion,
}: Required<Pick<StoneProps, 'stone'>> & {
  isNew: boolean;
  isRemoving: boolean;
  onSettled?: () => void;
  reducedMotion: boolean;
}) {
  const colorScheme = useStore((s) => s.colorScheme);
  const geo = useMemo(() => buildGeometry(stone.params), [stone.params]);
  const material = useMemo(() => {
    const mat = createMaterial(stone.params.material, colorScheme);
    return mat.clone();
  }, [stone.params.material, colorScheme]);

  const startY = stone.position[1] + stone.height * 1.5;
  const exitY = stone.position[1] + stone.height * 1.2;

  const springs = useSpring({
    posY: isRemoving ? exitY : stone.position[1],
    opacity: isRemoving ? 0 : 1,
    from: isNew
      ? reducedMotion
        ? { posY: stone.position[1], opacity: 0 }
        : { posY: startY, opacity: 0.5 }
      : undefined,
    immediate: reducedMotion && !isRemoving,
    config: reducedMotion
      ? { tension: 300, friction: 30 }
      : isRemoving
        ? { tension: 280, friction: 26 }
        : { tension: 165, friction: 14, mass: 1.05 },
    onRest: () => onSettled?.(),
  });

  return (
    <a.mesh
      geometry={geo}
      material={material}
      position-x={stone.position[0]}
      position-y={springs.posY}
      position-z={stone.position[2]}
      rotation-y={stone.rotation}
      castShadow
      receiveShadow
      material-opacity={springs.opacity}
      material-transparent={isNew || isRemoving}
    />
  );
}

function StaticStone({ stone }: { stone: PlacedStone }) {
  const colorScheme = useStore((s) => s.colorScheme);
  const geo = useMemo(() => buildGeometry(stone.params), [stone.params]);
  const material = useMemo(
    () => createMaterial(stone.params.material, colorScheme),
    [stone.params.material, colorScheme],
  );

  return (
    <mesh
      geometry={geo}
      material={material}
      position={stone.position}
      rotation-y={stone.rotation}
      castShadow
      receiveShadow
    />
  );
}

export function Stone({ stone, isNew = false, isRemoving = false, onSettled }: StoneProps) {
  const reducedMotion = useReducedMotion();

  if (isNew || isRemoving) {
    return (
      <AnimatedStone
        stone={stone}
        isNew={isNew}
        isRemoving={isRemoving}
        onSettled={onSettled}
        reducedMotion={reducedMotion}
      />
    );
  }
  return <StaticStone stone={stone} />;
}
