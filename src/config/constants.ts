/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BuildingConfig, BuildingType } from '../types';

// Infrastructure Configuration
export const GRID_SIZE = 15;
export const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;

// Simulation Configuration
export const TICK_RATE_MS = 2000;
export const INITIAL_MONEY = 1000;
export const DEMOLISH_COST = 5;
export const MAX_POP_PER_RESIDENTIAL = 50;
export const NO_HOUSING_DECAY = 5;

// Building Definitions
export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  [BuildingType.None]: {
    type: BuildingType.None,
    cost: 0,
    name: 'Bulldoze',
    description: 'Clear a tile',
    color: '#ef4444',
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Road]: {
    type: BuildingType.Road,
    cost: 10,
    name: 'Road',
    description: 'Connects buildings.',
    color: '#374151',
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Residential]: {
    type: BuildingType.Residential,
    cost: 100,
    name: 'House',
    description: '+5 Pop/day',
    color: '#f87171',
    popGen: 5,
    incomeGen: 0,
  },
  [BuildingType.Commercial]: {
    type: BuildingType.Commercial,
    cost: 200,
    name: 'Shop',
    description: '+$15/day',
    color: '#60a5fa',
    popGen: 0,
    incomeGen: 15,
  },
  [BuildingType.Industrial]: {
    type: BuildingType.Industrial,
    cost: 400,
    name: 'Factory',
    description: '+$40/day',
    color: '#facc15',
    popGen: 0,
    incomeGen: 40,
  },
  [BuildingType.Park]: {
    type: BuildingType.Park,
    cost: 50,
    name: 'Park',
    description: 'Looks nice.',
    color: '#4ade80',
    popGen: 1,
    incomeGen: 0,
  },
};