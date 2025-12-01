
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect } from 'react';
import { NewsItem } from '../../../types';

interface NewsTickerProps {
  feed: NewsItem[];
  aiEnabled: boolean;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ feed, aiEnabled }) => {
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
