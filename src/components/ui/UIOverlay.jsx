import { motion, AnimatePresence } from "framer-motion";
import { Jeton } from "./Jeton";
import { EmptySlot } from "./EmptySlot";
import { useEffect, useRef } from "react";

export function UIOverlay({ 
  state, 
  onStartDraw, 
  onReset, 
  isMuted, 
  toggleMute 
}) {
  const isActive = state.phase !== "IDLE" && state.phase !== "DONE";
  const prevDrawnCount = useRef(0);
  const prevFinalCount = useRef(0);

  useEffect(() => {
    if (state.drawnBalls.length > prevDrawnCount.current) prevDrawnCount.current = state.drawnBalls.length;
    if (state.finalBalls.length > prevFinalCount.current) prevFinalCount.current = state.finalBalls.length;
  }, [state.drawnBalls.length, state.finalBalls.length]);

  return (
    // CHANGEMENT ICI : On utilise w-full et z-40, mais PAS absolute. 
    // On laisse le parent gérer la position.
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full shrink-0 z-40 flex flex-col bg-zinc-950 border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* Barre de progression Slim */}
      <div className="relative w-full h-1 bg-zinc-900">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${(state.totalDrawn / 13) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-3 px-4 py-3 md:px-6">
        
        {/* Ligne d'info compacte */}
        <div className="flex justify-between items-center h-5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
            Loto 3D - Live
          </span>
          <AnimatePresence mode="wait">
            {state.statusMessage && (
              <motion.span
                key={state.statusMessage}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs font-medium ${isActive ? "text-indigo-400 animate-pulse" : "text-zinc-300"}`}
              >
                {state.statusMessage}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* ZONE BOULES COMPACTE (Grid layout pour éviter les débordements) */}
        <div className="grid grid-cols-[1fr_auto] gap-2 md:gap-4 items-center bg-zinc-900/40 p-2 rounded-lg border border-white/5">
            {/* Tirage Principal */}
            <div className="flex flex-wrap justify-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={`g${i}`} className="scale-75 md:scale-90">
                    {state.drawnBalls[i] ? <Jeton number={state.drawnBalls[i]} type="gagnante" /> : <EmptySlot type="gagnante" />}
                  </div>
                ))}
                <div className="w-px h-6 bg-white/10 mx-0.5" />
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={`b${i}`} className="scale-75 md:scale-90">
                    {state.drawnBalls[5 + i] ? <Jeton number={state.drawnBalls[5 + i]} type="bonus" /> : <EmptySlot type="bonus" />}
                  </div>
                ))}
            </div>

            {/* Séparateur vertical visuel */}
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent" />

            {/* Tirage Final */}
            <div className="flex flex-col items-center justify-center">
                 <span className="text-[9px] text-zinc-500 uppercase mb-1">5 DERNIERS NUMERO TIRÉS</span>
                 <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                    <div key={`f${i}`} className="scale-75 md:scale-90">
                        {state.finalBalls[i] ? <Jeton number={state.finalBalls[i]} type="finale" /> : <EmptySlot type="finale" />}
                    </div>
                    ))}
                 </div>
            </div>
        </div>

        {/* BOUTONS ACTIONS */}
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 md:gap-3">
          <button onClick={toggleMute} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700">
            {isMuted ? "🔇" : "🔊"}
          </button>

          <button onClick={onReset} className="h-10 md:h-12 rounded-lg text-xs md:text-sm font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 active:scale-95 transition-all">
            RÉINITIALISER
          </button>

          <button
            onClick={onStartDraw}
            disabled={isActive}
            className={`h-10 md:h-12 rounded-lg text-xs md:text-sm font-bold shadow-lg transition-all active:scale-95 ${
              isActive
                ? "bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30"
            }`}
          >
            {isActive ? "TIRAGE..." : "LANCER"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}