import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import type { FusedStructure } from '../types';
import { meshDepositBlock } from '../engine/mesh';
import { createMaterial } from '../engine/materials';
import { useFusedMesh } from '../hooks/useFusedMesh';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useStore } from '../store/useStore';
import { Plinth } from './Plinth';

interface FusedBodyProps {
  structure: FusedStructure;
  isDepositing: boolean;
  onSettled?: () => void;
}

function toGeometry(data: ReturnType<typeof meshDepositBlock>): THREE.BufferGeometry | null {
  if (data.positions.length < 9) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
  geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geo.computeBoundingSphere();
  return geo;
}

export function FusedBody({ structure, isDepositing, onSettled }: FusedBodyProps) {
  const reducedMotion = useReducedMotion();
  const settledRef = useRef(false);
  const count = structure.primitives.length;
  const latest = count > 0 ? structure.primitives[count - 1] : null;

  const bodyStructure = useMemo(() => {
    if (isDepositing && count > 1) {
      return { ...structure, primitives: structure.primitives.slice(0, -1) };
    }
    return structure;
  }, [structure, isDepositing, count]);

  const { geometry, isUpdating } = useFusedMesh(bodyStructure);
  const colorScheme = useStore((s) => s.colorScheme);
  const material = useMemo(
    () => createMaterial(structure.dominantMaterial, colorScheme),
    [structure.dominantMaterial, colorScheme],
  );

  const depositGeometry = useMemo(() => {
    if (!isDepositing || !latest) return null;
    return toGeometry(meshDepositBlock(latest, structure.features, 44));
  }, [isDepositing, latest, structure.features]);

  useEffect(() => {
    useStore.getState().setMeshUpdating(isUpdating);
  }, [isUpdating]);

  const depositSpring = useSpring({
    scale: 1,
    config: { tension: 280, friction: 12, mass: 0.7 },
    reset: isDepositing && !reducedMotion,
    from: { scale: 0.05 },
    onRest: () => {
      if (isDepositing && !settledRef.current) {
        settledRef.current = true;
        onSettled?.();
      }
    },
  });

  useEffect(() => {
    if (isDepositing) settledRef.current = false;
  }, [isDepositing, count]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.06) * 0.015;
  });

  return (
    <group ref={groupRef}>
      <Plinth />
      {geometry && (
        <mesh geometry={geometry} material={material} castShadow receiveShadow />
      )}
      {depositGeometry && (
        <a.mesh
          geometry={depositGeometry}
          material={material}
          scale={depositSpring.scale}
          castShadow
          receiveShadow
        />
      )}
    </group>
  );
}
