/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, Environment as DreiEnvironment, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { GRID_SIZE } from '../../constants';

// --- Rain System ---
export const RainSystem = React.memo(() => {
  const count = 3000;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  
  // Memoize initial positions to avoid recalculation on re-renders
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++){
      pos[i*3] = (Math.random() - 0.5) * 80; 
      pos[i*3+1] = Math.random() * 50;       
      pos[i*3+2] = (Math.random() - 0.5) * 80;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!geomRef.current) return;
    const posAttr = geomRef.current.attributes.position;
    const array = posAttr.array as Float32Array;
    const speed = 60 * delta; 

    for(let i=0; i<count; i++) {
        array[i*3 + 1] -= speed;
        if (array[i*3 + 1] < -5) array[i*3 + 1] = 50;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points>
        <bufferGeometry ref={geomRef}>
            <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#a5f3fc" size={0.15} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  )
});

// --- Atmosphere & Lighting ---
export const EnvironmentSystem = React.memo(({ day, weather }: { day: number, weather: string }) => {
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
    
    // Cycle Logic
    if (hour >= 20 || hour < 5) { // Night
       skyColor.set('#0f172a'); sunIntensity = 0; 
    } else if (hour >= 5 && hour < 7) { // Dawn
       skyColor.set('#fdba74'); sunIntensity = 1;
    } else if (hour >= 18 && hour < 20) { // Dusk
       skyColor.set('#a855f7'); sunIntensity = 0.5;
    }

    // Weather Override
    if (weather === 'rain') {
        const rainColor = new THREE.Color('#64748b');
        skyColor.lerp(rainColor, 0.8);
        if (hour >= 20 || hour < 5) skyColor.multiplyScalar(0.1);
        sunIntensity *= 0.2;
        fogDensity = 0.03;
    }
    
    // Apply changes
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
      
      {/* Water Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[GRID_SIZE * 4, GRID_SIZE * 4, 32, 32]} />
        <MeshDistortMaterial
            color="#3b82f6"
            speed={2}
            distort={0.2}
            radius={1}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.8}
        />
      </mesh>
    </>
  );
});
