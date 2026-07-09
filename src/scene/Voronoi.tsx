import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { VoronoiStructure } from '../types';
import { buildVoronoiCellGeometry } from '../engine/voronoi';
import { useStore } from '../store/useStore';
import { createMaterial } from '../engine/materials';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface VoronoiProps {
  structure: VoronoiStructure;
}

function VoronoiCellMesh({
  cell,
}: {
  cell: VoronoiStructure['cells'][number];
}) {
  const colorScheme = useStore((s) => s.colorScheme);
  const geo = useMemo(() => buildVoronoiCellGeometry(cell), [cell]);
  const material = useMemo(
    () => createMaterial(cell.params.material, colorScheme),
    [cell.params.material, colorScheme],
  );

  return (
    <mesh
      geometry={geo}
      material={material}
      position={cell.position}
      castShadow
      receiveShadow
    />
  );
}

export function Voronoi({ structure }: VoronoiProps) {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();
  const colorScheme = useStore((s) => s.colorScheme);
  const isDark = colorScheme === 'dark';

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <cylinderGeometry args={[structure.radius * 1.15, structure.radius * 1.18, 0.035, 80]} />
        <meshStandardMaterial
          color={isDark ? '#3A4048' : '#CFD2D4'}
          metalness={isDark ? 0.35 : 0.5}
          roughness={isDark ? 0.62 : 0.5}
        />
      </mesh>
      <gridHelper
        args={[
          structure.radius * 2.2,
          14,
          isDark ? '#454C56' : '#CDD0D3',
          isDark ? '#2E343C' : '#DEE0E2',
        ]}
        position={[0, 0.001, 0]}
      />
      {structure.cells.map((cell) => (
        <VoronoiCellMesh key={cell.params.taskId} cell={cell} />
      ))}
    </group>
  );
}
