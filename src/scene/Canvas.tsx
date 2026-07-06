import { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { buildCairnStructure } from '../engine/structure';
import { Cairn } from './Cairn';
import { Lighting } from './Lighting';
import { Hud } from '../ui/Hud';

function CameraRig({ targetHeight }: { targetHeight: number }) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3(0, targetHeight * 0.45 + 1.2, 4.5 + targetHeight * 0.35));

  useEffect(() => {
    desired.current.set(0, targetHeight * 0.45 + 1.2, 4.5 + targetHeight * 0.35);
  }, [targetHeight]);

  useFrame(() => {
    camera.position.lerp(desired.current, 0.04);
    camera.lookAt(0, targetHeight * 0.35, 0);
  });

  return (
    <OrbitControls
      enablePan={false}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.48}
      minDistance={2.5}
      maxDistance={14}
      target={[0, targetHeight * 0.35, 0]}
      enableDamping
      dampingFactor={0.06}
    />
  );
}

function SceneContent() {
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);
  const lastCompletedId = useStore((s) => s.lastCompletedId);
  const removingStone = useStore((s) => s.removingStone);
  const clearAnimationFlags = useStore((s) => s.clearAnimationFlags);

  const structure = useMemo(
    () => buildCairnStructure(tasks, categories),
    [tasks, categories],
  );

  return (
    <>
      <color attach="background" args={['#0A0B0C']} />
      <Lighting />
      <Environment preset="warehouse" />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.35}
        scale={12}
        blur={2.5}
        far={8}
      />
      <Cairn
        structure={structure}
        lastCompletedId={lastCompletedId}
        removingStone={removingStone}
        onAnimationComplete={clearAnimationFlags}
      />
      <CameraRig targetHeight={structure.totalHeight} />
    </>
  );
}

function CameraTracker({ onUpdate }: { onUpdate: (pos: [number, number, number]) => void }) {
  const { camera } = useThree();
  useFrame(() => {
    onUpdate([camera.position.x, camera.position.y, camera.position.z]);
  });
  return null;
}

export function SceneCanvas() {
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 2, 5]);
  const presentationMode = useStore((s) => s.presentationMode);

  return (
    <div className={`relative flex-1 bg-bg ${presentationMode ? 'w-full' : ''}`}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        camera={{ fov: 35, near: 0.1, far: 100, position: [0, 2, 5] }}
        shadows
      >
        <Suspense fallback={null}>
          <SceneContent />
          <CameraTracker onUpdate={setCameraPos} />
        </Suspense>
      </Canvas>
      <Hud cameraPos={cameraPos} />
    </div>
  );
}
