import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { controlsState } from './store';

export function Player() {
  const { camera } = useThree();
  // Start the player a bit further back so they can see the lake in front of them
  const position = useRef(new THREE.Vector3(0, 2, 25));
  
  // Target rotations for fluid interpolation
  const targetRotY = useRef(0);
  const targetRotX = useRef(0);
  
  // Current actual rotations
  const currentRotY = useRef(0);
  const currentRotX = useRef(0);
  
  const bobbingTime = useRef(0);

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

  useFrame((state, delta) => {
    // Increased speeds for more sensitivity
    const speed = 18 * delta; 
    const turnSpeed = 3.5 * delta; 

    if (controlsState.turnLeft) targetRotY.current += turnSpeed;
    if (controlsState.turnRight) targetRotY.current -= turnSpeed;

    // Apply touch look deltas with higher sensitivity
    targetRotY.current -= controlsState.lookDeltaX * 0.012;
    targetRotX.current -= controlsState.lookDeltaY * 0.012;
    
    // Reset deltas after applying
    controlsState.lookDeltaX = 0;
    controlsState.lookDeltaY = 0;

    // Clamp vertical rotation (pitch)
    targetRotX.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetRotX.current));

    // Smooth interpolation for fluidity
    const lerpFactor = Math.min(20 * delta, 1);
    currentRotY.current += (targetRotY.current - currentRotY.current) * lerpFactor;
    currentRotX.current += (targetRotX.current - currentRotX.current) * lerpFactor;

    const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), currentRotY.current);
    
    let isMoving = false;
    if (controlsState.forward) {
      position.current.addScaledVector(direction, speed);
      isMoving = true;
    }
    if (controlsState.backward) {
      position.current.addScaledVector(direction, -speed);
      isMoving = true;
    }

    // Keep player within bounds
    position.current.x = Math.max(-150, Math.min(150, position.current.x));
    position.current.z = Math.max(-150, Math.min(150, position.current.z));

    if (isMoving) {
      bobbingTime.current += delta * 12; // Faster bobbing to match faster walk
    } else {
      bobbingTime.current += (0 - bobbingTime.current) * delta * 5;
    }
    
    const bobbingOffset = Math.sin(bobbingTime.current) * 0.15;

    camera.position.copy(position.current);
    camera.position.y += bobbingOffset;
    
    camera.rotation.order = 'YXZ';
    camera.rotation.y = currentRotY.current;
    camera.rotation.x = currentRotX.current;
  });

  return null;
}
