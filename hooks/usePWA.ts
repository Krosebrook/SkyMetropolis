/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { audioService } from '../services/audioService';

export const usePWA = () => {
  const installPrompt = useGameStore(state => state.installPrompt);
  const setInstallPrompt = useGameStore(state => state.setInstallPrompt);

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
    
    installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      setInstallPrompt(null);
      audioService.play('success');
    }
  };

  return { installPrompt, handleInstallClick };
};
