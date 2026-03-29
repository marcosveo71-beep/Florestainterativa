import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { controlsState, treeColliders } from './store';
import { socket } from '../socket';

export function Player() {
  const { camera } = useThree();
  
  const group = useRef<THREE.Group>(null);
  const position = useRef(new THREE.Vector3(0, 0, 25));
  
  // Carrega o modelo 3D e suas animações da internet (Robot Expressive)
  const { scene, animations } = useGLTF('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb');
  const { actions } = useAnimations(animations, group);
  
  // Camera orbit angles
  const cameraAzimuth = useRef(0); // Horizontal angle
  const cameraElevation = useRef(0.2); // Vertical angle
  const cameraRadius = 6; // Distance from player
  
  // Player rotation (facing direction)
  const targetPlayerRotation = useRef(0);
  const currentPlayerRotation = useRef(0);
  
  const [currentAction, setCurrentAction] = useState('Idle');
  const [playerColor, setPlayerColor] = useState('#ffffff');
  
  // Network sync timer
  const lastSyncTime = useRef(0);

  useEffect(() => {
    const onCurrentPlayers = (currentPlayers: any) => {
      if (currentPlayers[socket.id!]) {
        setPlayerColor(currentPlayers[socket.id!].color);
      }
    };
    
    socket.on('currentPlayers', onCurrentPlayers);
    
    return () => {
      socket.off('currentPlayers', onCurrentPlayers);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') controlsState.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') controlsState.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') controlsState.turnLeft = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') controlsState.turnRight = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') controlsState.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') controlsState.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') controlsState.turnLeft = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') controlsState.turnRight = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Transição suave entre as animações (Idle <-> Walking)
  useEffect(() => {
    if (actions && actions[currentAction]) {
      const action = actions[currentAction];
      action.reset().fadeIn(0.2).play();
      return () => {
        action.fadeOut(0.2);
      };
    }
  }, [currentAction, actions]);

  // Habilita sombras no modelo e aplica a cor
  const clone = React.useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(m => m.clone());
            mesh.material.forEach(m => {
              if ((m as THREE.MeshStandardMaterial).color) {
                (m as THREE.MeshStandardMaterial).color.set(playerColor);
              }
            });
          } else {
            mesh.material = (mesh.material as THREE.Material).clone();
            if ((mesh.material as THREE.MeshStandardMaterial).color) {
              (mesh.material as THREE.MeshStandardMaterial).color.set(playerColor);
            }
          }
        }
      }
    });
    
    return cloned;
  }, [scene, playerColor]);

  useFrame((state, delta) => {
    if (!group.current) return;

    // 1. Update Camera Orbit Angles from input
    cameraAzimuth.current -= controlsState.lookDeltaX * 0.01;
    cameraElevation.current -= controlsState.lookDeltaY * 0.01;
    
    // Clamp elevation to prevent going under the ground or too far over the head
    cameraElevation.current = Math.max(-0.1, Math.min(Math.PI / 2.5, cameraElevation.current));
    
    controlsState.lookDeltaX = 0;
    controlsState.lookDeltaY = 0;

    // 2. Calculate Movement relative to camera
    const speed = 8 * delta; // Ajustado para combinar com a animação de caminhada
    const moveDir = new THREE.Vector3(0, 0, 0);
    
    if (controlsState.forward) moveDir.z -= 1;
    if (controlsState.backward) moveDir.z += 1;
    if (controlsState.turnLeft) moveDir.x -= 1;
    if (controlsState.turnRight) moveDir.x += 1;

    let isMoving = moveDir.lengthSq() > 0;

    if (isMoving) {
      moveDir.normalize();
      // Rotate movement vector by camera's azimuth so "forward" is always where the camera is looking
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAzimuth.current);
      
      let nextX = position.current.x + moveDir.x * speed;
      let nextZ = position.current.z + moveDir.z * speed;

      // Tree collision detection and resolution
      const playerRadius = 0.5;
      for (const tree of treeColliders) {
        const dx = nextX - tree.x;
        const dz = nextZ - tree.z;
        const distSq = dx * dx + dz * dz;
        const minDistance = playerRadius + tree.radius;
        
        if (distSq < minDistance * minDistance) {
          // Resolve collision by pushing player out of the tree radius
          const dist = Math.sqrt(distSq);
          const overlap = minDistance - dist;
          // Avoid division by zero
          if (dist > 0.001) {
            nextX += (dx / dist) * overlap;
            nextZ += (dz / dist) * overlap;
          }
        }
      }

      position.current.x = nextX;
      position.current.z = nextZ;
      
      // Calculate target rotation for the dummy to face the movement direction
      targetPlayerRotation.current = Math.atan2(moveDir.x, moveDir.z);
      
      if (currentAction !== 'Walking') setCurrentAction('Walking');
    } else {
      if (currentAction !== 'Idle') setCurrentAction('Idle');
    }

    // Keep within bounds
    position.current.x = Math.max(-145, Math.min(145, position.current.x));
    position.current.z = Math.max(-145, Math.min(145, position.current.z));

    // 3. Update Dummy Position and Rotation
    group.current.position.copy(position.current);
    
    // Smoothly rotate player
    let diff = targetPlayerRotation.current - currentPlayerRotation.current;
    // Normalize angle difference to -PI to PI for shortest rotation path
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    currentPlayerRotation.current += diff * Math.min(15 * delta, 1);
    
    group.current.rotation.y = currentPlayerRotation.current;

    // 4. Update Camera Position (Orbit)
    const idealCameraPos = new THREE.Vector3(
      position.current.x + cameraRadius * Math.sin(cameraAzimuth.current) * Math.cos(cameraElevation.current),
      position.current.y + 1.5 + cameraRadius * Math.sin(cameraElevation.current),
      position.current.z + cameraRadius * Math.cos(cameraAzimuth.current) * Math.cos(cameraElevation.current)
    );

    // Smoothly move camera to ideal position
    camera.position.lerp(idealCameraPos, Math.min(15 * delta, 1));
    
    // Look at player's head/upper body
    const lookAtTarget = new THREE.Vector3(
      position.current.x,
      position.current.y + 1.2,
      position.current.z
    );
    camera.lookAt(lookAtTarget);

    // 5. Network Sync
    const now = state.clock.getElapsedTime();
    if (now - lastSyncTime.current > 0.05) { // Sync at 20fps
      socket.emit('playerMovement', {
        x: position.current.x,
        y: position.current.y,
        z: position.current.z,
        rotation: currentPlayerRotation.current,
        action: currentAction
      });
      lastSyncTime.current = now;
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={clone} scale={0.4} position={[0, 0, 0]} />
    </group>
  );
}

// Preload the model so it's ready instantly
useGLTF.preload('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb');
