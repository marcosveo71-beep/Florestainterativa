import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';

export function Lake() {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      // Pequena animação de altura para simular movimento leve na água
      waterRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* Água com Reflexo */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[14, 64]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={1.5}
          roughness={0.1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#154c79"
          metalness={0.8}
          mirror={0.8}
        />
      </mesh>
      
      {/* Borda de terra/areia */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[15.5, 32]} />
        <meshStandardMaterial color="#6b543a" roughness={1} />
      </mesh>
    </group>
  );
}
