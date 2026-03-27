import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Rain({ visible }: { visible: boolean }) {
  const count = 8000;
  const linesRef = useRef<THREE.LineSegments>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 6);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 150;
      const y = Math.random() * 60;
      const z = (Math.random() - 0.5) * 150;
      
      // Ponto inicial da gota
      pos[i * 6] = x;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = z;
      
      // Ponto final da gota (levemente inclinada pelo vento)
      pos[i * 6 + 3] = x - 0.1;
      pos[i * 6 + 4] = y - 0.8;
      pos[i * 6 + 5] = z - 0.1;

      // Velocidade de queda
      vel[i] = 20 + Math.random() * 15;
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#aaccff',
      transparent: true,
      opacity: 0.4,
    });
  }, []);

  useFrame((state, delta) => {
    if (!linesRef.current || !visible) return;
    const posAttr = linesRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    // Limitar o delta para evitar que a chuva atravesse o chão em caso de lag
    const safeDelta = Math.min(delta, 0.1);

    for (let i = 0; i < count; i++) {
      const speed = velocities[i] * safeDelta;
      
      // Move a gota para baixo
      posArray[i * 6 + 1] -= speed;
      posArray[i * 6 + 4] -= speed;
      
      // Move a gota para o lado (vento)
      posArray[i * 6] -= speed * 0.1;
      posArray[i * 6 + 3] -= speed * 0.1;
      posArray[i * 6 + 2] -= speed * 0.1;
      posArray[i * 6 + 5] -= speed * 0.1;

      // Se a gota atingir o chão, reseta ela lá em cima
      if (posArray[i * 6 + 1] < 0) {
        const x = (Math.random() - 0.5) * 150;
        const y = 40 + Math.random() * 20;
        const z = (Math.random() - 0.5) * 150;
        
        posArray[i * 6] = x;
        posArray[i * 6 + 1] = y;
        posArray[i * 6 + 2] = z;
        
        posArray[i * 6 + 3] = x - 0.1;
        posArray[i * 6 + 4] = y - 0.8;
        posArray[i * 6 + 5] = z - 0.1;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <lineSegments ref={linesRef} geometry={geometry} material={material} />
  );
}
