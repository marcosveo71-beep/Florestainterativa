import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function FallingLeaves({ visible }: { visible: boolean }) {
  const count = 2000;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities, phases, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    const phs = new Float32Array(count);
    const col = new Float32Array(count * 3);
    
    const autumnColors = [
      new THREE.Color('#d95a2b'), // Orange
      new THREE.Color('#c24213'), // Darker orange
      new THREE.Color('#e0b538'), // Yellow
      new THREE.Color('#8b3a1a'), // Brownish red
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 150;
      pos[i * 3 + 1] = Math.random() * 40; // Start lower than rain/snow
      pos[i * 3 + 2] = (Math.random() - 0.5) * 150;
      
      vel[i] = 0.5 + Math.random() * 1.5; // Slow fall
      phs[i] = Math.random() * Math.PI * 2;
      
      const color = autumnColors[Math.floor(Math.random() * autumnColors.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { positions: pos, velocities: vel, phases: phs, colors: col };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.5,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      vertexColors: true,
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
      
      // Sway like a falling leaf
      posArray[i * 3] += Math.sin(time * 2 + phases[i]) * 0.05;
      posArray[i * 3 + 2] += Math.cos(time * 1.5 + phases[i]) * 0.05;

      // Reset if hits ground
      if (posArray[i * 3 + 1] < 0) {
        posArray[i * 3] = (Math.random() - 0.5) * 150;
        posArray[i * 3 + 1] = 30 + Math.random() * 10; // Reset near tree tops
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
