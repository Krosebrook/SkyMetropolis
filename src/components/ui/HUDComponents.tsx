/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem } from '../../types';
import { BUILDINGS } from '../../config/constants';
import { audioService } from '../../services/audioService';

// --- STATS BAR ---
export const StatsBar: React.FC<{ stats: CityStats, onSettings: () => void }> = ({ stats, onSettings }) => (
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

// --- GOAL PANEL ---
interface GoalPanelProps {
  goal: AIGoal | null;
  aiEnabled: boolean;
  isGenerating: boolean;
  onClaim: () => void;
}

export const GoalPanel: React.FC<GoalPanelProps> = ({ goal, aiEnabled, isGenerating, onClaim }) => (
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

// --- NEWS FEED ---
export const NewsFeed: React.FC<{ feed: NewsItem[], aiEnabled: boolean }> = ({ feed, aiEnabled }) => {
  const newsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (newsRef.current) newsRef.current.scrollTop = newsRef.current.scrollHeight;
  }, [feed]);

  return (
    <div className="pointer-events-auto w-full md:w-80 h-32 md:h-48 bg-black/80 text-white rounded-xl border border-gray-700/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden relative">
      <div className="bg-gray-800/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 border-b border-gray-600 flex justify-between items-center">
        <h3>City Feed</h3>
        <span className={`w-1.5 h-1.5 rounded-full ${aiEnabled ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} aria-hidden="true"></span>
      </div>
      
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-30 z-20"></div>
      
      <div 
        ref={newsRef} 
        className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 text-[10px] md:text-xs font-mono scroll-smooth mask-image-b z-10"
        role="log"
        aria-live="polite"
      >
        {feed.length === 0 && <div className="text-gray-500 italic text-center mt-10">No active news stream.</div>}
        {feed.map((news) => (
          <div key={news.id} className={`
            border-l-2 pl-2 py-1 transition-all animate-fade-in leading-tight relative
            ${news.type === 'positive' ? 'border-green-500 text-green-200 bg-green-900/20' : ''}
            ${news.type === 'negative' ? 'border-red-500 text-red-200 bg-red-900/20' : ''}
            ${news.type === 'neutral' ? 'border-blue-400 text-blue-100 bg-blue-900/20' : ''}
          `}>
            <span className="opacity-70 text-[8px] absolute top-0.5 right-1">{new Date(Number(news.id.split('.')[0])).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            {news.text}
          </div>
        ))}
      </div>
    </div>
  );
};