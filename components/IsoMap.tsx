
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MapControls, SoftShadows, OrthographicCamera, Stars, Environment as DreiEnvironment, Outlines, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { Grid, BuildingType } from '../types';
import { GRID_SIZE, BUILDINGS } from '../constants';

// --- Shared Resources ---
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);
const halfCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, 0, Math.PI);

const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];
const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
const getRandomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// --- Helper Components ---

const WindowBlock = React.memo(({ position, scale, isNight, color }: { position: [number, number, number], scale: [number, number, number], isNight: boolean, color?: string }) => (
  <mesh geometry={boxGeo} position={position} scale={scale}>
    <meshStandardMaterial 
      color={color || (isNight ? "#fef3c7" : "#bfdbfe")} 
      emissive={isNight ? "#f59e0b" : "#bfdbfe"} 
      emissiveIntensity={isNight ? 2 : 0.2} 
      roughness={0.1} 
      metalness={0.8}
    />
  </mesh>
));

const SmokeStack = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => {
  const group = useRef<THREE.Group>(null);
  
  const particles = useMemo(() => Array.from({ length: 6 }).map(() => ({
    offset: Math.random() * 10,
    speed: 0.5 + Math.random() * 0.4,
    xDir: (Math.random() - 0.5) * 0.2,
    zDir: (Math.random() - 0.5) * 0.2
  })), []);

  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime;
      group.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const p = particles[i];
        const age = (t * p.speed + p.offset) % 1;
        
        mesh.position.y = age * 1.5;
        mesh.position.x = Math.sin(age * Math.PI) * p.xDir;
        mesh.position.z = Math.cos(age * Math.PI) * p.zDir;
        
        const s = 0.1 + age * 0.4;
        mesh.scale.setScalar(s);
        
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if(mat) {
             mat.opacity = (age < 0.2 ? age / 0.2 : 1 - (age - 0.2) / 0.8) * 0.5;
        }
      });
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh geometry={cylinderGeo} castShadow receiveShadow position={[0, 0.5, 0]} scale={[0.2, 1, 0.2]}>
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh geometry={cylinderGeo} position={[0, 1, 0]} scale={[0.25, 0.1, 0.25]}>
         <meshStandardMaterial color="#1f2937" />
      </mesh>
      <group ref={group} position={[0, 1.05, 0]}>
        {particles.map((_, i) => (
          <mesh key={i} geometry={sphereGeo}>
            <meshStandardMaterial color="#d1d5db" transparent opacity={0.0} flatShading depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const StreetLamp = React.memo(({ x, y, isNight }: { x: number, y: number, isNight: boolean }) => {
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

// --- Sub-Systems ---

const RainSystem = React.memo(() => {
  const count = 4000;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  
  // Create initial positions
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++){
      pos[i*3] = (Math.random() - 0.5) * 80; // Spread wider than grid
      pos[i*3+1] = Math.random() * 50;       // Height
      pos[i*3+2] = (Math.random() - 0.5) * 80;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!geomRef.current) return;
    const posAttr = geomRef.current.attributes.position;
    const array = posAttr.array as Float32Array;
    const speed = 60 * delta; // Fast falling rain

    for(let i=0; i<count; i++) {
        // Y index is i*3 + 1
        array[i*3 + 1] -= speed;
        if (array[i*3 + 1] < -5) {
            array[i*3 + 1] = 50; // Reset to top
        }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points>
        <bufferGeometry ref={geomRef}>
            <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial 
            color="#a5f3fc" 
            size={0.15} 
            transparent 
            opacity={0.6} 
            sizeAttenuation 
            depthWrite={false}
        />
    </points>
  )
});

const EnvironmentSystem = ({ day, weather }: { day: number, weather: string }) => {
  const { scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    scene.fog = new THREE.FogExp2('#ffffff', 0);
    return () => { scene.fog = null; };
  }, [scene]);

  useFrame(() => {
    const hour = day % 24;
    let skyColor = new THREE.Color('#38bdf8');
    let sunIntensity = 2;
    let fogDensity = 0.002;
    
    if (hour >= 20 || hour < 5) {
       skyColor.set('#0f172a'); sunIntensity = 0; 
    } else if (hour >= 5 && hour < 7) {
       skyColor.set('#fdba74'); sunIntensity = 1;
    } else if (hour >= 18 && hour < 20) {
       skyColor.set('#a855f7'); sunIntensity = 0.5;
    }

    if (weather === 'rain') {
        const rainColor = new THREE.Color('#64748b');
        skyColor.lerp(rainColor, 0.8);
        if (hour >= 20 || hour < 5) skyColor.multiplyScalar(0.1);
        sunIntensity *= 0.2;
        fogDensity = 0.03;
    }
    
    if (scene.background instanceof THREE.Color) scene.background.lerp(skyColor, 0.05);
    else scene.background = skyColor;
    
    if (scene.fog instanceof THREE.FogExp2) {
       scene.fog.density = MathUtils.lerp(scene.fog.density, fogDensity, 0.01);
       scene.fog.color.lerp(skyColor, 0.05);
    }

    if (sunRef.current) {
        const angle = ((hour / 24) * Math.PI * 2) - Math.PI/2;
        sunRef.current.position.set(Math.cos(angle) * 20, Math.sin(angle) * 20, 5);
        sunRef.current.intensity = MathUtils.lerp(sunRef.current.intensity, sunIntensity, 0.05);
        sunRef.current.color.set(weather === 'rain' ? "#c7d2fe" : "#fffbeb");
    }
  });

  return (
    <>
      <directionalLight ref={sunRef} castShadow position={[15, 20, 10]} intensity={2} shadow-mapSize={[2048, 2048]} />
      <ambientLight intensity={weather === 'rain' ? 0.2 : 0.6} color="#cceeff" />
      <DreiEnvironment preset="city" environmentIntensity={weather === 'rain' ? 0.3 : 1} />
      {(day % 24 >= 20 || day % 24 < 5) && weather !== 'rain' && <Stars radius={50} depth={50} count={3000} factor={4} fade />}
    </>
  );
};

interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
  isNight: boolean;
  isHovered?: boolean;
}

const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false, isNight, isHovered }: BuildingMeshProps) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100); 
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  
  // Material Generation
  const materials = useMemo(() => {
    const c = new THREE.Color(baseColor);
    c.offsetHSL(hash * 0.1 - 0.05, 0, hash * 0.2 - 0.1);
    
    return {
      main: new THREE.MeshStandardMaterial({ color: c, flatShading: true, opacity, transparent, roughness: 0.8 }),
      accent: new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.8), flatShading: true, opacity, transparent }),
      roof: new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.6).offsetHSL(0, 0, -0.1), flatShading: true, opacity, transparent }),
      dark: new THREE.MeshStandardMaterial({ color: '#374151', flatShading: true })
    };
  }, [baseColor, hash, opacity, transparent]);

  const commonProps = { castShadow: true, receiveShadow: true };
  const Outline = () => isHovered ? <Outlines thickness={3} color="white" /> : null;
  const yOffset = -0.3;

  return (
    <group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {(() => {
        switch (type) {
          case BuildingType.Residential:
            if (variant < 33) {
              // Cottage
              return (
                <>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[-0.1, 0.25, 0]} scale={[0.5, 0.5, 0.8]}><Outline /></mesh>
                  <mesh {...commonProps} material={materials.roof} geometry={coneGeo} position={[-0.1, 0.65, 0]} scale={[0.4, 0.4, 0.8]} rotation={[0, 0, 0]} />
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0.2, 0.2, 0.1]} scale={[0.4, 0.4, 0.4]} />
                  <mesh {...commonProps} material={materials.roof} geometry={coneGeo} position={[0.2, 0.5, 0.1]} scale={[0.3, 0.3, 0.3]} rotation={[0, Math.PI/2, 0]} />
                  <mesh {...commonProps} material={materials.accent} geometry={boxGeo} position={[-0.2, 0.6, -0.2]} scale={[0.1, 0.4, 0.1]} />
                  <WindowBlock position={[-0.1, 0.25, 0.41]} scale={[0.2, 0.15, 0.05]} isNight={isNight} />
                </>
              );
            } else if (variant < 66) {
              // Modern
              return (
                <>
                  <mesh {...commonProps} material={materials.dark} geometry={boxGeo} position={[-0.1, 0.15, 0]} scale={[0.4, 0.3, 0.4]} />
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 0.45, 0]} scale={[0.7, 0.3, 0.8]}><Outline /></mesh>
                  <mesh {...commonProps} material={materials.accent} geometry={boxGeo} position={[0.1, 0.75, 0]} scale={[0.5, 0.3, 0.6]} />
                  <WindowBlock position={[0, 0.45, 0.41]} scale={[0.5, 0.2, 0.05]} isNight={isNight} />
                  <WindowBlock position={[0.36, 0.75, 0]} scale={[0.05, 0.2, 0.4]} isNight={isNight} />
                </>
              );
            } else {
              // Apartment
              return (
                <>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 0.2, 0]} scale={[0.8, 0.4, 0.8]}><Outline /></mesh>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 0.6, 0]} scale={[0.7, 0.4, 0.7]} />
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 1.0, 0]} scale={[0.5, 0.4, 0.5]} />
                  <WindowBlock position={[0, 0.2, 0.41]} scale={[0.2, 0.15, 0.05]} isNight={isNight} />
                  <WindowBlock position={[0, 0.6, 0.36]} scale={[0.2, 0.15, 0.05]} isNight={isNight} />
                </>
              );
            }

          case BuildingType.Commercial:
            if (variant < 40) {
              // Skyscraper
              return (
                <>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.8, 0.6, 0.8]}><Outline /></mesh>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 0.9, 0]} scale={[0.6, 0.8, 0.6]} />
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 1.5, 0]} scale={[0.4, 0.6, 0.4]} />
                  <mesh {...commonProps} material={materials.dark} geometry={cylinderGeo} position={[0, 1.9, 0]} scale={[0.05, 0.5, 0.05]} />
                  <WindowBlock position={[0, 0.9, 0.31]} scale={[0.2, 0.6, 0.05]} isNight={isNight} />
                </>
              );
            } else if (variant < 70) {
              // Mall
              return (
                <>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.9, 0.6, 0.9]}><Outline /></mesh>
                  <mesh {...commonProps} material={materials.accent} geometry={cylinderGeo} position={[0.25, 0.3, 0.25]} scale={[0.25, 0.65, 0.25]} />
                  <WindowBlock position={[0.25, 0.3, 0.35]} scale={[0.15, 0.4, 0.1]} isNight={isNight} color="#93c5fd" />
                  <mesh {...commonProps} material={materials.dark} geometry={boxGeo} position={[-0.2, 0.62, -0.2]} scale={[0.3, 0.05, 0.3]} />
                </>
              );
            } else {
              // Twin Towers
              return (
                <>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[-0.2, 0.7, 0]} scale={[0.3, 1.4, 0.4]}><Outline /></mesh>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0.2, 0.6, 0]} scale={[0.3, 1.2, 0.4]}><Outline /></mesh>
                  <mesh {...commonProps} material={materials.accent} geometry={boxGeo} position={[0, 0.8, 0]} scale={[0.2, 0.1, 0.2]} />
                  <WindowBlock position={[-0.2, 0.7, 0.21]} scale={[0.2, 1.0, 0.05]} isNight={isNight} color="#60a5fa" />
                  <WindowBlock position={[0.2, 0.6, 0.21]} scale={[0.2, 0.8, 0.05]} isNight={isNight} color="#60a5fa" />
                </>
              );
            }

          case BuildingType.Industrial:
            if (variant < 40) {
              // Factory
              return (
                <>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]}><Outline /></mesh>
                  <mesh {...commonProps} material={materials.roof} geometry={boxGeo} position={[-0.2, 0.9, 0]} scale={[0.25, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <mesh {...commonProps} material={materials.roof} geometry={boxGeo} position={[0.2, 0.9, 0]} scale={[0.25, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <SmokeStack position={[0.2, 0.4, 0.2]} scale={1.0} />
                </>
              );
            } else if (variant < 70) {
              // Refinery
              return (
                <group>
                   <mesh {...commonProps} material={materials.dark} geometry={boxGeo} position={[0, 0.1, 0]} scale={[0.9, 0.2, 0.9]}><Outline /></mesh>
                   <mesh {...commonProps} material={materials.main} geometry={cylinderGeo} position={[-0.25, 0.35, -0.25]} scale={[0.25, 0.5, 0.25]} />
                   <mesh {...commonProps} material={materials.main} geometry={cylinderGeo} position={[0.25, 0.35, 0.25]} scale={[0.2, 0.5, 0.2]} />
                   <mesh {...commonProps} material={materials.accent} geometry={cylinderGeo} position={[0, 0.4, 0]} rotation={[0,0,Math.PI/2]} scale={[0.05, 0.8, 0.05]} />
                </group>
              );
            } else {
              // Warehouse
              return (
                <>
                  <mesh {...commonProps} material={materials.main} geometry={boxGeo} position={[0, 0.25, 0]} scale={[0.8, 0.5, 0.9]}><Outline /></mesh>
                  <mesh {...commonProps} material={materials.roof} geometry={halfCylinderGeo} position={[0, 0.5, 0]} scale={[0.4, 0.9, 0.4]} rotation={[Math.PI/2, 0, 0]} />
                  <mesh {...commonProps} material={materials.accent} geometry={boxGeo} position={[0.3, 0.2, 0]} scale={[0.3, 0.3, 0.5]} />
                </>
              );
            }

          case BuildingType.Park:
             const parkY = -yOffset - 0.29;
             if (variant < 40) {
               // Forest
               const treeCount = 3 + Math.floor(hash * 4);
               return (
                 <group position={[0, parkY, 0]}>
                    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                        <planeGeometry args={[0.9, 0.9]} />
                        <meshStandardMaterial color="#15803d" />
                        <Outline />
                    </mesh>
                    {Array.from({length: treeCount}).map((_, i) => (
                        <group key={i} position={[getRandomRange(-0.3,0.3), 0, getRandomRange(-0.3,0.3)]} scale={0.4 + Math.random()*0.4}>
                            <mesh castShadow material={new THREE.MeshStandardMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                            <mesh castShadow material={new THREE.MeshStandardMaterial({ color: '#166534' })} geometry={coneGeo} position={[0, 0.4, 0]} scale={[0.4, 0.5, 0.4]} />
                        </group>
                    ))}
                 </group>
               );
             } else if (variant < 70) {
               // Plaza
               return (
                 <group position={[0, parkY, 0]}>
                    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                        <planeGeometry args={[0.9, 0.9]} />
                        <meshStandardMaterial color="#e5e5e5" />
                        <Outline />
                    </mesh>
                    <mesh castShadow position={[0, 0.1, 0]} geometry={cylinderGeo} scale={[0.4, 0.2, 0.4]} material={materials.accent} />
                    <mesh position={[0, 0.21, 0]} geometry={cylinderGeo} scale={[0.3, 0.05, 0.3]} material={new THREE.MeshStandardMaterial({color:"#3b82f6"})} />
                 </group>
               )
             } else {
               // Playground
               return (
                 <group position={[0, parkY, 0]}>
                    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                        <planeGeometry args={[0.9, 0.9]} />
                        <meshStandardMaterial color="#d9f99d" />
                        <Outline />
                    </mesh>
                    <mesh position={[-0.2, 0.02, -0.2]} rotation={[-Math.PI/2,0,0]} geometry={sphereGeo} scale={[0.25, 0.25, 0.1]} material={new THREE.MeshStandardMaterial({color:"#fcd34d"})} />
                    <mesh castShadow position={[0.2, 0.2, 0.2]} geometry={boxGeo} scale={[0.3, 0.4, 0.3]} material={new THREE.MeshStandardMaterial({color:"#ef4444"})} />
                 </group>
               )
             }

          case BuildingType.Road:
             return null;
          default:
            return null;
        }
      })()}
    </group>
  );
});

