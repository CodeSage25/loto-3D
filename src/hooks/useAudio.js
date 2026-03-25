import { useRef, useCallback } from "react";

export function useAudio() {
  const ploopRef = useRef(null);
  const victoryRef = useRef(null);
  const initialized = useRef(false);

  const initAudio = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      ploopRef.current = new Audio("/assets/son/ploop.mp3");
      ploopRef.current.volume = 0.6;
      ploopRef.current.load();
      victoryRef.current = new Audio("/assets/son/victory.mp3");
      victoryRef.current.volume = 0.8;
      victoryRef.current.load();
    } catch (e) {
      console.warn("Audio init failed:", e);
    }
  }, []);

  const playPloop = useCallback(() => {
    initAudio();
    try {
      if (ploopRef.current) {
        const clone = ploopRef.current.cloneNode();
        clone.volume = 0.6;
        clone.play().catch(() => {});
      }
    } catch (e) {}
  }, [initAudio]);

  const playVictory = useCallback(() => {
    initAudio();
    try {
      if (victoryRef.current) {
        victoryRef.current.currentTime = 0;
        victoryRef.current.play().catch(() => {});
      }
    } catch (e) {}
  }, [initAudio]);

  return { playPloop, playVictory, initAudio };
}
