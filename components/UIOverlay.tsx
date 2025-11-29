/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem } from '../types';
import { StatsBar, GoalPanel, NewsFeed } from './ui/HUDComponents';
import { Toolbar } from './ui/Toolbar';
import { SettingsModal } from './SettingsModal';

interface UIOverlayProps {
  stats: CityStats;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  currentGoal: AIGoal | null;
  newsFeed: NewsItem[];
  onClaimReward: () => void;
  isGeneratingGoal: boolean;
  aiEnabled: boolean;
  installPrompt: any;
  onInstall: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  selectedTool,
  onSelectTool,
  currentGoal,
  newsFeed,
  onClaimReward,
  isGeneratingGoal,
  aiEnabled,
  installPrompt,
  onInstall
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 font-sans z-10">
        
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 w-full max-w-full">
            <StatsBar stats={stats} onSettings={() => setShowSettings(true)} />
            <GoalPanel 
                goal={currentGoal} 
                aiEnabled={aiEnabled} 
                isGenerating={isGeneratingGoal} 
                onClaim={onClaimReward} 
            />
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-end mt-auto gap-2 w-full max-w-full">
            <Toolbar 
                selectedTool={selectedTool} 
                onSelectTool={onSelectTool} 
                money={stats.money} 
                installPrompt={installPrompt} 
                onInstall={onInstall} 
            />
            <NewsFeed feed={newsFeed} aiEnabled={aiEnabled} />
        </div>
        
        {/* Credits */}
        <div className="absolute bottom-1 right-2 md:right-4 text-[8px] md:text-[9px] text-white/30 font-mono text-right pointer-events-auto hover:text-white/60 transition-colors">
            <a href="https://x.com/ammaar" target="_blank" rel="noreferrer" className="focus:outline-none focus:underline">Created by @ammaar</a>
        </div>
        </div>

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};

export default UIOverlay;