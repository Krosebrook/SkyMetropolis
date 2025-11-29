/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BuildingType } from '../../types';
import { BUILDINGS } from '../../constants';
import { audioService } from '../../services/audioService';

const tools = [
  BuildingType.None, // Bulldoze
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
];

const ToolButton: React.FC<{
  type: BuildingType;
  isSelected: boolean;
  onClick: () => void;
  money: number;
}> = ({ type, isSelected, onClick, money }) => {
  const config = BUILDINGS[type];
  const canAfford = money >= config.cost;
  const isBulldoze = type === BuildingType.None;
  
  const bgColor = config.color;

  const handleClick = () => {
    audioService.play('click');
    onClick();
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isBulldoze && !canAfford}
      aria-label={`Select ${config.name} tool`}
      aria-pressed={isSelected}
      className={`
        relative flex flex-col items-center justify-center rounded-lg border-2 transition-all shadow-lg backdrop-blur-sm flex-shrink-0
        w-14 h-14 md:w-16 md:h-16 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900
        ${isSelected ? 'border-white bg-white/20 scale-110 z-10' : 'border-gray-600 bg-gray-900/80 hover:bg-gray-800'}
        ${!isBulldoze && !canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={config.description}
    >
      <div className="w-6 h-6 md:w-8 md:h-8 rounded mb-0.5 md:mb-1 border border-black/30 shadow-inner flex items-center justify-center overflow-hidden" style={{ backgroundColor: isBulldoze ? 'transparent' : bgColor }}>
        {isBulldoze && <div className="w-full h-full bg-red-600 text-white flex justify-center items-center font-bold text-base md:text-lg" aria-hidden="true">✕</div>}
        {type === BuildingType.Road && <div className="w-full h-2 bg-gray-800 transform -rotate-45" aria-hidden="true"></div>}
      </div>
      <span className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md leading-none">{config.name}</span>
      {config.cost > 0 && (
        <span className={`text-[8px] md:text-[10px] font-mono leading-none ${canAfford ? 'text-green-300' : 'text-red-400'}`}>${config.cost}</span>
      )}
    </button>
  );
};

interface ToolbarProps {
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  money: number;
  installPrompt: any;
  onInstall: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ selectedTool, onSelectTool, money, installPrompt, onInstall }) => {
  return (
    <div 
        role="toolbar" 
        aria-label="Building Tools"
        className="pointer-events-auto flex gap-1 md:gap-2 bg-gray-900/80 p-1 md:p-2 rounded-2xl border border-gray-600/50 backdrop-blur-xl shadow-2xl w-full md:w-auto overflow-x-auto no-scrollbar justify-start md:justify-start"
    >
      {/* Install Button (PWA) */}
      {installPrompt && (
        <button
          onClick={() => { audioService.play('click'); onInstall(); }}
          aria-label="Install App"
          className="flex flex-col items-center justify-center rounded-lg border-2 border-yellow-500/50 bg-yellow-900/40 hover:bg-yellow-800/60 transition-all w-14 h-14 md:w-16 md:h-16 flex-shrink-0 animate-pulse focus:outline-none focus:ring-2 focus:ring-yellow-400"
          title="Install App"
        >
          <div className="text-yellow-400 text-xl font-bold" aria-hidden="true">↓</div>
          <span className="text-[8px] md:text-[10px] font-bold text-yellow-100 uppercase tracking-wider drop-shadow-md leading-none mt-1">Install</span>
        </button>
      )}

      <div className="flex gap-1 md:gap-2 min-w-max px-1">
        {tools.map((type) => (
          <ToolButton
            key={type}
            type={type}
            isSelected={selectedTool === type}
            onClick={() => onSelectTool(type)}
            money={money}
          />
        ))}
      </div>
      <div className="text-[8px] text-gray-500 uppercase writing-mode-vertical flex items-center justify-center font-bold tracking-widest border-l border-gray-700 pl-1 ml-1 select-none" aria-hidden="true">Build</div>
    </div>
  );
};