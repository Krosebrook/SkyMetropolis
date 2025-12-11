
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback } from 'react';
import IsoMap from './features/city/components/IsoMap';
import UIOverlay from './features/ui/components/UIOverlay';
import StartScreen from './features/ui/components/StartScreen';
import { audioService } from './features/shared/services/audioService';
import { useGameStore } from './store/gameStore';
import { useGameLoop } from './features/city/hooks/useGameLoop';
import { useAiAdvisor } from './features/advisor/hooks/useAiAdvisor';
import { usePWA } from './features/shared/hooks/usePWA';
import { ErrorBoundary } from './features/shared/components/ErrorBoundary';

function AppContent() {
  const gameStarted = useGameStore(state => state.gameStarted);
  const grid = useGameStore(state => state.grid);
  const stats = useGameStore(state => state.stats);
  const selectedTool = useGameStore(state => state.selectedTool);
  const aiEnabled = useGameStore(state => state.aiEnabled);
  const currentGoal = useGameStore(state => state.currentGoal);
  const newsFeed = useGameStore(state => state.newsFeed);
  const isGeneratingGoal = useGameStore(state => state.isGeneratingGoal);

  const startGame = useGameStore(state => state.startGame);
  const setTool = useGameStore(state => state.setTool);
  const placeBuilding = useGameStore(state => state.placeBuilding);
  const claimReward = useGameStore(state => state.claimReward);

  // Core Hooks
  useGameLoop();
  useAiAdvisor();
  const { installPrompt, handleInstallClick } = usePWA();

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!gameStarted) return;
    placeBuilding(x, y);
  }, [gameStarted, placeBuilding]);

  const handleStart = (enabled: boolean) => {
    startGame(enabled);
    audioService.init();
    audioService.play('success');
    setTimeout(() => audioService.startAmbient(), 1000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden selection:bg-transparent selection:text-transparent bg-sky-900">
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        hoveredTool={selectedTool}
        population={stats.population}
        day={stats.day}
      />
      
      {!gameStarted && (
        <StartScreen onStart={handleStart} />
      )}

      {gameStarted && (
        <UIOverlay
          stats={stats}
          selectedTool={selectedTool}
          onSelectTool={setTool}
          currentGoal={currentGoal}
          newsFeed={newsFeed}
          onClaimReward={claimReward}
          isGeneratingGoal={isGeneratingGoal}
          aiEnabled={aiEnabled}
          installPrompt={installPrompt}
          onInstall={handleInstallClick}
        />
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .mask-image-b { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%); mask-image: linear-gradient(to bottom, transparent 0%, black 15%); }
        .writing-mode-vertical { writing-mode: vertical-rl; text-orientation: mixed; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
