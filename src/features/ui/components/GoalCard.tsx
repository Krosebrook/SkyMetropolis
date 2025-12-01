
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { AIGoal } from '../../../types';
import { BUILDINGS } from '../../../config/constants';

interface GoalCardProps {
  goal: AIGoal | null;
  aiEnabled: boolean;
  isGenerating: boolean;
  onClaim: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, aiEnabled, isGenerating, onClaim }) => {
  return (
    <div className={`pointer-events-auto w-full md:w-80 bg-indigo-900/90 text-white rounded-xl border-2 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.4)] backdrop-blur-md overflow-hidden transition-all ${!aiEnabled ? 'opacity-80 grayscale-[0.5]' : ''}`}>
      <div className="bg-indigo-800/80 px-3 md:px-4 py-1.5 md:py-2 flex justify-between items-center border-b border-indigo-600">
        <h2 className="font-bold uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2 shadow-sm">
          {aiEnabled ? (
            <>
              <span className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-yellow-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} aria-hidden="true"></span>
              AI Advisor
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-green-400" aria-hidden="true"></span>
              Sandbox
            </>
          )}
        </h2>
        {isGenerating && aiEnabled && <span className="text-[10px] animate-pulse text-yellow-300 font-mono" role="status">Thinking...</span>}
      </div>
      
      <div className="p-3 md:p-4">
        {aiEnabled ? (
          goal ? (
            <>
              <p className="text-xs md:text-sm font-medium text-indigo-100 mb-2 md:mb-3 leading-tight drop-shadow">"{goal.description}"</p>
              
              <div className="flex justify-between items-center mt-1 md:mt-2 bg-indigo-950/60 p-1.5 md:p-2 rounded-lg border border-indigo-700/50">
                <div className="text-[10px] md:text-xs text-gray-300">
                  Goal: <span className="font-mono font-bold text-white">
                    {goal.targetType === 'building_count' ? BUILDINGS[goal.buildingType!].name : 
                     goal.targetType === 'money' ? '$' : 'Pop.'} {goal.targetValue}
                  </span>
                </div>
                <div className="text-[10px] md:text-xs text-yellow-300 font-bold font-mono bg-yellow-900/50 px-2 py-0.5 rounded border border-yellow-600/50">
                  +${goal.reward}
                </div>
              </div>

              {goal.completed && (
                <button
                  onClick={onClaim}
                  className="mt-2 md:mt-3 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-1.5 md:py-2 px-4 rounded shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all animate-bounce text-xs md:text-sm uppercase tracking-wide border border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  Collect Reward
                </button>
              )}
            </>
          ) : (
            <div className="text-xs md:text-sm text-gray-400 py-2 italic flex items-center gap-2" role="status">
              Analyzing city data...
            </div>
          )
        ) : (
          <div className="text-xs md:text-sm text-indigo-200/70 py-1">
             <p className="mb-1">Free play active.</p>
          </div>
        )}
      </div>
    </div>
  );
};
