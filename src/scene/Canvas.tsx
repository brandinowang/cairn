import { Suspense, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { buildFusedStructure } from '../engine/structure';
import { buildVoronoiStructure } from '../engine/voronoi';
import { FusedBody } from './FusedBody';
import { Voronoi } from './Voronoi';
import { Lighting } from './Lighting';
import { Hud } from '../ui/Hud';
import { ViewportBlendSlider } from '../ui/ViewportBlendSlider';
import { resolveRenderBlendK, depositBlendBoost } from '../engine/field';

function SceneControls({ mode }: { mode: 'cairn' | 'voronoi' }) {
  const targetY = mode === 'voronoi' ? 0.5 : 0.75;

  return (
    <OrbitControls
      makeDefault
      enablePan
      minPolarAngle={Math.PI * 0.08}
      maxPolarAngle={Math.PI * 0.52}
      minDistance={1.5}
      maxDistance={24}
      target={[0, targetY, 0]}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.65}
      zoomSpeed={0.85}
      panSpeed={0.6}
    />
  );
}

function SceneContent() {
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);
  const mode = useStore((s) => s.mode);
  const colorScheme = useStore((s) => s.colorScheme);
  const refineLevel = useStore((s) => s.refineLevel);
  const liveSmoothness = useStore((s) => s.liveSmoothness);
  const resolvedArchetype = useStore((s) => s.resolvedArchetype);
  const formSeed = useStore((s) => s.formSeed);
  const lastCompletedId = useStore((s) => s.lastCompletedId);
  const clearAnimationFlags = useStore((s) => s.clearAnimationFlags);

  const depositBoost = lastCompletedId ? depositBlendBoost() : 0;

  const fusedStructure = useMemo(() => {
    const base = buildFusedStructure(tasks, categories, refineLevel, resolvedArchetype, 0, formSeed);
    const blendK =
      resolveRenderBlendK(liveSmoothness, depositBoost) * base.blendScale;
    return { ...base, blendK };
  }, [tasks, categories, refineLevel, liveSmoothness, resolvedArchetype, depositBoost, formSeed]);

  const voronoiStructure = useMemo(
    () => buildVoronoiStructure(tasks, categories),
    [tasks, categories],
  );

  const isDark = colorScheme === 'dark';

  return (
    <>
      <Lighting />
      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={isDark ? 0.42 : 0.12}
        scale={10}
        blur={isDark ? 3.2 : 2.8}
        far={6}
        color={isDark ? '#000000' : '#141618'}
      />
      {mode === 'cairn' ? (
        <FusedBody
          structure={fusedStructure}
          isDepositing={lastCompletedId != null}
          onSettled={clearAnimationFlags}
        />
      ) : (
        <Voronoi structure={voronoiStructure} />
      )}
      <SceneControls mode={mode} />
    </>
  );
}

function CanvasRegistrar() {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor(0x000000, 0);
    useStore.setState({ viewportCanvas: gl.domElement });
    return () => {
      useStore.setState({ viewportCanvas: null });
    };
  }, [gl]);
  return null;
}

export function SceneCanvas() {
  const presentationMode = useStore((s) => s.presentationMode);
  const colorScheme = useStore((s) => s.colorScheme);
  const view = useStore((s) => s.view);
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);
  const mode = useStore((s) => s.mode);
  const refineLevel = useStore((s) => s.refineLevel);
  const resolvedArchetype = useStore((s) => s.resolvedArchetype);
  const formSeed = useStore((s) => s.formSeed);

  const formCount = useMemo(() => {
    if (mode === 'cairn') {
      return buildFusedStructure(tasks, categories, refineLevel, resolvedArchetype, 0, formSeed)
        .primitives.length;
    }
    return buildVoronoiStructure(tasks, categories).cells.length;
  }, [tasks, categories, mode, refineLevel, resolvedArchetype, formSeed]);

  if (view === 'library') return null;

  const isDark = colorScheme === 'dark';

  return (
    <div
      id="cairn-viewport"
      className={`relative flex-1 stage-gradient min-w-0 rounded-2xl overflow-hidden m-3 ml-0 ${presentationMode ? 'w-full m-3' : ''}`}
    >
      {formCount === 0 && (
        <p className="absolute top-[18%] left-0 right-0 text-center text-[15px] text-ink-dim px-8 pointer-events-none z-10">
          Add your first task to begin the form.
        </p>
      )}
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDark ? 1.08 : 0.95,
        }}
        camera={{ fov: 35, near: 0.1, far: 100, position: [0, 2.4, 6.5] }}
        shadows
      >
        <Suspense fallback={null}>
          <CanvasRegistrar />
          <SceneContent />
        </Suspense>
      </Canvas>
      <Hud />
      <ViewportBlendSlider />
    </div>
  );
}
