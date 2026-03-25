import { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import {
  TOTAL_BALLS,
  DRAW_DELAY,
  BOULIER_RADIUS,
  TUBE_LEFT_ENTRY_X,
  TUBE_LEFT_Y,
  TUBE_LENGTH,
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

  const { playPloop, playVictory } = audioHandlers;

  const handleBallReady = useCallback((number, rb, meshRef) => {
    ballRefs.current[number] = { rb, mesh: meshRef, drawn: false };
  }, []);

  const wait = useCallback(
    (ms) =>
      new Promise((r) => {
        const t = setTimeout(r, ms);
        drawTimeouts.current.push(t);
      }),
    [],
  );

  // ✅ Téléportation directe dans le tube gauche — pas d'aspiration
  const sendBallToLeftTube = useCallback(
    async (ballNumber, slotIndex) => {
      const bd = ballRefs.current[ballNumber];
      if (!bd || !bd.rb) {
        console.warn(`Ball ${ballNumber} not found`);
        return;
      }

      bd.drawn = true;

      try {
        // Position d'entrée du tube
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

      // Attendre que la boule se place
      await wait(600);

      // Boost si elle ralentit
      try {
        const vel = bd.rb.linvel();
        if (Math.abs(vel.x) < 0.5) {
          bd.rb.applyImpulse({ x: -0.8, y: 0, z: 0 }, true);
        }
      } catch (e) {}
    },
    [playPloop, wait],
  );

  // ✅ Téléportation directe vers le canal droit → boîte
  const sendBallToRightBox = useCallback((ballNumber) => {
    const bd = ballRefs.current[ballNumber];
    if (!bd || !bd.rb) return;

    bd.drawn = true;

    try {
      bd.rb.setTranslation(
        {
          x: 0.7,
          y: -BOULIER_RADIUS - FUNNEL_HEIGHT - 0.2,
          z: (Math.random() - 0.5) * 0.2,
        },
        true,
      );
      bd.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      bd.rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      bd.rb.applyImpulse(
        { x: 1.5, y: -0.2, z: (Math.random() - 0.5) * 0.1 },
        true,
      );
    } catch (e) {}
  }, []);

  const clearLeftTube = useCallback(
    async (ballNumbers) => {
      for (const num of ballNumbers) {
        const bd = ballRefs.current[num];
        if (bd?.mesh?.current) bd.mesh.current.visible = false;
        if (bd?.rb) {
          try {
            bd.rb.setTranslation({ x: -30, y: -30, z: 0 }, true);
            bd.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
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
    const phase3Balls = shuffled.slice(
      PHASE1_COUNT,
      PHASE1_COUNT + PHASE3_COUNT,
    );
    const evacuateBalls = shuffled.slice(PHASE1_COUNT + PHASE3_COUNT);

    dispatch({ type: "START_DRAW", drawOrder: shuffled });
    setGateOpen(true);

    // ═══ PHASE 1 : 8 boules → tube gauche ═══
    console.log("═══ PHASE 1 ═══");
    for (let i = 0; i < PHASE1_COUNT; i++) {
      await wait(DRAW_DELAY);
      await sendBallToLeftTube(phase1Balls[i], i);
      dispatch({ type: "BALL_DRAWN_P1", ballNumber: phase1Balls[i] });
    }

    await wait(2000);

    // ═══ PHASE 2 : 77 boules → boîte droite ═══
    console.log("═══ PHASE 2 : Évacuation ═══");
    dispatch({ type: "START_CLEARING" });

    for (let i = 0; i < evacuateBalls.length; i++) {
      sendBallToRightBox(evacuateBalls[i]);
      if ((i + 1) % 10 === 0) {
        dispatch({ type: "CLEARING_PROGRESS", count: i + 1 });
      }
      await wait(80);
    }

    await wait(3000);

    // Nettoyer tube gauche
    console.log("Nettoyage tube gauche");
    await clearLeftTube(phase1Balls);
    await wait(500);

    // ═══ PHASE 3 : 5 boules → tube gauche ═══
    console.log("═══ PHASE 3 ═══");
    dispatch({ type: "START_PHASE3" });

    for (let i = 0; i < PHASE3_COUNT; i++) {
      await wait(DRAW_DELAY);
      await sendBallToLeftTube(phase3Balls[i], i);
      dispatch({ type: "BALL_DRAWN_P3", ballNumber: phase3Balls[i] });
    }

    playVictory();
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
    playVictory,
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
