/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useCallback } from 'react';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import StartScreen from './components/StartScreen';
import { audioService } from './services/audioService';
import { useGameStore } from './store/gameStore';
import { useGameLoop } from './hooks/useGameLoop';
import { useAiAdvisor } from './hooks/useAiAdvisor';

function App() {
  // --- State Selectors ---
  const gameStarted = useGameStore(state => state.gameStarted);
  const grid = useGameStore(state => state.grid);
  const stats = useGameStore(state => state.stats);
  const selectedTool = useGameStore(state => state.selectedTool);
  const aiEnabled = useGameStore(state => state.aiEnabled);
  const currentGoal = useGameStore(state => state.currentGoal);
  const newsFeed = useGameStore(state => state.newsFeed);
  const isGeneratingGoal = useGameStore(state => state.isGeneratingGoal);
  const installPrompt = useGameStore(state => state.installPrompt);

  // --- Actions ---
  const startGame = useGameStore(state => state.startGame);
  const setTool = useGameStore(state => state.setTool);
  const placeBuilding = useGameStore(state => state.placeBuilding);
  const claimReward = useGameStore(state => state.claimReward);
  const setInstallPrompt = useGameStore(state => state.setInstallPrompt);

  // --- Logic Hooks ---
  useGameLoop();  // Handles Tick
  useAiAdvisor(); // Handles Gemini

  // --- PWA Logic ---
  useEffect(() => {
    const beforeInstallHandler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log("PWA Install Prompt captured");
    };

    const appInstalledHandler = () => {
      setInstallPrompt(null);
      console.log("PWA App Installed");
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler);
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, [setInstallPrompt]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setInstallPrompt(null);
      audioService.play('success');
    } else {
      console.log('User dismissed the install prompt');
    }
  };

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

export default App;