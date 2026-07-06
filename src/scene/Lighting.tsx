export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#3a4048', '#0a0b0c', 0.35]} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={30}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-3, 2, -4]} intensity={0.3} color="#8899aa" />
      <directionalLight position={[-5, 1, 3]} intensity={0.45} color="#E5372A" />
    </>
  );
}
