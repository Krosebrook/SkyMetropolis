
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { CityStats } from '../../../types';

interface StatsPanelProps {
  stats: CityStats;
  onSettings: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, onSettings }) => {
  return (
    <div 
      role="status" 
      aria-label="City Statistics"
      className="bg-gray-900/90 text-white p-2 md:p-3 rounded-xl border border-gray-700 shadow-2xl backdrop-blur-md flex gap-3 md:gap-6 items-center justify-between md:justify-start w-full md:w-auto pointer-events-auto"
    >
      <button onClick={onSettings} className="mr-2 text-gray-400 hover:text-white transition-colors" aria-label="Settings">
         ⚙️
      </button>
      <div className="w-px h-6 md:h-8 bg-gray-700" aria-hidden="true"></div>
      <div className="flex flex-col">
        <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest">Treasury</span>
        <span className="text-lg md:text-2xl font-black text-green-400 font-mono drop-shadow-md">${stats.money.toLocaleString()}</span>
      </div>
      <div className="w-px h-6 md:h-8 bg-gray-700" aria-hidden="true"></div>
      <div className="flex flex-col">
        <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest">Citizens</span>
        <span className="text-base md:text-xl font-bold text-blue-300 font-mono drop-shadow-md">{stats.population.toLocaleString()}</span>
      </div>
      <div className="w-px h-6 md:h-8 bg-gray-700" aria-hidden="true"></div>
      <div className="flex flex-col items-end">
         <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest">Day</span>
         <span className="text-base md:text-lg font-bold text-white font-mono">{stats.day}</span>
      </div>
    </div>
  );
};