// Ground Tile Component
const GroundTile = React.memo(({ type, x, y, onClick, onHover, onLeave }: any) => {
  const [wx, _, wz] = gridToWorld(x, y);
  const color = type === BuildingType.Road ? '#374151' : (type === BuildingType.None ? '#10b981' : '#d1d5db');
  
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

// Memoized Layer for Static Geometry
const CityLayer = React.memo(({ grid, onTileClick, onHover, onLeave, isNight, hoveredX, hoveredY }: any) => (
  <group>
    {grid.map((row: any[], y: number) =>
      row.map((tile, x) => (
        <React.Fragment key={`${x}-${y}`}>
            <GroundTile type={tile.buildingType} x={x} y={y} onHover={onHover} onLeave={onLeave} onClick={onTileClick} />
            {tile.buildingType === BuildingType.Road && <StreetLamp x={x} y={y} isNight={isNight} />}
            {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && (
                <group position={gridToWorld(x,y) as any}>
                    <ProceduralBuilding 
                        type={tile.buildingType} 
                        baseColor={BUILDINGS[tile.buildingType].color}
                        x={x} y={y} 
                        isNight={isNight} 
                        isHovered={hoveredX === x && hoveredY === y} 
                    />
                </group>
            )}
        </React.Fragment>
      ))
    )}
  </group>
));

// --- Main Component ---

const IsoMap = ({ grid, onTileClick, hoveredTool, population, day }: any) => {
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number} | null>(null);
  const [weather, setWeather] = useState<'clear' | 'rain'>('clear');

  const handleHover = useCallback((x: number, y: number) => setHoveredTile(prev => (prev?.x === x && prev?.y === y ? prev : { x, y })), []);
  const handleLeave = useCallback(() => setHoveredTile(null), []);

  useEffect(() => {
    const i = setInterval(() => Math.random() < 0.2 && setWeather(p => p === 'clear' ? 'rain' : 'clear'), 10000);
    return () => clearInterval(i);
  }, []);

  const hour = day % 24;
  const isNight = hour >= 20 || hour < 5;

  // Preview Logic
  const showPreview = hoveredTile && grid[hoveredTile.y][hoveredTile.x].buildingType === BuildingType.None && hoveredTool !== BuildingType.None;
  const previewPos = hoveredTile ? gridToWorld(hoveredTile.x, hoveredTile.y) : [0,0,0];
  const previewColor = hoveredTool !== BuildingType.None ? BUILDINGS[hoveredTool].color : 'white';

  return (
    <div className="absolute inset-0 bg-sky-900 touch-none">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault zoom={45} position={[20, 20, 20]} near={-100} far={200} />
        <MapControls enableRotate enableZoom minZoom={20} maxZoom={120} maxPolarAngle={Math.PI/2.2} target={[0,-0.5,0]} />

        <EnvironmentSystem day={day} weather={weather} />
        {weather === 'rain' && <RainSystem />}

        <CityLayer 
            grid={grid} 
            onTileClick={onTileClick} 
            onHover={handleHover} 
            onLeave={handleLeave} 
            isNight={isNight} 
            hoveredX={hoveredTile?.x} 
            hoveredY={hoveredTile?.y} 
        />

        {/* Placement Preview */}
        {showPreview && hoveredTile && (
            <group position={[previewPos[0], 0, previewPos[2]]}>
            <ProceduralBuilding 
                type={hoveredTool} 
                baseColor={previewColor} 
                x={hoveredTile.x} 
                y={hoveredTile.y} 
                transparent 
                opacity={0.7}
                isNight={isNight}
            />
            </group>
        )}
        
        {/* Cursor */}
        {hoveredTile && (
            <mesh position={[previewPos[0], -0.25, previewPos[2]]} rotation={[-Math.PI/2,0,0]} raycast={() => null}>
                <planeGeometry args={[1,1]} />
                <meshBasicMaterial color={hoveredTool === BuildingType.None ? "#ef4444" : "white"} transparent opacity={0.3} />
            </mesh>
        )}

        <SoftShadows size={20} samples={16} focus={0.5} />
      </Canvas>
    </div>
  );
};

export default IsoMap;
