import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Snow({ visible }: { visible: boolean }) {
  const count = 10000;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    const phs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 150;
      pos[i * 3 + 1] = Math.random() * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 150;
      
      vel[i] = 1 + Math.random() * 2; // Slower than rain
      phs[i] = Math.random() * Math.PI * 2; // For horizontal drift
    }
    return { positions: pos, velocities: vel, phases: phs };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.3,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !visible) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const time = state.clock.getElapsedTime();

    const safeDelta = Math.min(delta, 0.1);

    for (let i = 0; i < count; i++) {
      const speed = velocities[i] * safeDelta;
      
      // Move down
      posArray[i * 3 + 1] -= speed;
      
      // Horizontal drift (wind + sway)
      posArray[i * 3] += Math.sin(time + phases[i]) * 0.02;
      posArray[i * 3 + 2] += Math.cos(time + phases[i]) * 0.02;

      // Reset if hits ground
      if (posArray[i * 3 + 1] < 0) {
        posArray[i * 3] = (Math.random() - 0.5) * 150;
        posArray[i * 3 + 1] = 40 + Math.random() * 20;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 150;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
}
