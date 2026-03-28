import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SnowAccumulation({ isWinter }: { isWinter: boolean }) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    // Target opacity: 0.9 in winter, 0 otherwise
    const targetOpacity = isWinter ? 0.9 : 0;
    
    // Smoothly transition opacity (takes a few seconds)
    materialRef.current.opacity = THREE.MathUtils.lerp(
      materialRef.current.opacity,
      targetOpacity,
      delta * 0.5 // Speed of accumulation/melting
    );
    
    // Disable rendering if completely invisible to save performance
    materialRef.current.transparent = true;
    materialRef.current.visible = materialRef.current.opacity > 0.01;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial 
        ref={materialRef} 
        color="#ffffff" 
        roughness={0.9} 
        transparent={true}
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}
