
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingType } from '../../../../types';
import { BUILDINGS } from '../../../../config/constants';

// Shared Geometries for instancing-like performance
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);
const halfCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, 0, Math.PI);

const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

// --- Helpers ---
const WindowBlock = React.memo(({ position, scale, isNight, color }: any) => (
  <mesh geometry={boxGeo} position={position} scale={scale}>
    <meshStandardMaterial 
      color={color || (isNight ? "#fef3c7" : "#bfdbfe")} 
      emissive={isNight ? "#f59e0b" : "#bfdbfe"} 
      emissiveIntensity={isNight ? 2 : 0.2} 
      roughness={0.1} metalness={0.8}
    />
  </mesh>
));

const SmokeStack = ({ position, scale = 1 }: any) => {
  const group = useRef<THREE.Group>(null);
  const particles = useMemo(() => Array.from({ length: 6 }).map(() => ({
    offset: Math.random() * 10, speed: 0.5 + Math.random() * 0.4,
    xDir: (Math.random() - 0.5) * 0.2, zDir: (Math.random() - 0.5) * 0.2
  })), []);

  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime;
      group.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const p = particles[i];
        const age = (t * p.speed + p.offset) % 1;
        mesh.position.set(Math.sin(age * Math.PI) * p.xDir, age * 1.5, Math.cos(age * Math.PI) * p.zDir);
        mesh.scale.setScalar(0.1 + age * 0.4);
        (mesh.material as THREE.MeshStandardMaterial).opacity = (age < 0.2 ? age / 0.2 : 1 - (age - 0.2) / 0.8) * 0.5;
      });
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh geometry={cylinderGeo} castShadow receiveShadow position={[0, 0.5, 0]} scale={[0.2, 1, 0.2]} material={new THREE.MeshStandardMaterial({color: "#4b5563"})} />
      <group ref={group} position={[0, 1.05, 0]}>
        {particles.map((_, i) => <mesh key={i} geometry={sphereGeo} material={new THREE.MeshStandardMaterial({color: "#d1d5db", transparent: true, opacity: 0})} />)}
      </group>
    </group>
  );
};

// --- Main Building Component ---
interface BuildingProps {
  type: BuildingType;
  x: number;
  y: number;
  isNight: boolean;
  isHovered?: boolean;
  opacity?: number;
  transparent?: boolean;
  baseColor?: string;
}

export const ProceduralBuilding = React.memo(({ type, x, y, isNight, isHovered, opacity=1, transparent=false, baseColor }: BuildingProps) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100);
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  const color = baseColor || BUILDINGS[type]?.color || '#ffffff';

  const materials = useMemo(() => {
    const c = new THREE.Color(color);
    c.offsetHSL(hash * 0.1 - 0.05, 0, hash * 0.2 - 0.1);
    return {
      main: new THREE.MeshStandardMaterial({ color: c, flatShading: true, opacity, transparent, roughness: 0.8 }),
      accent: new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.8), flatShading: true, opacity, transparent }),
      roof: new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.6).offsetHSL(0, 0, -0.1), flatShading: true, opacity, transparent }),
      dark: new THREE.MeshStandardMaterial({ color: '#374151', flatShading: true })
    };
  }, [color, hash, opacity, transparent]);

  const common = { castShadow: true, receiveShadow: true };
  const Outline = () => isHovered ? <Outlines thickness={3} color="white" /> : null;

  return (
    <group rotation={[0, rotation, 0]} position={[0, -0.3, 0]}>
       {/* --- RESIDENTIAL --- */}
       {type === BuildingType.Residential && (
         variant < 33 ? (
            <>
              <mesh {...common} material={materials.main} geometry={boxGeo} position={[-0.1, 0.25, 0]} scale={[0.5, 0.5, 0.8]}><Outline /></mesh>
              <mesh {...common} material={materials.roof} geometry={coneGeo} position={[-0.1, 0.65, 0]} scale={[0.4, 0.4, 0.8]} />
              <WindowBlock position={[-0.1, 0.25, 0.41]} scale={[0.2, 0.15, 0.05]} isNight={isNight} />
            </>
         ) : variant < 66 ? (
            <>
              <mesh {...common} material={materials.main} geometry={boxGeo} position={[0, 0.45, 0]} scale={[0.7, 0.3, 0.8]}><Outline /></mesh>
              <mesh {...common} material={materials.dark} geometry={boxGeo} position={[-0.1, 0.15, 0]} scale={[0.4, 0.3, 0.4]} />
              <WindowBlock position={[0, 0.45, 0.41]} scale={[0.5, 0.2, 0.05]} isNight={isNight} />
            </>
         ) : (
            <>
              <mesh {...common} material={materials.main} geometry={boxGeo} position={[0, 0.2, 0]} scale={[0.8, 0.4, 0.8]}><Outline /></mesh>
              <mesh {...common} material={materials.main} geometry={boxGeo} position={[0, 0.6, 0]} scale={[0.7, 0.4, 0.7]} />
              <WindowBlock position={[0, 0.2, 0.41]} scale={[0.2, 0.15, 0.05]} isNight={isNight} />
            </>
         )
       )}

       {/* --- COMMERCIAL --- */}
       {type === BuildingType.Commercial && (
         variant < 50 ? (
            <>
               <mesh {...common} material={materials.main} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.8, 0.6, 0.8]}><Outline /></mesh>
               <mesh {...common} material={materials.main} geometry={boxGeo} position={[0, 0.9, 0]} scale={[0.6, 0.8, 0.6]} />
               <mesh {...common} material={materials.dark} geometry={cylinderGeo} position={[0, 1.5, 0]} scale={[0.05, 0.5, 0.05]} />
               <WindowBlock position={[0, 0.9, 0.31]} scale={[0.2, 0.6, 0.05]} isNight={isNight} />
            </>
         ) : (
            <>
               <mesh {...common} material={materials.main} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.9, 0.6, 0.9]}><Outline /></mesh>
               <mesh {...common} material={materials.accent} geometry={cylinderGeo} position={[0.25, 0.3, 0.25]} scale={[0.25, 0.65, 0.25]} />
               <WindowBlock position={[0.25, 0.3, 0.35]} scale={[0.15, 0.4, 0.1]} isNight={isNight} color="#93c5fd" />
            </>
         )
       )}

       {/* --- INDUSTRIAL --- */}
       {type === BuildingType.Industrial && (
         variant < 50 ? (
            <>
               <mesh {...common} material={materials.main} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]}><Outline /></mesh>
               <SmokeStack position={[0.2, 0.4, 0.2]} scale={1.0} />
            </>
         ) : (
            <>
               <mesh {...common} material={materials.dark} geometry={boxGeo} position={[0, 0.1, 0]} scale={[0.9, 0.2, 0.9]}><Outline /></mesh>
               <mesh {...common} material={materials.main} geometry={cylinderGeo} position={[-0.25, 0.35, -0.25]} scale={[0.25, 0.5, 0.25]} />
            </>
         )
       )}
       
       {/* --- PARK --- */}
       {type === BuildingType.Park && (
         <group position={[0, -0.29, 0]}>
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <planeGeometry args={[0.9, 0.9]} />
                <meshStandardMaterial color="#15803d" />
                <Outline />
            </mesh>
            <mesh castShadow material={new THREE.MeshStandardMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
            <mesh castShadow material={new THREE.MeshStandardMaterial({ color: '#166534' })} geometry={coneGeo} position={[0, 0.4, 0]} scale={[0.4, 0.5, 0.4]} />
         </group>
       )}
    </group>
  );
});
