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

// --- Shared Resources (Local for brevity in this output, but ideally in world/CityMeshes.tsx) ---
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];
const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

// --- Sub-Systems ---

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

// Simplified Building Component for Composition
const ProceduralBuilding = React.memo(({ type, x, y, isNight, isHovered }: any) => {
  const hash = getHash(x, y);
  const color = new THREE.Color(BUILDINGS[type].color).offsetHSL(hash*0.1-0.05, 0, hash*0.2-0.1);
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  
  const Outline = () => isHovered ? <Outlines thickness={3} color="white" /> : null;
  const common = { castShadow: true, receiveShadow: true };
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8 }), [color]);

  return (
    <group rotation={[0, rotation, 0]} position={[0, -0.3, 0]}>
        <mesh {...common} material={material} geometry={boxGeo} position={[0, 0.5, 0]} scale={[0.8, 0.8 + hash, 0.8]}>
            <Outline />
        </mesh>
        {isNight && (
            <mesh position={[0, 0.5, 0.41]} geometry={boxGeo} scale={[0.4, 0.2, 0.05]}>
                <meshStandardMaterial color="#fef3c7" emissive="#f59e0b" emissiveIntensity={2} />
            </mesh>
        )}
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
            {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && (
                <group position={gridToWorld(x,y) as any}>
                    <ProceduralBuilding type={tile.buildingType} x={x} y={y} isNight={isNight} isHovered={hoveredX === x && hoveredY === y} />
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

  return (
    <div className="absolute inset-0 bg-sky-900 touch-none">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault zoom={45} position={[20, 20, 20]} near={-100} far={200} />
        <MapControls enableRotate enableZoom minZoom={20} maxZoom={120} maxPolarAngle={Math.PI/2.2} target={[0,-0.5,0]} />

        <EnvironmentSystem day={day} weather={weather} />

        <CityLayer 
            grid={grid} 
            onTileClick={onTileClick} 
            onHover={handleHover} 
            onLeave={handleLeave} 
            isNight={isNight} 
            hoveredX={hoveredTile?.x} 
            hoveredY={hoveredTile?.y} 
        />

        {showPreview && (
             <mesh position={previewPos as any} position-y={0}>
                 <boxGeometry args={[0.9, 0.9, 0.9]} />
                 <meshStandardMaterial color="white" transparent opacity={0.5} />
             </mesh>
        )}
        
        {hoveredTile && <mesh position={[previewPos[0], -0.25, previewPos[2]]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1,1]} /><meshBasicMaterial color="white" transparent opacity={0.3} /></mesh>}

        <SoftShadows size={20} samples={16} focus={0.5} />
      </Canvas>
    </div>
  );
};

export default IsoMap;
