
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { TICK_RATE_MS } from '../../../config/constants';

export const useGameLoop = () => {
  const gameStarted = useGameStore(state => state.gameStarted);
  const isPaused = useGameStore(state => state.isPaused);
  const tick = useGameStore(state => state.tick);

  useEffect(() => {
    if (!gameStarted || isPaused) return;

    const intervalId = setInterval(() => {
      tick();
    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [gameStarted, isPaused, tick]);
};
