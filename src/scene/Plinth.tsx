import { useMemo } from 'react';
import { useStore } from '../store/useStore';

export function Plinth() {
  const colorScheme = useStore((s) => s.colorScheme);
  const isDark = colorScheme === 'dark';

  const colors = useMemo(
    () =>
      isDark
        ? { base: '#3A4048', ring: '#565E68' }
        : { base: '#CFD2D4', ring: '#B8BBBE' },
    [isDark],
  );

  return (
    <group>
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <cylinderGeometry args={[1.4, 1.42, 0.035, 80]} />
        <meshStandardMaterial
          color={colors.base}
          metalness={isDark ? 0.35 : 0.55}
          roughness={isDark ? 0.62 : 0.48}
        />
      </mesh>
      <mesh receiveShadow position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.32, 1.34, 80]} />
        <meshStandardMaterial
          color={colors.ring}
          metalness={isDark ? 0.28 : 0.4}
          roughness={isDark ? 0.68 : 0.55}
        />
      </mesh>
    </group>
  );
}
