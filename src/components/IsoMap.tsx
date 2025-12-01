/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls, OrthographicCamera, SoftShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Grid, BuildingType } from '../types';
import { BUILDINGS } from '../config/constants';
import { EnvironmentSystem, RainSystem } from './world/Environment';
import { GroundTile, StreetLamp, gridToWorld } from './world/Infrastructure';
import { ProceduralBuilding } from './world/BuildingMeshes';
import { TrafficSystem } from './world/Entities';

// Memoized City Layer: Static geometry that updates infrequently
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

const IsoMap = ({ grid, onTileClick, hoveredTool, population, day }: any) => {
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number} | null>(null);
  const [weather, setWeather] = useState<'clear' | 'rain'>('clear');

  const handleHover = useCallback((x: number, y: number) => setHoveredTile(prev => (prev?.x === x && prev?.y === y ? prev : { x, y })), []);
  const handleLeave = useCallback(() => setHoveredTile(null), []);

  useEffect(() => {
    // Dynamic weather loop
    const i = setInterval(() => Math.random() < 0.2 && setWeather(p => p === 'clear' ? 'rain' : 'clear'), 10000);
    return () => clearInterval(i);
  }, []);

  const hour = day % 24;
  const isNight = hour >= 20 || hour < 5;
  
  // Placement Preview Logic
  const showPreview = hoveredTile && grid[hoveredTile.y][hoveredTile.x].buildingType === BuildingType.None && hoveredTool !== BuildingType.None;
  const previewPos = hoveredTile ? gridToWorld(hoveredTile.x, hoveredTile.y) : [0,0,0];
  const previewColor = hoveredTool !== BuildingType.None ? BUILDINGS[hoveredTool].color : 'white';

  return (
    <div className="absolute inset-0 bg-sky-900 touch-none">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault zoom={45} position={[20, 20, 20]} near={-100} far={200} />
        <MapControls enableRotate enableZoom minZoom={20} maxZoom={120} maxPolarAngle={Math.PI/2.2} target={[0,-0.5,0]} />

        {/* Visual Systems */}
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
        
        <TrafficSystem grid={grid} />

        {/* Interactive Overlays */}
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