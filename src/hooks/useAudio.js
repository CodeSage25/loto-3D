import { useRef, useCallback, useState, useEffect } from "react";
import ploopFile from "../assets/son/ploop.mp3";
import winFile from "../assets/son/win.mp3";

export function useAudio() {
  const ploopRef = useRef(null);
  const winRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    mutedRef.current = isMuted;
  }, [isMuted]);

  const initAudio = useCallback(() => {
    if (ploopRef.current) return;
    ploopRef.current = new Audio(ploopFile);
    winRef.current = new Audio(winFile);
    ploopRef.current.volume = 0.75;
    winRef.current.volume = 0.85;
  }, []);

  const playPloop = useCallback(() => {
    if (mutedRef.current) return;
    initAudio();
    const clone = ploopRef.current.cloneNode();
    clone.volume = 0.75;
    clone.play().catch(() => {});
  }, [initAudio]);

  const playWin = useCallback(() => {
    if (mutedRef.current) return;
    initAudio();
    winRef.current.currentTime = 0;
    winRef.current.play().catch(() => {});
  }, [initAudio]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { playPloop, playWin, toggleMute, isMuted, initAudio };
}