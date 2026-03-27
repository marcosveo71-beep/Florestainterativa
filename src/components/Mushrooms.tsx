import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';

export function Mushrooms({ visible }: { visible: boolean }) {
  const count = 150;
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const capRef = useRef<THREE.InstancedMesh>(null);

  const { stemGeo, capGeo } = useMemo(() => {
    return {
      stemGeo: new THREE.CylinderGeometry(0.08, 0.12, 0.4, 6),
      capGeo: new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    };
  }, []);

  useLayoutEffect(() => {
    if (!stemRef.current || !capRef.current) return;
    const dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();

    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * 140;
      let z = (Math.random() - 0.5) * 140;
      // Evitar nascer no lago
      while (Math.sqrt(x*x + z*z) < 16) { 
        x = (Math.random() - 0.5) * 140;
        z = (Math.random() - 0.5) * 140;
      }
      
      const scale = 0.5 + Math.random() * 1.5;
      
      // Caule
      dummy.position.set(x, 0.2 * scale, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.2, 
        Math.random() * Math.PI, 
        (Math.random() - 0.5) * 0.2
      );
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      stemRef.current.setMatrixAt(i, dummy.matrix);
      
      // Chapéu
      dummy.position.set(x, 0.4 * scale, z);
      dummy.updateMatrix();
      capRef.current.setMatrixAt(i, dummy.matrix);

      // Variação de cor do chapéu (vermelho para laranja)
      const isOrange = Math.random() > 0.5;
      colorObj.set(isOrange ? '#e86a17' : '#d92b18');
      capRef.current.setColorAt(i, colorObj);
    }
    
    stemRef.current.instanceMatrix.needsUpdate = true;
    capRef.current.instanceMatrix.needsUpdate = true;
    if (capRef.current.instanceColor) capRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  if (!visible) return null;

  return (
    <group>
      <instancedMesh ref={stemRef} args={[stemGeo, undefined, count]}>
        <meshStandardMaterial color="#e6e6d8" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[capGeo, undefined, count]}>
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
