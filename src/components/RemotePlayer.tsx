import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

export function RemotePlayer({ id, playerState }: { id: string, playerState: any }) {
  const group = useRef<THREE.Group>(null);
  
  // Load the same model
  const { scene, animations } = useGLTF('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb');
  
  // Clone the scene so each player has their own instance and materials
  const clone = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    
    // Apply color tint to the materials
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Clone material so we don't affect other players
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(m => m.clone());
            mesh.material.forEach(m => {
              if ((m as THREE.MeshStandardMaterial).color) {
                (m as THREE.MeshStandardMaterial).color.set(playerState.color);
              }
            });
          } else {
            mesh.material = (mesh.material as THREE.Material).clone();
            if ((mesh.material as THREE.MeshStandardMaterial).color) {
              (mesh.material as THREE.MeshStandardMaterial).color.set(playerState.color);
            }
          }
        }
      }
    });
    
    return cloned;
  }, [scene, playerState.color]);

  const { actions } = useAnimations(animations, group);

  // Handle animations
  useEffect(() => {
    const actionName = playerState.action || 'Idle';
    if (actions && actions[actionName]) {
      const action = actions[actionName];
      action.reset().fadeIn(0.2).play();
      return () => {
        action.fadeOut(0.2);
      };
    }
  }, [playerState.action, actions]);

  // Handle movement interpolation
  useFrame((state, delta) => {
    if (!group.current) return;
    
    // Smoothly interpolate position
    const targetPos = new THREE.Vector3(playerState.x, playerState.y, playerState.z);
    group.current.position.lerp(targetPos, Math.min(15 * delta, 1));
    
    // Smoothly interpolate rotation
    let diff = playerState.rotation - group.current.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    group.current.rotation.y += diff * Math.min(15 * delta, 1);
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={clone} scale={0.4} position={[0, 0, 0]} />
    </group>
  );
}
