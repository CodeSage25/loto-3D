import { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import {
  TOTAL_BALLS,
  DRAW_DELAY,
  BOULIER_RADIUS,
  BALL_RADIUS,
  TUBE_LEFT_ENTRY_X,
  TUBE_LEFT_Y,
  TUBE_LENGTH,
  TUBE_RADIUS,
  PHASE1_COUNT,
  PHASE3_COUNT,
  FUNNEL_HEIGHT,
} from "../../constants";
import { fisherYatesShuffle } from "../../utils/shuffle";
import { ResponsiveCamera } from "./ResponsiveCamera";
import { Ball } from "./Ball";
import { Boulier } from "./Boulier";
import { BoulierConfinement } from "./BoulierConfinement";
import { Canal } from "./Canal";
import { CanalRight } from "./CanalRight";
import { ReceptionTube } from "./ReceptionTube";
import { CollectionBox } from "./CollectionBox";

export function Scene({ state, dispatch, startDrawRef, audioHandlers }) {
  const ballRefs = useRef({});
  const drawTimeouts = useRef([]);
  const [gateOpen, setGateOpen] = useState(false);
  const isDrawing = useRef(false);

 const { playPloop, playWin } = audioHandlers;

  const handleBallReady = useCallback(
    (number, rb, meshRef, drawnRef, orientRef) => {
      // drawnRef    : stoppe le brassage dans Ball.jsx quand true
      // orientRef   : déclenche l'orientation numéro vers caméra (+Z) dans Ball.jsx
      ballRefs.current[number] = {
        rb,
        mesh: meshRef,
        drawn: false,
        drawnRef,
        orientRef,
      };
    },
    [],
  );

  const wait = useCallback(
    (ms) =>
      new Promise((r) => {
        const t = setTimeout(r, ms);
        drawTimeouts.current.push(t);
      }),
    [],
  );

  // ✅ La boule roule physiquement dans le canal puis entre dans le tube
  // Une fois stabilisée (~1.5s), on oriente le numéro vers la caméra (+Z)
  const sendBallToLeftTube = useCallback(
    async (ballNumber, slotIndex) => {
      const bd = ballRefs.current[ballNumber];
      if (!bd || !bd.rb) {
        console.warn(`Ball ${ballNumber} not found`);
        return;
      }

      bd.drawn = true;
      if (bd.drawnRef) bd.drawnRef.current = true; // stoppe le brassage dans Ball.jsx

      try {
        // Point d'entrée du canal gauche
        const entryX = TUBE_LEFT_ENTRY_X + 0.2;
        const entryY = TUBE_LEFT_Y + 0.3;

        bd.rb.setTranslation({ x: entryX, y: entryY, z: 0 }, true);
        bd.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        bd.rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

        // Pousser vers la gauche dans le tube
        bd.rb.applyImpulse({ x: -2.0, y: -0.05, z: 0 }, true);

        playPloop();
        console.log(`✅ Ball ${ballNumber} → tube gauche (slot ${slotIndex})`);
      } catch (e) {
        console.warn("Error sending ball to left tube:", e);
      }

      // Attendre que la boule roule et se stabilise dans le tube
      await wait(1500);

      // Puis orienter le numéro vers la caméra — Ball.jsx s'en charge via orientRef
      try {
        if (bd.orientRef) bd.orientRef.current = true;
      } catch (e) {}
    },
    [playPloop, wait],
  );

  // ✅ Téléportation à l'entrée exacte du CanalRight → boîte
  // CanalRight : startX=0.7, startY=-(BOULIER_RADIUS+FUNNEL_HEIGHT+0.1)=-4.9
  // endX=BOX_X-BOX_WIDTH/2=5.0, endY=BOX_Y=-6.5
  // angle ≈ -20.4°, direction unitaire ≈ (0.937, -0.349)
  // Normale vers le haut du canal ≈ (0.349, 0.937)
  // Spawn = startX + normale*BALL_RADIUS → (0.812, -4.500), z=0
  const sendBallToRightBox = useCallback((ballNumber) => {
    const bd = ballRefs.current[ballNumber];
    if (!bd || !bd.rb) return;

    bd.drawn = true;
    if (bd.drawnRef) bd.drawnRef.current = true; // stoppe le brassage dans Ball.jsx

    try {
      // Spawn à l'entrée du canal — endY corrigé à -5.3, angle -9.25°
      // direction canal : (0.987, -0.161), normale : (0.161, 0.987)
      // spawn = start + normale*(BALL_RADIUS+0.05) = (0.759, -4.535)
      bd.rb.setTranslation({ x: 0.76, y: -4.54, z: 0 }, true);
      bd.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      bd.rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      // Impulsion alignée sur la direction du canal × 3.5
      bd.rb.applyImpulse({ x: 3.45, y: -0.56, z: 0 }, true);
    } catch (e) {}
  }, []);

  const clearLeftTube = useCallback(
    async (ballNumbers) => {
      for (const num of ballNumbers) {
        const bd = ballRefs.current[num];
        if (bd?.mesh?.current) bd.mesh.current.visible = false;
        if (bd?.drawnRef) bd.drawnRef.current = true; // stoppe le brassage
        if (bd?.rb) {
          try {
            bd.rb.setTranslation({ x: -30, y: -30, z: 0 }, true);
            bd.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
            bd.rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
          } catch (e) {}
        }
        await wait(60);
      }
    },
    [wait],
  );

  const startDraw = useCallback(async () => {
    if (isDrawing.current) return;
    isDrawing.current = true;

    console.log("🎱 START");

    const numbers = Array.from({ length: TOTAL_BALLS }, (_, i) => i + 1);
    const shuffled = fisherYatesShuffle(numbers);

    const phase1Balls = shuffled.slice(0, PHASE1_COUNT);
    const phase3Balls = shuffled.slice(PHASE1_COUNT, PHASE1_COUNT + PHASE3_COUNT);
    const evacuateBalls = shuffled.slice(PHASE1_COUNT + PHASE3_COUNT);

    dispatch({ type: "START_DRAW", drawOrder: shuffled });
    setGateOpen(true);

    // PHASE 1
    console.log("═══ PHASE 1 ═══");
    for (let i = 0; i < PHASE1_COUNT; i++) {
      await wait(DRAW_DELAY);
      await sendBallToLeftTube(phase1Balls[i], i);
      dispatch({ type: "BALL_DRAWN_P1", ballNumber: phase1Balls[i] });
    }

    await wait(2000);

    // PHASE 2 : Vidage des 77 boules
    console.log("═══ PHASE 2 : Évacuation ═══");
    dispatch({ type: "START_CLEARING" });

    const BATCH_SIZE = 5;
    const DELAY_IN_BATCH = 180;

    // Remplace cette partie :
for (let i = 0; i < evacuateBalls.length; i++) {
  sendBallToRightBox(evacuateBalls[i]);
  
  
  
  if ((i + 1) % 10 === 0) {
    dispatch({ type: "CLEARING_PROGRESS", count: i + 1 });
  }

  const isLast = i === evacuateBalls.length - 1;
  if (!isLast) {
    await wait((i + 1) % BATCH_SIZE === 0 ? 120 : DELAY_IN_BATCH);
  }
}

    await wait(3500);
    await clearLeftTube(phase1Balls);
    await wait(800);

    // PHASE 3
    console.log("═══ PHASE 3 ═══");
    dispatch({ type: "START_PHASE3" });

    for (let i = 0; i < PHASE3_COUNT; i++) {
      await wait(DRAW_DELAY);
      await sendBallToLeftTube(phase3Balls[i], i);
      dispatch({ type: "BALL_DRAWN_P3", ballNumber: phase3Balls[i] });
    }

    playWin();                    // ← changé de playVictory à playWin
    dispatch({ type: "FINISH" });
    setGateOpen(false);
    isDrawing.current = false;
    console.log("🎉 FIN");
  }, [
    dispatch,
    wait,
    sendBallToLeftTube,
    sendBallToRightBox,
    clearLeftTube,
    playWin,
  ]);
  useEffect(() => {
    startDrawRef.current = startDraw;
  }, [startDraw, startDrawRef]);

  useEffect(() => {
    return () => drawTimeouts.current.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <>
      <ResponsiveCamera />
      <Environment
        preset="studio"
        background={false}
        environmentIntensity={1.0}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#fff8e8" />
      <pointLight
        position={[0, -5, 3]}
        intensity={0.4}
        color="#4488ff"
        distance={12}
      />
      <pointLight
        position={[0, 3, -5]}
        intensity={0.5}
        color="#ffffff"
        distance={14}
      />
      <pointLight
        position={[-5, 0, 2]}
        intensity={0.3}
        color="#ffaa44"
        distance={10}
      />
      <ContactShadows
        position={[0, -10, 0]}
        opacity={0.5}
        scale={25}
        blur={2.5}
        far={10}
        color="#000033"
      />
      <mesh
        position={[0, -10.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={-1}
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#080818"
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      <Physics gravity={[0, -9.81, 0]}>
        <Boulier phase={state.phase} />
        <Canal />
        <CanalRight />
        <ReceptionTube />
        <CollectionBox />
        <BoulierConfinement
          ballRefs={ballRefs}
          phase={state.phase}
          gateOpen={gateOpen}
        />
        {Array.from({ length: TOTAL_BALLS }, (_, i) => (
          <Ball
            key={`ball-${state.phase === "IDLE" ? "idle" : "active"}-${i}`}
            number={i + 1}
            index={i}
            phase={state.phase}
            onBallReady={handleBallReady}
          />
        ))}
      </Physics>
    </>
  );
}
