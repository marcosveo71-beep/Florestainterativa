export const controlsState = {
  forward: false,
  backward: false,
  turnLeft: false,
  turnRight: false,
  lookDeltaX: 0,
  lookDeltaY: 0,
};

export const remotePlayersState: Record<string, any> = {};

export const localPlayerState = {
  color: '#ffffff',
};

export const treeColliders: { x: number, z: number, radius: number }[] = [];

export const treeGroupsData = (() => {
  const totalTrees = 80;
  const variations = 4;
  const treesPerVariation = Math.ceil(totalTrees / variations);
  
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

      // Add to colliders (radius proportional to scale)
      treeColliders.push({ x, z, radius: scale * 1.5 });
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
})();
