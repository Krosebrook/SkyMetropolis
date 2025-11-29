/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateCityGoal, generateNewsEvent } from '../services/geminiService';

export const useAiAdvisor = () => {
  const gameStarted = useGameStore(state => state.gameStarted);
  const isPaused = useGameStore(state => state.isPaused);
  const aiEnabled = useGameStore(state => state.aiEnabled);
  const currentGoal = useGameStore(state => state.currentGoal);
  const isGeneratingGoal = useGameStore(state => state.isGeneratingGoal);
  const stats = useGameStore(state => state.stats);
  const grid = useGameStore(state => state.grid);
  
  const setGoal = useGameStore(state => state.setGoal);
  const setIsGeneratingGoal = useGameStore(state => state.setIsGeneratingGoal);
  const addNews = useGameStore(state => state.addNews);

  const fetchNewGoal = useCallback(async () => {
    if (isGeneratingGoal || !aiEnabled || !gameStarted || isPaused) return;
    
    setIsGeneratingGoal(true);
    // Visual delay
    await new Promise(r => setTimeout(r, 500));
    
    try {
      const newGoal = await generateCityGoal(stats, grid);
      if (newGoal) {
        setGoal(newGoal);
      }
    } catch (e) {
      console.error("AI Advisor failed to generate goal", e);
    } finally {
      setIsGeneratingGoal(false);
    }
  }, [isGeneratingGoal, aiEnabled, gameStarted, isPaused, stats, grid, setIsGeneratingGoal, setGoal]);

  const fetchNews = useCallback(async () => {
    if (!aiEnabled || !gameStarted || isPaused || Math.random() > 0.15) return;
    try {
      const news = await generateNewsEvent(stats, null);
      if (news) addNews(news);
    } catch (e) {
      console.error("AI Advisor failed to generate news", e);
    }
  }, [aiEnabled, gameStarted, isPaused, stats, addNews]);

  // Initial Goal Trigger
  useEffect(() => {
    if (gameStarted && aiEnabled && !currentGoal && !isGeneratingGoal) {
      fetchNewGoal();
    }
  }, [gameStarted, aiEnabled, currentGoal, isGeneratingGoal, fetchNewGoal]);

  // Periodic Checks (piggyback on a separate interval or just expose the fetchers)
  // Since we want this tied to game ticks but asynchronous, we can use an effect
  useEffect(() => {
    if (!gameStarted || isPaused) return;
    
    // Check for news every 10 seconds independent of game tick rate
    const newsInterval = setInterval(fetchNews, 10000);
    
    // Check for goal retry if empty every 15s
    const goalInterval = setInterval(() => {
      if (!currentGoal && !isGeneratingGoal) fetchNewGoal();
    }, 15000);

    return () => {
      clearInterval(newsInterval);
      clearInterval(goalInterval);
    };
  }, [gameStarted, isPaused, currentGoal, isGeneratingGoal, fetchNews, fetchNewGoal]);
};