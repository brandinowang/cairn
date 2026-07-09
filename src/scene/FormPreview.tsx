import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FieldPrimitive } from '../types';
import { useStore } from '../store/useStore';
import { buildGeometry } from '../engine/geometry';
import { createMaterial } from '../engine/materials';
import { Lighting } from './Lighting';

function TurntableStone({ params, autoRotate = true }: { params: FieldPrimitive; autoRotate?: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const colorScheme = useStore((s) => s.colorScheme);
  const stoneParams = useMemo(
    () => ({ ...params, primitive: params.type, jitter: [0, 0] as [number, number] }),
    [params],
  );
  const geo = useMemo(() => buildGeometry(stoneParams), [stoneParams]);
  const material = useMemo(
    () => createMaterial(params.material, colorScheme),
    [params.material, colorScheme],
  );

  useFrame((_, delta) => {
    if (autoRotate && ref.current) ref.current.rotation.y += delta * 0.45;
  });

  return (
    <mesh ref={ref} geometry={geo} material={material} castShadow receiveShadow />
  );
}

interface FormPreviewProps {
  params: FieldPrimitive;
  className?: string;
  autoRotate?: boolean;
}

export function FormPreview({ params, className = '', autoRotate = true }: FormPreviewProps) {
  const colorScheme = useStore((s) => s.colorScheme);
  const isDark = colorScheme === 'dark';

  return (
    <div className={`stage-gradient ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDark ? 1.08 : 0.95,
        }}
        camera={{ fov: 35, position: [1.2, 0.8, 1.6], near: 0.1, far: 20 }}
        shadows
      >
        <Suspense fallback={null}>
          <Lighting compact />
          <TurntableStone params={params} autoRotate={autoRotate} />
        </Suspense>
      </Canvas>
    </div>
  );
}
