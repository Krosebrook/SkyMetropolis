/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BuildingType, Grid } from '../../../../types';
import { GroundTile, StreetLamp, gridToWorld } from './Infrastructure';
import { ProceduralBuilding } from './BuildingMeshes';

interface CityLayerProps {
  grid: Grid;
  onTileClick: (x: number, y: number) => void;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  isNight: boolean;
  hoveredX?: number | null;
  hoveredY?: number | null;
}

export const CityLayer = React.memo(({ grid, onTileClick, onHover, onLeave, isNight, hoveredX, hoveredY }: CityLayerProps) => {
  return (
    <group>
      {grid.map((row, y) =>
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
  );
});