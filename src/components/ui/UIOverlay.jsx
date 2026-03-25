import { motion } from "framer-motion";
import { Jeton } from "./Jeton";
import { EmptySlot } from "./EmptySlot";

export function UIOverlay({ state, dispatch, onStartDraw, onReset }) {
  const isActive = state.phase !== "IDLE" && state.phase !== "DONE";

  return (
    <div
      className="shrink-0 bg-black/85 backdrop-blur-lg border-t border-white/10 px-4 py-3 md:px-8 md:py-4 flex flex-col gap-2"
      style={{ height: "38vh" }}
    >
      {state.statusMessage && (
        <p
          className={`text-center text-sm md:text-base font-medium ${isActive ? "animate-pulse text-blue-300" : "text-white"}`}
        >
          {state.statusMessage}
        </p>
      )}

      <div className="w-full max-w-md mx-auto">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(state.totalDrawn / 13) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-center text-xs text-gray-500 mt-1">
          {state.totalDrawn} / 13
        </p>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          8 PREMIERS NUMEROS TIRÉS
        </p>
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={`g${i}`}>
              {state.drawnBalls[i] ? (
                <Jeton number={state.drawnBalls[i]} type="gagnante" delay={i} />
              ) : (
                <EmptySlot type="gagnante" />
              )}
            </span>
          ))}
          <div className="w-px h-8 bg-white/20 mx-1" />
          {Array.from({ length: 3 }, (_, i) => (
            <span key={`b${i}`}>
              {state.drawnBalls[5 + i] ? (
                <Jeton
                  number={state.drawnBalls[5 + i]}
                  type="bonus"
                  delay={5 + i}
                />
              ) : (
                <EmptySlot type="bonus" />
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          5 DERNIERS NUMEROS TIRÉS
        </p>
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={`f${i}`}>
              {state.finalBalls[i] ? (
                <Jeton number={state.finalBalls[i]} type="finale" delay={i} />
              ) : (
                <EmptySlot type="finale" />
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-auto pb-1">
        <button
          onClick={onStartDraw}
          disabled={isActive}
          className={`py-2.5 px-5 rounded-full font-semibold text-sm shadow-xl transition-all duration-200 ${
            isActive
              ? "opacity-40 cursor-not-allowed bg-gray-700 text-gray-400"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 hover:shadow-blue-500/30 active:scale-95"
          }`}
        >
          🎱 Lancer
        </button>
        <button
          onClick={onReset}
          className="py-2.5 px-5 rounded-full font-semibold text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
