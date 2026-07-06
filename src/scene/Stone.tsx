import { useMemo } from 'react';
import { a, useSpring } from '@react-spring/three';
import type { PlacedStone } from '../types';
import { buildGeometry } from '../engine/geometry';
import { createMaterial } from '../engine/materials';

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
}: Required<Pick<StoneProps, 'stone'>> & {
  isNew: boolean;
  isRemoving: boolean;
  onSettled?: () => void;
}) {
  const geo = useMemo(() => buildGeometry(stone.params), [stone.params]);
  const material = useMemo(() => {
    const mat = createMaterial(stone.params.material);
    return mat.clone();
  }, [stone.params.material]);

  const startY = stone.position[1] + stone.height * 1.5;
  const exitY = stone.position[1] + stone.height * 1.2;

  const springs = useSpring({
    posY: isRemoving ? exitY : stone.position[1],
    opacity: isRemoving ? 0 : 1,
    from: isNew ? { posY: startY, opacity: 0.5 } : undefined,
    config: isRemoving
      ? { tension: 280, friction: 26 }
      : { tension: 170, friction: 12, mass: 1.1 },
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
      material-transparent
    />
  );
}

function StaticStone({ stone }: { stone: PlacedStone }) {
  const geo = useMemo(() => buildGeometry(stone.params), [stone.params]);
  const material = useMemo(
    () => createMaterial(stone.params.material),
    [stone.params.material],
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
  if (isNew || isRemoving) {
    return (
      <AnimatedStone
        stone={stone}
        isNew={isNew}
        isRemoving={isRemoving}
        onSettled={onSettled}
      />
    );
  }
  return <StaticStone stone={stone} />;
}
