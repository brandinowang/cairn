import { Text } from '@react-three/drei';
import type { CairnStructure } from '../types';

interface PlinthProps {
  structure: CairnStructure;
  empty?: boolean;
}

export function Plinth({ structure, empty = false }: PlinthProps) {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <cylinderGeometry args={[1.4, 1.5, 0.04, 64]} />
        <meshStandardMaterial color="#9BA0A4" metalness={0.9} roughness={0.32} />
      </mesh>
      <mesh receiveShadow position={[0, -0.005, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.01, 64]} />
        <meshStandardMaterial color="#141618" metalness={0.2} roughness={0.9} />
      </mesh>
      {empty && (
        <Text
          position={[0, 0.15, 0]}
          fontSize={0.06}
          color="#565C61"
          anchorX="center"
          anchorY="middle"
        >
          complete a task to begin the cairn
        </Text>
      )}
      <Text
        position={[0, -0.08, 0.9]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.045}
        color="#565C61"
        anchorX="center"
        anchorY="middle"
      >
        {structure.serial}
      </Text>
    </group>
  );
}
