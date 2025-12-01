
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useGameStore } from '../../../store/gameStore';

export const SettingsDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const resetGame = useGameStore(state => state.resetGame);
  const volume = useGameStore(state => state.volume);
  const setVolume = useGameStore(state => state.setVolume);

  const handleReset = () => {
    if (window.confirm("Are you sure? This will delete your city.")) {
      resetGame();
      window.location.reload(); 
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-80 text-white">
        <h2 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Settings</h2>
        
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">Master Volume</label>
          <input 
            type="range" 
            min="0" max="1" step="0.1" 
            value={volume}
            onChange={(e) => {
               const v = parseFloat(e.target.value);
               setVolume(v);
            }}
            className="w-full accent-cyan-500"
          />
        </div>

        <div className="space-y-3">
            <button 
                onClick={handleReset}
                className="w-full py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded border border-red-700 transition-colors text-sm font-bold"
            >
                Reset City
            </button>
            <button 
                onClick={onClose}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-sm font-bold"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};
