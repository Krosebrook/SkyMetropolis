/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { Grid, CityStats, BuildingType, AIGoal, NewsItem, TileData } from '../types';
import { GRID_SIZE, BUILDINGS, INITIAL_MONEY } from '../constants';
import { audioService } from '../services/audioService';
import { calculateNextDay, canAffordBuilding } from '../lib/simulation';

const createInitialGrid = (): Grid => {
  const grid: Grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, buildingType: BuildingType.None });
    }
    grid.push(row);
  }
  return grid;
};

const INITIAL_STATS: CityStats = { money: INITIAL_MONEY, population: 0, day: 1 };

interface GridSlice {
  grid: Grid;
  selectedTool: BuildingType;
  setTool: (tool: BuildingType) => void;
  placeBuilding: (x: number, y: number) => void;
  resetGrid: () => void;
}

const createGridSlice: StateCreator<GameStore, [], [], GridSlice> = (set, get) => ({
  grid: createInitialGrid(),
  selectedTool: BuildingType.Road,
  
  setTool: (tool) => set({ selectedTool: tool }),
  
  resetGrid: () => set({ grid: createInitialGrid(), selectedTool: BuildingType.Road }),

  placeBuilding: (x, y) => {
    const { grid, stats, selectedTool, isPaused, addNews } = get();
    if (isPaused) return;

    const tile = grid[y][x];
    const config = BUILDINGS[selectedTool];

    if (selectedTool === BuildingType.None) {
      if (tile.buildingType !== BuildingType.None) {
        const demolishCost = 5;
        if (stats.money >= demolishCost) {
          const newGrid = [...grid];
          newGrid[y] = [...newGrid[y]];
          newGrid[y][x] = { ...tile, buildingType: BuildingType.None };
          
          set((state) => ({ 
            grid: newGrid, 
            stats: { ...state.stats, money: state.stats.money - demolishCost } 
          }));
          audioService.play('bulldoze');
        } else {
          addNews({ id: Date.now().toString(), text: "Cannot afford demolition.", type: 'negative' });
          audioService.play('error');
        }
      }
      return;
    }

    if (tile.buildingType === BuildingType.None) {
      if (canAffordBuilding(stats.money, selectedTool)) {
        const newGrid = [...grid];
        newGrid[y] = [...newGrid[y]];
        newGrid[y][x] = { ...tile, buildingType: selectedTool };

        set((state) => ({
          grid: newGrid,
          stats: { ...state.stats, money: state.stats.money - config.cost }
        }));
        audioService.play('build');
      } else {
        addNews({ id: Date.now().toString(), text: `Insufficient funds for ${config.name}.`, type: 'negative' });
        audioService.play('error');
      }
    }
  },
});

interface EconomySlice {
  gameStarted: boolean;
  isPaused: boolean;
  stats: CityStats;
  startGame: (aiEnabled: boolean) => void;
  togglePause: () => void;
  tick: () => void;
  resetEconomy: () => void;
}

const createEconomySlice: StateCreator<GameStore, [], [], EconomySlice> = (set, get) => ({
  gameStarted: false,
  isPaused: false,
  stats: INITIAL_STATS,

  startGame: (aiEnabled) => set({ gameStarted: true, isPaused: false, aiEnabled }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  resetEconomy: () => set({ gameStarted: false, isPaused: false, stats: INITIAL_STATS }),

  tick: () => {
    const { grid, stats, currentGoal, aiEnabled, isPaused } = get();
    if (isPaused) return;
    
    // Use Pure Simulation Logic
    const newStats = calculateNextDay(stats, grid);

    // Goal Check (Logic Integration)
    let updatedGoal = currentGoal;
    if (aiEnabled && currentGoal && !currentGoal.completed) {
      let isMet = false;
      const buildingCounts: Record<string, number> = {};
      grid.flat().forEach(t => buildingCounts[t.buildingType] = (buildingCounts[t.buildingType] || 0) + 1);

      if (currentGoal.targetType === 'money' && newStats.money >= currentGoal.targetValue) isMet = true;
      if (currentGoal.targetType === 'population' && newStats.population >= currentGoal.targetValue) isMet = true;
      if (currentGoal.targetType === 'building_count' && currentGoal.buildingType) {
        if ((buildingCounts[currentGoal.buildingType] || 0) >= currentGoal.targetValue) isMet = true;
      }

      if (isMet) updatedGoal = { ...currentGoal, completed: true };
    }

    set({ stats: newStats, currentGoal: updatedGoal });
  },
});

interface AISlice {
  aiEnabled: boolean;
  currentGoal: AIGoal | null;
  isGeneratingGoal: boolean;
  newsFeed: NewsItem[];
  setAiEnabled: (enabled: boolean) => void;
  setGoal: (goal: AIGoal | null) => void;
  setIsGeneratingGoal: (isGenerating: boolean) => void;
  addNews: (news: NewsItem) => void;
  claimReward: () => void;
  resetAI: () => void;
}

const createAISlice: StateCreator<GameStore, [], [], AISlice> = (set, get) => ({
  aiEnabled: true,
  currentGoal: null,
  isGeneratingGoal: false,
  newsFeed: [],

  setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
  setGoal: (goal) => set({ currentGoal: goal }),
  setIsGeneratingGoal: (isGenerating) => set({ isGeneratingGoal: isGenerating }),
  addNews: (news) => set((state) => ({ newsFeed: [...state.newsFeed.slice(-12), news] })),
  
  claimReward: () => {
    const { currentGoal, addNews } = get();
    if (currentGoal?.completed) {
      set((state) => ({
        stats: { ...state.stats, money: state.stats.money + currentGoal.reward },
        currentGoal: null
      }));
      addNews({ id: Date.now().toString(), text: `Goal achieved! ${currentGoal.reward} collected.`, type: 'positive' });
      audioService.play('success');
    }
  },

  resetAI: () => set({ currentGoal: null, newsFeed: [], isGeneratingGoal: false }),
});

interface UISlice {
  installPrompt: any;
  volume: number;
  setInstallPrompt: (prompt: any) => void;
  setVolume: (vol: number) => void;
}

const createUISlice: StateCreator<GameStore, [], [], UISlice> = (set) => ({
  installPrompt: null,
  volume: 0.5,
  setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
  setVolume: (volume) => set({ volume }),
});

export type GameStore = GridSlice & EconomySlice & AISlice & UISlice & { resetGame: () => void };

export const useGameStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createGridSlice(...a),
      ...createEconomySlice(...a),
      ...createAISlice(...a),
      ...createUISlice(...a),
      resetGame: () => {
        const [set, get] = a;
        get().resetGrid();
        get().resetEconomy();
        get().resetAI();
      }
    }),
    {
      name: 'sky-metropolis-v5',
      partialize: (state) => ({ 
        grid: state.grid, stats: state.stats, aiEnabled: state.aiEnabled, 
        gameStarted: state.gameStarted, currentGoal: state.currentGoal, 
        newsFeed: state.newsFeed, volume: state.volume 
      }),
    }
  )
);
