import { useRef, useCallback } from "react";

export function useAudio() {
  const initialized = useRef(false);
  const ploopAudio = useRef(null);
  const victoryAudio = useRef(null);

  const initAudio = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      // Tester les deux chemins possibles
      const basePath = window.location.origin;
      console.log("🔊 Audio init, basePath:", basePath);

      ploopAudio.current = new Audio("/assets/son/ploop.mp3");
      ploopAudio.current.volume = 0.7;

      // Debug : écouter les erreurs de chargement
      ploopAudio.current.addEventListener("error", (e) => {
        console.error("❌ ploop.mp3 load error:", e);
        // Essayer un chemin alternatif
        ploopAudio.current = new Audio("./assets/son/ploop.mp3");
        ploopAudio.current.volume = 0.7;
      });

      ploopAudio.current.addEventListener("canplaythrough", () => {
        console.log("✅ ploop.mp3 loaded");
      });

      victoryAudio.current = new Audio("/assets/son/victory.mp3");
      victoryAudio.current.volume = 0.85;

      victoryAudio.current.addEventListener("error", (e) => {
        console.error("❌ victory.mp3 load error:", e);
        victoryAudio.current = new Audio("./assets/son/victory.mp3");
        victoryAudio.current.volume = 0.85;
      });

      victoryAudio.current.addEventListener("canplaythrough", () => {
        console.log("✅ victory.mp3 loaded");
      });

      // Forcer le chargement
      ploopAudio.current.load();
      victoryAudio.current.load();
    } catch (e) {
      console.error("Audio init failed:", e);
    }
  }, []);

  const playPloop = useCallback(() => {
    initAudio();
    try {
      if (ploopAudio.current) {
        // Créer un clone frais à chaque fois
        const clone = ploopAudio.current.cloneNode(true);
        clone.volume = 0.7;
        const promise = clone.play();
        if (promise) {
          promise.catch((err) => {
            console.warn("🔇 ploop play blocked:", err.message);
          });
        }
      }
    } catch (e) {
      console.warn("playPloop error:", e);
    }
  }, [initAudio]);

  const playVictory = useCallback(() => {
    initAudio();
    try {
      if (victoryAudio.current) {
        victoryAudio.current.currentTime = 0;
        const promise = victoryAudio.current.play();
        if (promise) {
          promise.catch((err) => {
            console.warn("🔇 victory play blocked:", err.message);
          });
        }
      }
    } catch (e) {
      console.warn("playVictory error:", e);
    }
  }, [initAudio]);

  return { playPloop, playVictory, initAudio };
}
