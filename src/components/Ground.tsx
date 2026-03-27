import React from 'react';

export function Ground({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}
