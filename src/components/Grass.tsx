import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function Grass({ color }: { color: string }) {
  const count = 30000; // 30,000 blades of grass (very lightweight because it's just 1 triangle each)
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // A simple blade of grass (triangle)
    // Base at y=0, tip at y=1
    const vertices = new Float32Array([
      -0.05, 0, 0,
       0.05, 0, 0,
       0.0,  1, 0
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * 150;
      let z = (Math.random() - 0.5) * 150;
      
      // Avoid spawning grass inside the lake
      while (Math.sqrt(x*x + z*z) < 14) {
        x = (Math.random() - 0.5) * 150;
        z = (Math.random() - 0.5) * 150;
      }
      
      dummy.position.set(x, 0, z);
      dummy.rotation.y = Math.random() * Math.PI;
      // Random height and width for more detail
      dummy.scale.set(1 + Math.random(), 0.5 + Math.random() * 2.5, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // Color variation (some blades are lighter, some darker)
      const shade = 0.6 + Math.random() * 0.6;
      colorObj.setRGB(shade, shade, shade);
      meshRef.current.setColorAt(i, colorObj);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = `
      uniform float uTime;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      // Simple wind effect based on world position and time
      vec4 worldPos = instanceMatrix * vec4(position, 1.0);
      float sway = sin(worldPos.x * 0.5 + uTime) * 0.2 + 
                   sin(worldPos.z * 0.5 + uTime * 1.2) * 0.2;
      // Only sway the top of the grass (where position.y > 0)
      transformed.x += sway * position.y;
      transformed.z += sway * position.y * 0.5;
      `
    );
    materialRef.current!.userData.shader = shader;
  };

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshStandardMaterial 
        ref={materialRef}
        color={color}
        side={THREE.DoubleSide}
        roughness={0.8}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}
