
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BuildingType, CityStats, Grid } from '../../../types';
import { 
  BUILDINGS, 
  GRID_SIZE, 
  DEMOLISH_COST, 
  MAX_POP_PER_RESIDENTIAL, 
  NO_HOUSING_DECAY 
} from '../../../config/constants';

/**
 * Calculates the next day's economy state based on the current grid configuration.
 * Pure function: Deterministic output for a given input state.
 */
export const calculateNextDay = (currentStats: CityStats, grid: Grid): CityStats => {
  let dailyIncome = 0;
  let dailyPopGrowth = 0;
  let residentialCount = 0;

  // Single-pass grid analysis for O(N^2) efficiency
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = grid[y][x];
      const type = tile.buildingType;
      
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

  // Population Simulation Logic
  const maxPop = residentialCount * MAX_POP_PER_RESIDENTIAL;
  let newPop = currentStats.population + dailyPopGrowth;
  
  // Enforce Population Cap
  if (newPop > maxPop) {
    newPop = maxPop;
  }
  
  // Decay Mechanism: Population leaves if no housing exists
  if (residentialCount === 0 && currentStats.population > 0) {
    newPop = Math.max(0, currentStats.population - NO_HOUSING_DECAY);
  }

  return {
    money: currentStats.money + dailyIncome,
    population: newPop,
    day: currentStats.day + 1,
  };
};

/**
 * Validates if the player can afford a specific building action.
 */
export const canAfford = (currentMoney: number, type: BuildingType): boolean => {
  if (type === BuildingType.None) {
    return currentMoney >= DEMOLISH_COST;
  }
  const cost = BUILDINGS[type]?.cost || 0;
  return currentMoney >= cost;
};

/**
 * Evaluates goal completion criteria against current city state.
 */
export const checkGoalCompletion = (grid: Grid, stats: CityStats, goal: any): boolean => {
  if (!goal || goal.completed) return false;

  if (goal.targetType === 'money' && stats.money >= goal.targetValue) return true;
  if (goal.targetType === 'population' && stats.population >= goal.targetValue) return true;
  
  if (goal.targetType === 'building_count' && goal.buildingType) {
    let count = 0;
    // We could optimize this by passing a pre-calculated map if grid is large
    for (const row of grid) {
      for (const tile of row) {
        if (tile.buildingType === goal.buildingType) count++;
      }
    }
    if (count >= goal.targetValue) return true;
  }
  
  return false;
};
