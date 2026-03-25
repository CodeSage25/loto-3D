import { useState, useReducer, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence } from "framer-motion";
import { IS_MOBILE } from "./constants";
import { drawReducer, initialState } from "./state/drawReducer";
import { useAudio } from "./hooks/useAudio";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { UIOverlay } from "./components/ui/UIOverlay";
import { Scene } from "./components/three/Scene";

export default function App() {
  const [state, dispatch] = useReducer(drawReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const startDrawRef = useRef(null);
  const audioHandlersRef = useRef({});
  const { playPloop, playVictory, initAudio } = useAudio();

  // Stocker les handlers audio dans un ref stable
  audioHandlersRef.current.playPloop = playPloop;
  audioHandlersRef.current.playVictory = playVictory;

  const handleStartDraw = useCallback(() => {
    initAudio();
    if (startDrawRef.current) {
      startDrawRef.current();
    }
  }, [initAudio]);

  const handleReset = useCallback(() => {
    // Appeler le reset de la scène si disponible
    if (audioHandlersRef.current.resetScene) {
      audioHandlersRef.current.resetScene();
    } else {
      dispatch({ type: "RESET" });
    }
  }, [dispatch]);

  return (
    <div
      className="h-screen overflow-hidden flex flex-col bg-black mx-auto"
      style={{ maxWidth: "1300px" }}
    >
      <AnimatePresence>{!isLoaded && <LoadingScreen />}</AnimatePresence>

      <div className="flex-1 relative min-h-0">
        <ErrorBoundary>
          <Canvas
            camera={{ position: [6, -4, 50], fov: 65 }}
            gl={{
              alpha: true,
              antialias: !IS_MOBILE,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
              outputColorSpace: THREE.SRGBColorSpace,
            }}
            shadows={false}
            dpr={[1, IS_MOBILE ? 1.5 : 2]}
            performance={{ min: 0.5 }}
            onCreated={() => {
              setTimeout(() => setIsLoaded(true), 800);
            }}
          >
            <Scene
              state={state}
              dispatch={dispatch}
              startDrawRef={startDrawRef}
              audioHandlers={audioHandlersRef.current}
            />
          </Canvas>
        </ErrorBoundary>
      </div>

      <UIOverlay
        state={state}
        dispatch={dispatch}
        onStartDraw={handleStartDraw}
        onReset={handleReset}
      />
    </div>
  );
}
