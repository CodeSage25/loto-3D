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
  const { playPloop, playVictory, initAudio } = useAudio();

  const handleStartDraw = useCallback(() => {
    initAudio();
    console.log("Button clicked, startDrawRef:", !!startDrawRef.current);
    if (startDrawRef.current) {
      startDrawRef.current();
    }
  }, [initAudio]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-black">
      <AnimatePresence>{!isLoaded && <LoadingScreen />}</AnimatePresence>

      <div className="flex-1 relative min-h-0">
        <ErrorBoundary>
          <Canvas
            camera={{ position: [2, -1.5, 18], fov: 65 }}
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
              console.log("Canvas created");
              setTimeout(() => setIsLoaded(true), 800);
            }}
          >
            <Scene
              state={state}
              dispatch={dispatch}
              startDrawRef={startDrawRef}
              audioHandlers={{ playPloop, playVictory }}
            />
          </Canvas>
        </ErrorBoundary>
      </div>

      <UIOverlay
        state={state}
        dispatch={dispatch}
        onStartDraw={handleStartDraw}
      />
    </div>
  );
}
