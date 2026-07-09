import { useStore } from '../store/useStore';

interface LightingProps {
  compact?: boolean;
}

export function Lighting({ compact = false }: LightingProps) {
  const colorScheme = useStore((s) => s.colorScheme);
  const isDark = colorScheme === 'dark';

  const keyIntensity = compact ? (isDark ? 1.15 : 1.0) : isDark ? 1.45 : 1.25;
  const fillIntensity = compact ? (isDark ? 0.55 : 0.45) : isDark ? 0.72 : 0.55;

  return (
    <>
      <ambientLight intensity={fillIntensity} color={isDark ? '#8892a0' : '#f0f1f2'} />
      <hemisphereLight
        args={
          isDark
            ? ['#4a5260', '#121418', compact ? 0.58 : 0.72]
            : ['#f5f6f7', '#d6d8da', compact ? 0.5 : 0.65]
        }
      />
      <directionalLight
        position={[-5, 9, 6]}
        intensity={keyIntensity}
        color={isDark ? '#f2f4f7' : '#ffffff'}
        castShadow={!compact}
        shadow-mapSize={compact ? undefined : [1024, 1024]}
        shadow-camera-far={30}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0002}
      />
      <directionalLight
        position={[4, 3, -2]}
        intensity={isDark ? 0.42 : 0.35}
        color={isDark ? '#b8c0cc' : '#e8eaec'}
      />
      <directionalLight
        position={[3, 2, -5]}
        intensity={isDark ? 0.38 : 0.28}
        color={isDark ? '#9aa8b8' : '#c8d0d8'}
      />
    </>
  );
}
