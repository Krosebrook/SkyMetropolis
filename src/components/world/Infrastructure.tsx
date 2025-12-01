/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import * as THREE from 'three';
import { BuildingType } from '../../types';
import { GRID_SIZE } from '../../config/constants';

const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
export const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

export const StreetLamp = React.memo(({ x, y, isNight }: { x: number, y: number, isNight: boolean }) => {
  const [wx, _, wz] = gridToWorld(x, y);
  return (
    <group position={[wx + 0.35, -0.3, wz + 0.35]}>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]} geometry={cylinderGeo} scale={[0.05, 0.8, 0.05]}>
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.2, 0.65, 0]} geometry={sphereGeo} scale={0.08}>
        <meshStandardMaterial 
          color={isNight ? "#fef3c7" : "#e5e7eb"} 
          emissive={isNight ? "#fbbf24" : "#000000"}
          emissiveIntensity={isNight ? 5 : 0} 
        />
      </mesh>
    </group>
  )
});

export const GroundTile = React.memo(({ type, x, y, onClick, onHover, onLeave }: any) => {
  const [wx, _, wz] = gridToWorld(x, y);
  
  // Deterministic color variation for grass based on coordinate hash
  const noise = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  
  let color = '#10b981';
  if (type === BuildingType.None) color = noise > 0.7 ? '#059669' : noise > 0.3 ? '#10b981' : '#34d399';
  else if (type === BuildingType.Road) color = '#374151';
  else color = '#d1d5db';

  return (
    <mesh 
        position={[wx, -0.55, wz]} 
        receiveShadow castShadow
        onPointerEnter={(e) => { e.stopPropagation(); onHover(x, y); }}
        onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
        onPointerDown={(e) => { e.stopPropagation(); onClick(x, y); }}
    >
      <boxGeometry args={[1, 0.5, 1]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
});