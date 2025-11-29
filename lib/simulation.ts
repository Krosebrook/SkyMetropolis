/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BuildingType, CityStats, Grid } from '../types';
import { BUILDINGS, GRID_SIZE } from '../constants';

export const calculateNextDay = (currentStats: CityStats, grid: Grid): CityStats => {
  let dailyIncome = 0;
  let dailyPopGrowth = 0;
  let residentialCount = 0;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const type = grid[y][x].buildingType;
      if (type !== BuildingType.None) {
        const config = BUILDINGS[type];
        if (config) {
          dailyIncome += config.incomeGen;
          dailyPopGrowth += config.popGen;
          if (type === BuildingType.Residential) residentialCount++;
        }
      }
    }
  }

  const maxPop = residentialCount * 50; 
  let newPop = currentStats.population + dailyPopGrowth;
  
  if (newPop > maxPop) newPop = maxPop;
  
  if (residentialCount === 0 && currentStats.population > 0) {
    newPop = Math.max(0, currentStats.population - 5);
  }

  return {
    money: currentStats.money + dailyIncome,
    population: newPop,
    day: currentStats.day + 1,
  };
};

export const canAffordBuilding = (currentMoney: number, type: BuildingType): boolean => {
  const cost = BUILDINGS[type]?.cost || 0;
  return currentMoney >= cost;
};
