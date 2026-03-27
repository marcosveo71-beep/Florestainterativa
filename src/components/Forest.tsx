import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Tree } from '@dgreenheck/ez-tree';
import * as THREE from 'three';

function InstancedTreeGroup({ seed, count, positions, rotations, scales, leafColor }: any) {
  const { tree, branchGeo, branchMat, leafGeo, leafMat } = useMemo(() => {
    const t = new Tree();
    t.options.seed = seed;
    t.options.branch.levels = 2;
    t.options.branch.sections = { 0: 5, 1: 3, 2: 2, 3: 2 };
    t.options.branch.segments = { 0: 5, 1: 4, 2: 3, 3: 3 };
    t.options.leaves.count = 20;
    t.options.leaves.size = 2.2;
    t.generate();

    const bMat = t.branchesMesh.material as THREE.MeshStandardMaterial;
    const lMat = t.leavesMesh.material as THREE.MeshStandardMaterial;

    // Patch ez-tree's shader to support InstancedMesh
    const patchMaterial = (mat: THREE.MeshStandardMaterial) => {
      const originalOnBeforeCompile = mat.onBeforeCompile;
      mat.onBeforeCompile = (shader, renderer) => {
        originalOnBeforeCompile(shader, renderer);
        shader.vertexShader = shader.vertexShader.replace(
          'vec4 mvPosition = vec4(transformed, 1.0);',
          `vec4 mvPosition = vec4(transformed, 1.0);
           #ifdef USE_INSTANCING
             mvPosition = instanceMatrix * mvPosition;
           #endif`
        );
      };
      mat.customProgramCacheKey = () => 'instanced_ez_tree';
    };

    patchMaterial(bMat);
    patchMaterial(lMat);

    return {
      tree: t,
      branchGeo: t.branchesMesh.geometry,
      branchMat: bMat,
      leafGeo: t.leavesMesh.geometry,
      leafMat: lMat,
    };
  }, [seed]);

  useLayoutEffect(() => {
    if (leafMat) {
      leafMat.color.set(leafColor);
      leafMat.needsUpdate = true;
    }
  }, [leafColor, leafMat]);

  const branchInstancedRef = useRef<THREE.InstancedMesh>(null);
  const leafInstancedRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!branchInstancedRef.current || !leafInstancedRef.current) return;
    
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.fromArray(positions[i]);
      dummy.rotation.fromArray(rotations[i]);
      dummy.scale.fromArray(scales[i]);
      dummy.updateMatrix();
      
      branchInstancedRef.current.setMatrixAt(i, dummy.matrix);
      leafInstancedRef.current.setMatrixAt(i, dummy.matrix);
    }
    branchInstancedRef.current.instanceMatrix.needsUpdate = true;
    leafInstancedRef.current.instanceMatrix.needsUpdate = true;
  }, [count, positions, rotations, scales]);

  useFrame((state) => {
    if (tree) {
      tree.update(state.clock.getElapsedTime());
    }
  });

  return (
    <group>
      <instancedMesh ref={branchInstancedRef} args={[branchGeo, branchMat, count]} />
      <instancedMesh ref={leafInstancedRef} args={[leafGeo, leafMat, count]} />
    </group>
  );
}

export function Forest({ leafColor }: { leafColor: string }) {
  const totalTrees = 80;
  const variations = 4;
  const treesPerVariation = Math.ceil(totalTrees / variations);
  
  const treeGroups = useMemo(() => {
    const groups = [];
    for (let v = 0; v < variations; v++) {
      const positions = [];
      const rotations = [];
      const scales = [];
      
      for (let i = 0; i < treesPerVariation; i++) {
        let x = (Math.random() - 0.5) * 150;
        let z = (Math.random() - 0.5) * 150;
        
        // Avoid spawning trees in the lake area
        while (Math.sqrt(x*x + z*z) < 18) {
          x = (Math.random() - 0.5) * 150;
          z = (Math.random() - 0.5) * 150;
        }

        const scale = 0.8 + Math.random() * 0.8;
        const rotationY = Math.random() * Math.PI * 2;
        
        positions.push([x, 0, z]);
        rotations.push([0, rotationY, 0]);
        scales.push([scale, scale, scale]);
      }
      
      groups.push({
        seed: Math.floor(Math.random() * 100000),
        count: treesPerVariation,
        positions,
        rotations,
        scales
      });
    }
    return groups;
  }, [variations, treesPerVariation]);

  return (
    <group>
      {treeGroups.map((group, i) => (
        <InstancedTreeGroup key={i} {...group} leafColor={leafColor} />
      ))}
    </group>
  );
}
