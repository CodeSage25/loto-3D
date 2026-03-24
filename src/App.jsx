// =============================================================================
// App.jsx — Simulateur de Tirage Loto 3D Photoréaliste (v2 — corrigé)
// =============================================================================

import {
  useState,
  useReducer,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  Component,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import {
  Physics,
  RigidBody,
  BallCollider,
  CuboidCollider,
  useRapier,
} from "@react-three/rapier";

import { motion, AnimatePresence } from "framer-motion";

// =============================================================================
// CONSTANTES
// =============================================================================
const IS_MOBILE =
  typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
const BOULIER_RADIUS = 2.8;
const BALL_RADIUS = 0.22;
const TOTAL_BALLS = 90;
const DRAW_DELAY = 2500;

// Couleurs des boules par groupe (dégradé radial)
const BALL_COLORS = {
  blue: { center: "#60A5FA", edge: "#2563EB" }, // Bleu vif
  red: { center: "#FB7185", edge: "#DC2626" }, // Rouge vif
  green: { center: "#4ADE80", edge: "#16A34A" }, // Vert vif
};

const getBallColorGroup = (num) => {
  if (num <= 30) return BALL_COLORS.blue;
  if (num <= 60) return BALL_COLORS.red;
  return BALL_COLORS.green;
};

// =============================================================================
// MACHINE D'ÉTATS
// =============================================================================
const initialState = {
  phase: "IDLE",
  drawnBalls: [],
  finalBalls: [],
  drawOrder: [],
  totalDrawn: 0,
  statusMessage: "",
};

function drawReducer(state, action) {
  switch (action.type) {
    case "START_DRAW":
      return {
        ...state,
        phase: "DRAWING_PHASE1",
        drawOrder: action.drawOrder,
        drawnBalls: [],
        finalBalls: [],
        totalDrawn: 0,
        statusMessage: "🎯 Tirage Phase 1 en cours...",
      };
    case "BALL_DRAWN_P1":
      return {
        ...state,
        drawnBalls: [...state.drawnBalls, action.ballNumber],
        totalDrawn: state.totalDrawn + 1,
      };
    case "START_CLEARING":
      return {
        ...state,
        phase: "CLEARING",
        statusMessage: "💨 Vidage du boulier...",
      };
    case "START_PHASE2":
      return {
        ...state,
        phase: "DRAWING_PHASE2",
        statusMessage: "⭐ Tirage Final en cours...",
      };
    case "BALL_DRAWN_P2":
      return {
        ...state,
        finalBalls: [...state.finalBalls, action.ballNumber],
        totalDrawn: state.totalDrawn + 1,
      };
    case "FINISH":
      return { ...state, phase: "DONE", statusMessage: "🎉 Tirage terminé !" };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

// =============================================================================
// FISHER-YATES SHUFFLE
// =============================================================================
function fisherYatesShuffle(array) {
  const s = [...array];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

// =============================================================================
// GÉNÉRATION TEXTURE BOULE (OffscreenCanvas)
// =============================================================================
function createBallTexture(number) {
  const size = 256;
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(size, size)
      : (() => {
          const c = document.createElement("canvas");
          c.width = size;
          c.height = size;
          return c;
        })();

  const ctx = canvas.getContext("2d");
  const colors = getBallColorGroup(number);

  // Fond : dégradé radial couvrant tout le canvas
  // Centre plus clair → bord plus foncé = effet sphérique naturel
  const gradient = ctx.createRadialGradient(
    size * 0.35,
    size * 0.3,
    size * 0.02,
    size * 0.5,
    size * 0.5,
    size * 0.55,
  );
  gradient.addColorStop(0, colors.center);
  gradient.addColorStop(0.7, colors.edge);
  gradient.addColorStop(1, colors.edge);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // PAS de cercle blanc derrière le numéro

  // Numéro blanc centré — gros et lisible
  ctx.font = `bold ${size * 0.42}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Ombre portée pour détacher le chiffre du fond coloré
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Chiffre blanc pur
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(number), size / 2, size / 2);

  // Deuxième passe sans ombre pour plus de netteté
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(number), size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

// =============================================================================
// CAMÉRA RESPONSIVE
// =============================================================================
function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    // FOV plus large pour voir le boulier + tube gauche + boîte droite
    camera.fov = aspect < 1 ? 78 : 58;
    // Recentrer légèrement vers la droite pour équilibrer la vue
    camera.position.set(1, -0.5, 12);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

// =============================================================================
// COMPOSANT BOULE — bille physique + visuel
// =============================================================================
// IMPORTANT : renderOrder={0} pour les boules, renderOrder={10} pour le verre
// Le verre doit se rendre APRÈS les boules pour que la transparence fonctionne.

function Ball({ number, index, phase, onBallReady }) {
  const rigidBodyRef = useRef();
  const meshRef = useRef();
  const frameCount = useRef(0);
  const isDrawn = useRef(false);

  // Texture générée une seule fois
  const texture = useMemo(() => createBallTexture(number), [number]);

  // Position initiale dans le boulier (coordonnées sphériques)
  // On limite le rayon à 60% pour que les boules ne soient pas collées aux parois
  const initialPosition = useMemo(() => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.5 + Math.random() * (BOULIER_RADIUS * 0.55);
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.6, // Tasser verticalement
      r * Math.cos(phi) * 0.5, // Réduire la profondeur Z pour que les boules soient plus visibles
    ];
  }, []);

  const handleRef = useCallback(
    (api) => {
      rigidBodyRef.current = api;
      if (api) {
        // Impulsion initiale pour lancer le brassage
        const angle = index * ((Math.PI * 2) / TOTAL_BALLS);
        api.applyImpulse(
          {
            x: Math.cos(angle) * 0.4,
            y: Math.sin(angle * 0.7) * 0.3 + 0.2,
            z: Math.sin(angle) * 0.2,
          },
          true,
        );
        if (onBallReady) onBallReady(number, api, meshRef);
      }
    },
    [index, number, onBallReady],
  );

  // Brassage tourbillonnant + nettoyage
  useFrame(() => {
    const rb = rigidBodyRef.current;
    if (!rb || isDrawn.current) return;

    const pos = rb.translation();

    // Supprimer si tombée trop bas
    if (pos.y < -12) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    frameCount.current++;
    if (frameCount.current % 6 !== 0) return;

    // Brassage fluide uniquement pendant IDLE et les phases de tirage
    if (
      phase === "IDLE" ||
      phase === "DRAWING_PHASE1" ||
      phase === "DRAWING_PHASE2"
    ) {
      const t = Date.now() * 0.001;
      const uniqueAngle = t * 1.5 + index * ((Math.PI * 2) / TOTAL_BALLS);

      // Mouvement tourbillonnant : les boules tournent en spirale
      // avec une composante aléatoire pour éviter les motifs réguliers
      const impulseStrength = 0.012;
      rb.applyImpulse(
        {
          x:
            Math.cos(uniqueAngle) * impulseStrength +
            (Math.random() - 0.5) * 0.004,
          y:
            Math.sin(uniqueAngle * 0.6) * impulseStrength * 0.8 +
            (Math.random() - 0.5) * 0.004,
          z:
            Math.sin(uniqueAngle * 1.3) * impulseStrength * 0.6 +
            (Math.random() - 0.5) * 0.003,
        },
        true,
      );

      // Clamp de la vitesse pour éviter les boules trop rapides
      const vel = rb.linvel();
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
      if (speed > 3) {
        const scale = 3 / speed;
        rb.setLinvel(
          { x: vel.x * scale, y: vel.y * scale, z: vel.z * scale },
          true,
        );
      }
    }
  });

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  return (
    <RigidBody
      ref={handleRef}
      position={initialPosition}
      colliders={false}
      restitution={0.5}
      friction={0.2}
      linearDamping={0.4}
      angularDamping={0.3}
      type="dynamic"
    >
      <BallCollider args={[BALL_RADIUS]} />
      {/* renderOrder={0} = rendu AVANT le verre du boulier */}
      <mesh ref={meshRef} renderOrder={0}>
        <sphereGeometry args={[BALL_RADIUS, 28, 28]} />
        // Dans Ball, remplacer le meshPhysicalMaterial par : // Dans Ball,
        remplacer le meshPhysicalMaterial par :
        <meshStandardMaterial
          map={texture}
          roughness={1}
          metalness={1}
          envMapIntensity={0.3}
        />
      </mesh>
    </RigidBody>
  );
}

// =============================================================================
// CONFINEMENT SPHÉRIQUE — Force qui maintient les boules dans le boulier
// =============================================================================
// Rapier n'a pas de collider creux/inversé. On utilise une force de rappel
// qui repousse les boules vers le centre quand elles s'approchent des bords.
// C'est le cœur de la physique du boulier.

function BoulierConfinement({ ballRefs, phase, gateOpen }) {
  useFrame(() => {
    if (!ballRefs.current) return;

    Object.values(ballRefs.current).forEach(({ rb, drawn }) => {
      if (!rb || drawn) return;

      try {
        const pos = rb.translation();
        const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
        const innerRadius = BOULIER_RADIUS - BALL_RADIUS - 0.15;

        if (dist > innerRadius) {
          // Force de rappel douce mais ferme
          const overshoot = dist - innerRadius;
          const strength = overshoot * 15; // Force proportionnelle au dépassement
          const nx = pos.x / dist;
          const ny = pos.y / dist;
          const nz = pos.z / dist;

          rb.applyImpulse(
            {
              x: -nx * strength * 0.016,
              y: -ny * strength * 0.016,
              z: -nz * strength * 0.016,
            },
            true,
          );

          // Si la boule est TRÈS loin, la téléporter à l'intérieur
          if (dist > BOULIER_RADIUS + 0.5) {
            const safeR = innerRadius * 0.7;
            rb.setTranslation(
              {
                x: nx * safeR || 0,
                y: ny * safeR || 0,
                z: nz * safeR || 0,
              },
              true,
            );
            rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
          }
        }
        // Dans BoulierConfinement, remplacer le bloc "Bloquer le bas du boulier"
        // par cette version qui simule une trappe :

        if (!gateOpen) {
          // Porte fermée : bloquer le bas du boulier
          if (pos.y < -(BOULIER_RADIUS - BALL_RADIUS - 0.3)) {
            rb.applyImpulse({ x: 0, y: 0.08, z: 0 }, true);
          }
        } else {
          if (phase === "DRAWING_PHASE1" || phase === "DRAWING_PHASE2") {
            // Pendant le tirage : bloquer le bas sauf la zone du canal (centre)
            if (pos.y < -(BOULIER_RADIUS - BALL_RADIUS - 0.3)) {
              const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
              if (distFromCenter > 0.5) {
                rb.applyImpulse({ x: 0, y: 0.08, z: 0 }, true);
              }
            }
          } else if (phase === "CLEARING") {
            // Pendant le vidage : pousser les boules non-tirées vers la droite
            // pour qu'elles trouvent l'entrée du tuyau d'évacuation
            if (!drawn) {
              rb.applyImpulse(
                {
                  x: 0.02, // Vers la droite
                  y: -0.01, // Légèrement vers le bas
                  z: 0,
                },
                true,
              );
            }
          }
        }
      } catch (e) {
        // RigidBody peut être supprimé entre-temps
      }
    });
  });

  return null;
}

// =============================================================================
// BOULIER — Sphère de verre + globe + agitateur
// =============================================================================
// CORRECTION MAJEURE : le verre est rendu en DERNIER (renderOrder={10})
// avec depthWrite={false} pour que les boules à l'intérieur soient VISIBLES.

function Boulier({ phase }) {
  const globeRef = useRef();
  const agitatorRef = useRef();

  const globeEdges = useMemo(() => {
    return new THREE.EdgesGeometry(
      new THREE.SphereGeometry(BOULIER_RADIUS + 0.05, 24, 16),
    );
  }, []);

  useFrame((_, delta) => {
    // Globe : rotation lente UNIQUEMENT sur les lignes décoratives
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }

    // Agitateur : rotation sur lui-même (PAS le boulier)
    if (agitatorRef.current) {
      if (phase === "CLEARING" || phase === "DONE") {
        agitatorRef.current.children.forEach((child) => {
          if (child.material) {
            child.material.opacity = Math.max(
              0,
              (child.material.opacity || 1) - delta * 2,
            );
            child.material.transparent = true;
          }
        });
        if (phase === "DONE") agitatorRef.current.visible = false;
      } else {
        agitatorRef.current.visible = true;
        // L'agitateur tourne, PAS le boulier
        agitatorRef.current.rotation.y += 0.015;
        agitatorRef.current.rotation.x += 0.004;
      }
    }

    // Le boulier lui-même (la sphère de verre) NE BOUGE JAMAIS
    // Pas de rotation sur le group parent
  });

  const armAngles = [0, 60, 120, 180, 240, 300];

  return (
    // Position fixe [0, 0, 0] — le boulier ne bouge jamais
    <group position={[0, 0, 0]}>
      {/* ===== SPHÈRE DE VERRE — plus opaque, teintée ===== */}
      <mesh renderOrder={10}>
        <sphereGeometry args={[BOULIER_RADIUS, 64, 64]} />
        <meshPhysicalMaterial
          transmission={0.88}
          roughness={0.06}
          metalness={0}
          thickness={0.3}
          ior={1.45}
          transparent={true}
          opacity={0.18}
          depthWrite={false}
          side={THREE.DoubleSide}
          color="#a0c4e8" // Teinte bleutée visible
          envMapIntensity={0.2}
        />
      </mesh>

      {/* Deuxième sphère intérieure pour l'effet de double paroi */}
      <mesh renderOrder={10}>
        <sphereGeometry args={[BOULIER_RADIUS - 0.06, 64, 64]} />
        <meshPhysicalMaterial
          transmission={0.98}
          roughness={0.02}
          metalness={0}
          thickness={0.1}
          ior={1.5}
          transparent={true}
          opacity={0.08}
          depthWrite={false}
          side={THREE.FrontSide}
          color="#ffffff"
          envMapIntensity={0.4}
        />
      </mesh>

      {/* ===== AGITATEUR CENTRAL ===== */}
      <group ref={agitatorRef}>
        {/* Hub central */}
        <mesh renderOrder={5}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color="#dddddd"
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>

        {/* Axe vertical */}
        <mesh renderOrder={5}>
          <cylinderGeometry args={[0.04, 0.04, BOULIER_RADIUS * 1.4, 8]} />
          <meshStandardMaterial
            color="#bbbbbb"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* 6 bras avec extrémités */}
        {armAngles.map((deg, i) => {
          const radY = (deg * Math.PI) / 180;
          const tiltX = ((i % 2 === 0 ? 1 : -1) * Math.PI) / 10;
          const armLength = BOULIER_RADIUS * 0.7;
          return (
            <group key={`arm-${i}`} rotation={[tiltX, radY, 0]}>
              {/* Bras */}
              <mesh renderOrder={5}>
                <boxGeometry args={[0.05, armLength, 0.05]} />
                <meshStandardMaterial
                  color="#aaaaaa"
                  metalness={0.85}
                  roughness={0.15}
                  envMapIntensity={1.5}
                />
              </mesh>

              {/* Palette au bout du bras — pousse les boules */}
              <mesh position={[0, armLength / 2, 0]} renderOrder={5}>
                <boxGeometry args={[0.3, 0.08, 0.15]} />
                <meshStandardMaterial
                  color="#ff6600"
                  metalness={0.5}
                  roughness={0.3}
                  emissive="#ff4400"
                  emissiveIntensity={0.2}
                />
              </mesh>

              {/* Sphère lumineuse au bout */}
              <mesh position={[0, -armLength / 2, 0]} renderOrder={5}>
                <sphereGeometry args={[0.07, 10, 10]} />
                <meshStandardMaterial
                  color="#ff8800"
                  emissive="#ff5500"
                  emissiveIntensity={0.4}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ===== ANNEAU DE BASE (socle du boulier) ===== */}
      <mesh position={[0, -BOULIER_RADIUS + 0.1, 0]} renderOrder={3}>
        <torusGeometry args={[1.2, 0.08, 12, 32]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ===== ENTONNOIR GAUCHE — vers le canal de tirage ===== */}
      <mesh
        position={[-0.3, -BOULIER_RADIUS - 0.25, 0]}
        rotation={[0, 0, 0.15]}
        renderOrder={3}
      >
        <cylinderGeometry args={[0.35, 0.25, 0.45, 16, 1, true]} />
        <meshPhysicalMaterial
          transmission={0.85}
          roughness={0.05}
          metalness={0.1}
          transparent={true}
          opacity={0.3}
          depthWrite={false}
          side={THREE.DoubleSide}
          color="#88aad0"
          envMapIntensity={0.2}
        />
      </mesh>

      {/* ===== ENTONNOIR DROIT — vers le tuyau d'évacuation ===== */}
      <mesh
        position={[0.3, -BOULIER_RADIUS - 0.25, 0]}
        rotation={[0, 0, -0.15]}
        renderOrder={3}
      >
        <cylinderGeometry args={[0.35, 0.25, 0.45, 16, 1, true]} />
        <meshPhysicalMaterial
          transmission={0.85}
          roughness={0.05}
          metalness={0.1}
          transparent={true}
          opacity={0.3}
          depthWrite={false}
          side={THREE.DoubleSide}
          color="#88aad0"
          envMapIntensity={0.2}
        />
      </mesh>

      {/* Séparateur central entre les deux entonnoirs */}
      <mesh position={[0, -BOULIER_RADIUS - 0.15, 0]} renderOrder={3}>
        <boxGeometry args={[0.06, 0.5, 0.5]} />
        <meshStandardMaterial
          color="#778899"
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}

// =============================================================================
// CANAL — Pont/gouttière SOUS le boulier connecté au tube
// =============================================================================
// CORRECTION : le canal part directement du bas du boulier et descend
// en pente douce vers le tube de réception sur la gauche.

function Canal() {
  const startY = -BOULIER_RADIUS - 0.5;
  const endY = -4.0; // Même Y que le téléport des boules
  const startX = -0.3; // Entonnoir gauche
  const endX = -1.0; // Entrée du tube

  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const cx = (startX + endX) / 2;
  const cy = (startY + endY) / 2;

  const canalMaterialProps = {
    transmission: 0.7,
    roughness: 0.12,
    metalness: 0.08,
    thickness: 0.25,
    ior: 1.45,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    color: "#88aad0",
    envMapIntensity: 0.3,
    side: THREE.DoubleSide,
  };

  return (
    <group>
      {/* Fond */}
      <mesh position={[cx, cy, 0]} rotation={[0, 0, angle]} renderOrder={8}>
        <boxGeometry args={[length + 0.6, 0.06, 0.55]} />
        <meshPhysicalMaterial {...canalMaterialProps} />
      </mesh>

      {/* Paroi Z- */}
      <mesh
        position={[cx, cy + 0.12, -0.27]}
        rotation={[0, 0, angle]}
        renderOrder={8}
      >
        <boxGeometry args={[length + 0.6, 0.28, 0.06]} />
        <meshPhysicalMaterial {...canalMaterialProps} />
      </mesh>

      {/* Paroi Z+ */}
      <mesh
        position={[cx, cy + 0.12, 0.27]}
        rotation={[0, 0, angle]}
        renderOrder={8}
      >
        <boxGeometry args={[length + 0.6, 0.28, 0.06]} />
        <meshPhysicalMaterial {...canalMaterialProps} />
      </mesh>

      {/* Colliders */}
      <RigidBody type="fixed" position={[cx, cy, 0]} rotation={[0, 0, angle]}>
        <CuboidCollider
          args={[(length + 0.6) / 2, 0.03, 0.28]}
          restitution={0.3}
          friction={0.3}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[cx, cy + 0.12, -0.3]}
        rotation={[0, 0, angle]}
      >
        <CuboidCollider
          args={[(length + 0.6) / 2, 0.14, 0.03]}
          restitution={0.3}
          friction={0.3}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[cx, cy + 0.12, 0.3]}
        rotation={[0, 0, angle]}
      >
        <CuboidCollider
          args={[(length + 0.6) / 2, 0.14, 0.03]}
          restitution={0.3}
          friction={0.3}
        />
      </RigidBody>
    </group>
  );
}

// =============================================================================
// TUBE DE RÉCEPTION — connecté au bout du canal
// =============================================================================

function ReceptionTube() {
  const tubeY = -4;
  const tubeLength = 4.0; // Plus long pour couvrir du canal jusqu'au bout
  const tubeX = -1.0 - tubeLength / 2; // Commence à x=-1.0 (sortie du canal)
  const tubeRadius = 0.38;

  const glassMat = {
    transmission: 0.75,
    roughness: 0.08,
    metalness: 0.08,
    thickness: 0.8,
    ior: 1.5,
    transparent: true,
    opacity: 0.45, // Plus opaque qu'avant
    depthWrite: false,
    color: "#90b8e0", // Bleu-gris plus visible
    envMapIntensity: 0.4,
    side: THREE.DoubleSide,
  };

  return (
    <group>
      {/* Tube principal — commence à la sortie du canal */}
      <mesh
        position={[tubeX, tubeY, 0]}
        rotation={[0, 0, Math.PI / 2]}
        renderOrder={9}
      >
        <cylinderGeometry
          args={[tubeRadius, tubeRadius, tubeLength, 32, 1, true]}
        />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Bouchon gauche (extrémité fermée) */}
      <mesh
        position={[tubeX - tubeLength / 2, tubeY, 0]}
        rotation={[0, Math.PI / 2, 0]}
        renderOrder={9}
      >
        <circleGeometry args={[tubeRadius, 32]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Bouchon droit (extrémité côté canal — semi-ouvert visuellement) */}
      <mesh
        position={[tubeX + tubeLength / 2, tubeY, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        renderOrder={9}
      >
        <ringGeometry args={[tubeRadius - 0.08, tubeRadius, 32]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Supports métalliques */}
      {[tubeX - tubeLength * 0.3, tubeX, tubeX + tubeLength * 0.3].map(
        (x, i) => (
          <group key={`support-${i}`}>
            <mesh position={[x, tubeY - tubeRadius - 0.3, 0]} renderOrder={3}>
              <boxGeometry args={[0.08, 0.6, 0.08]} />
              <meshStandardMaterial
                color="#777"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[x, tubeY - tubeRadius - 0.6, 0]} renderOrder={3}>
              <boxGeometry args={[0.35, 0.05, 0.35]} />
              <meshStandardMaterial
                color="#666"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          </group>
        ),
      )}

      {/* ===== COLLIDERS DU TUBE ===== */}

      {/* Fond */}
      <RigidBody type="fixed" position={[tubeX, tubeY - tubeRadius + 0.03, 0]}>
        <CuboidCollider
          args={[tubeLength / 2, 0.03, tubeRadius * 0.75]}
          restitution={0.2}
          friction={0.5}
        />
      </RigidBody>

      {/* Plafond */}
      <RigidBody type="fixed" position={[tubeX, tubeY + tubeRadius - 0.03, 0]}>
        <CuboidCollider
          args={[tubeLength / 2, 0.03, tubeRadius * 0.75]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>

      {/* Paroi arrière Z- */}
      <RigidBody type="fixed" position={[tubeX, tubeY, -tubeRadius]}>
        <CuboidCollider
          args={[tubeLength / 2, tubeRadius, 0.03]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>

      {/* Paroi avant Z+ */}
      <RigidBody type="fixed" position={[tubeX, tubeY, tubeRadius]}>
        <CuboidCollider
          args={[tubeLength / 2, tubeRadius, 0.03]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>

      {/* Bouchon gauche physique */}
      <RigidBody
        type="fixed"
        position={[tubeX - tubeLength / 2 - 0.03, tubeY, 0]}
      >
        <CuboidCollider
          args={[0.03, tubeRadius, tubeRadius]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>
    </group>
  );
}
// =============================================================================
// BOÎTE DE COLLECTION — Reçoit les 77 boules évacuées à droite du boulier
// =============================================================================
// Une boîte transparente connectée au boulier par un tuyau incliné.
// Les boules glissent dans le tuyau et s'empilent dans la boîte.

function CollectionBox() {
  const boxX = 4.5;
  const boxY = -4.2;
  const boxWidth = 2.8;
  const boxHeight = 2.0;
  const boxDepth = 1.8;

  const glassMat = {
    transmission: 0.7,
    roughness: 10,
    metalness: 1,
    thickness: 0.4,
    ior: 1.45,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    color: "#88aad0",
    envMapIntensity: 0.3,
    side: THREE.DoubleSide,
  };

  // Tuyau : part de l'entonnoir droit (sous le boulier) vers la boîte
  const tubeStartX = 0.3; // Entonnoir droit X
  const tubeStartY = -BOULIER_RADIUS - 0.5; // Bas de l'entonnoir
  const tubeEndX = boxX - boxWidth / 2; // Entrée gauche de la boîte
  const tubeEndY = boxY + boxHeight / 4 - 0.3; // Haut de la boîte

  const tubeDx = tubeEndX - tubeStartX;
  const tubeDy = tubeEndY - tubeStartY;
  const tubeLength = Math.sqrt(tubeDx * tubeDx + tubeDy * tubeDy);
  const tubeAngle = Math.atan2(tubeDy, tubeDx);
  const tubeCx = (tubeStartX + tubeEndX) / 2;
  const tubeCy = (tubeStartY + tubeEndY) / 2;

  return (
    <group>
      {/* ===== TUYAU D'ÉVACUATION ===== */}

      {/* Fond */}
      <mesh
        position={[tubeCx, tubeCy, 0]}
        rotation={[0, 0, tubeAngle]}
        renderOrder={8}
      >
        <boxGeometry args={[tubeLength + 0.3, 0.06, 0.55]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Paroi arrière Z- */}
      <mesh
        position={[tubeCx, tubeCy + 0.12, -0.27]}
        rotation={[0, 0, tubeAngle]}
        renderOrder={8}
      >
        <boxGeometry args={[tubeLength + 0.3, 0.28, 0.06]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Paroi avant Z+ */}
      <mesh
        position={[tubeCx, tubeCy + 0.12, 0.27]}
        rotation={[0, 0, tubeAngle]}
        renderOrder={8}
      >
        <boxGeometry args={[tubeLength + 0.3, 0.28, 0.06]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Plafond du tuyau */}
      <mesh
        position={[tubeCx, tubeCy + 0.25, 0]}
        rotation={[0, 0, tubeAngle]}
        renderOrder={8}
      >
        <boxGeometry args={[tubeLength + 0.3, 0.06, 0.55]} />
        <meshPhysicalMaterial {...glassMat} opacity={0.2} />
      </mesh>

      {/* Colliders du tuyau */}
      <RigidBody
        type="fixed"
        position={[tubeCx, tubeCy, 0]}
        rotation={[0, 0, tubeAngle]}
      >
        <CuboidCollider
          args={[(tubeLength + 0.3) / 2, 0.03, 0.28]}
          restitution={0.3}
          friction={0.25}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[tubeCx, tubeCy + 0.12, -0.3]}
        rotation={[0, 0, tubeAngle]}
      >
        <CuboidCollider
          args={[(tubeLength + 0.3) / 2, 0.14, 0.03]}
          restitution={0.3}
          friction={0.25}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[tubeCx, tubeCy + 0.12, 0.3]}
        rotation={[0, 0, tubeAngle]}
      >
        <CuboidCollider
          args={[(tubeLength + 0.3) / 2, 0.14, 0.03]}
          restitution={0.3}
          friction={0.25}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[tubeCx, tubeCy + 0.25, 0]}
        rotation={[0, 0, tubeAngle]}
      >
        <CuboidCollider
          args={[(tubeLength + 0.3) / 2, 0.03, 0.28]}
          restitution={0.3}
          friction={0.25}
        />
      </RigidBody>

      {/* ===== BOÎTE DE COLLECTION ===== */}

      {/* Face arrière Z- */}
      <mesh position={[boxX, boxY, -boxDepth / 2]} renderOrder={8}>
        <boxGeometry args={[boxWidth, boxHeight, 0.06]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Face avant Z+ (côté caméra) */}
      <mesh position={[boxX, boxY, boxDepth / 2]} renderOrder={10}>
        <boxGeometry args={[boxWidth, boxHeight, 0.06]} />
        <meshPhysicalMaterial {...glassMat} opacity={0.2} />
      </mesh>

      {/* Face gauche (ouverture haute pour le tuyau) */}
      <mesh position={[boxX - boxWidth / 2, boxY - 0.3, 0]} renderOrder={8}>
        <boxGeometry args={[0.06, boxHeight - 0.6, boxDepth]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Face droite */}
      <mesh position={[boxX + boxWidth / 2, boxY, 0]} renderOrder={8}>
        <boxGeometry args={[0.06, boxHeight, boxDepth]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Fond */}
      <mesh position={[boxX, boxY - boxHeight / 2, 0]} renderOrder={8}>
        <boxGeometry args={[boxWidth, 0.06, boxDepth]} />
        <meshPhysicalMaterial {...glassMat} opacity={0.4} />
      </mesh>

      {/* Colliders de la boîte */}
      <RigidBody type="fixed" position={[boxX, boxY - boxHeight / 2, 0]}>
        <CuboidCollider
          args={[boxWidth / 2, 0.03, boxDepth / 2]}
          restitution={0.2}
          friction={0.5}
        />
      </RigidBody>
      <RigidBody type="fixed" position={[boxX, boxY, -boxDepth / 2 - 0.03]}>
        <CuboidCollider
          args={[boxWidth / 2, boxHeight / 2, 0.03]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>
      <RigidBody type="fixed" position={[boxX, boxY, boxDepth / 2 + 0.03]}>
        <CuboidCollider
          args={[boxWidth / 2, boxHeight / 2, 0.03]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[boxX - boxWidth / 2 - 0.03, boxY - 0.3, 0]}
      >
        <CuboidCollider
          args={[0.03, (boxHeight - 0.6) / 2, boxDepth / 2]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>
      <RigidBody type="fixed" position={[boxX + boxWidth / 2 + 0.03, boxY, 0]}>
        <CuboidCollider
          args={[0.03, boxHeight / 2, boxDepth / 2]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>

      {/* Supports */}
      {[boxX - boxWidth * 0.35, boxX + boxWidth * 0.35].map((x, i) => (
        <group key={`box-support-${i}`}>
          <mesh
            position={[x, boxY - boxHeight / 2 - 0.4, -boxDepth * 0.35]}
            renderOrder={3}
          >
            <boxGeometry args={[0.07, 0.8, 0.07]} />
            <meshStandardMaterial
              color="#777"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          <mesh
            position={[x, boxY - boxHeight / 2 - 0.4, boxDepth * 0.35]}
            renderOrder={3}
          >
            <boxGeometry args={[0.07, 0.8, 0.07]} />
            <meshStandardMaterial
              color="#777"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
// =============================================================================
// SCÈNE PRINCIPALE — assemble tout
// =============================================================================

function Scene({ state, dispatch, startDrawRef }) {
  const ballRefs = useRef({});
  const drawTimeouts = useRef([]);
  const [gateOpen, setGateOpen] = useState(false);

  const handleBallReady = useCallback((number, rb, meshRef) => {
    ballRefs.current[number] = { rb, mesh: meshRef, drawn: false };
  }, []);

  // Fonction pour tirer une boule vers le canal
  const drawBall = useCallback((ballNumber) => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        const ballData = ballRefs.current[ballNumber];
        if (!ballData || !ballData.rb) {
          resolve();
          return;
        }

        ballData.drawn = true;

        try {
          // Téléporter à l'entrée du tube gauche via l'entonnoir gauche
          // Position : entrée droite du tube horizontal
          ballData.rb.setTranslation(
            {
              x: -1.0,
              y: -4.0,
              z: 0,
            },
            true,
          );

          ballData.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
          ballData.rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

          // Forte impulsion vers la gauche dans le tube
          ballData.rb.applyImpulse({ x: -1.0, y: -0.02, z: 0 }, true);

          // Relance après 400ms si la boule ralentit
          const boostTimeout = setTimeout(() => {
            try {
              const vel = ballData.rb.linvel();
              if (Math.abs(vel.x) < 0.8) {
                ballData.rb.applyImpulse({ x: -0.6, y: 0, z: 0 }, true);
              }
            } catch (e) {}
          }, 400);
          drawTimeouts.current.push(boostTimeout);

          // Deuxième relance après 800ms
          const boost2 = setTimeout(() => {
            try {
              const vel = ballData.rb.linvel();
              if (Math.abs(vel.x) < 0.5) {
                ballData.rb.applyImpulse({ x: -0.4, y: 0, z: 0 }, true);
              }
            } catch (e) {}
          }, 800);
          drawTimeouts.current.push(boost2);
        } catch (e) {
          console.warn("Erreur déplacement boule:", e);
        }

        resolve();
      }, DRAW_DELAY);
      drawTimeouts.current.push(timeout);
    });
  }, []);

  // Délai utilitaire
  const wait = useCallback((ms) => {
    return new Promise((r) => {
      const t = setTimeout(r, ms);
      drawTimeouts.current.push(t);
    });
  }, []);

  // Séquence de tirage complète
  const startDraw = useCallback(async () => {
    const numbers = Array.from({ length: TOTAL_BALLS }, (_, i) => i + 1);
    const shuffled = fisherYatesShuffle(numbers);

    dispatch({ type: "START_DRAW", drawOrder: shuffled });
    setGateOpen(true);

    // PHASE 1 : 8 boules
    for (let i = 0; i < 8; i++) {
      await drawBall(shuffled[i]);
      dispatch({ type: "BALL_DRAWN_P1", ballNumber: shuffled[i] });
    }

    await wait(1500);

    // Masquer les boules du tube une par une
    for (let i = 0; i < 8; i++) {
      const bd = ballRefs.current[shuffled[i]];
      if (bd?.mesh?.current) bd.mesh.current.visible = false;
      await wait(150);
    }

    // CLEARING : évacuer les 77 boules par le tuyau droit vers la boîte
    dispatch({ type: "START_CLEARING" });

    const remainingBalls = [];
    for (let i = 13; i < TOTAL_BALLS; i++) {
      const bd = ballRefs.current[shuffled[i]];
      if (bd?.rb) remainingBalls.push(bd);
    }

    // Envoyer les boules une par une pour éviter les chevauchements
    // Chaque boule est téléportée à l'entrée du tuyau droit
    for (let i = 0; i < remainingBalls.length; i++) {
      const bd = remainingBalls[i];

      try {
        bd.drawn = true;

        // Téléporter à l'entrée du tuyau droit (entonnoir droit)
        bd.rb.setTranslation(
          {
            x: 0.3,
            y: -BOULIER_RADIUS - 0.4,
            z: (Math.random() - 0.5) * 0.15,
          },
          true,
        );

        bd.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        bd.rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

        // Impulsion vers la droite (direction de la boîte)
        bd.rb.applyImpulse(
          {
            x: 0.7,
            y: -0.1,
            z: (Math.random() - 0.5) * 0.05,
          },
          true,
        );

        bd.rb.applyTorqueImpulse(
          {
            x: (Math.random() - 0.5) * 0.1,
            y: (Math.random() - 0.5) * 0.1,
            z: (Math.random() - 0.5) * 0.1,
          },
          true,
        );
      } catch (e) {}

      // Délai entre chaque boule pour éviter les embouteillages
      // Plus court que le tirage (on veut que ça aille vite mais proprement)
      await wait(120);
    }

    // Attendre que les dernières boules arrivent dans la boîte
    await wait(2500);

    // PHASE 2 : 5 boules finales
    dispatch({ type: "START_PHASE2" });

    for (let i = 8; i < 13; i++) {
      await drawBall(shuffled[i]);
      dispatch({ type: "BALL_DRAWN_P2", ballNumber: shuffled[i] });
    }

    dispatch({ type: "FINISH" });
    setGateOpen(false);
  }, [dispatch, drawBall, wait]);

  // Exposer startDraw au parent
  useEffect(() => {
    startDrawRef.current = startDraw;
  }, [startDraw, startDrawRef]);

  // Nettoyage
  useEffect(() => {
    return () => drawTimeouts.current.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <>
      <ResponsiveCamera />

      {/* ===== ENVIRONNEMENT HDRI ===== */}
      <Environment
        preset="studio"
        background={false}
        environmentIntensity={1.0}
      />

      {/* ===== ÉCLAIRAGE ===== */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.7} color="#fff8e8" />

      <pointLight
        position={[0, -5, 2]}
        intensity={0.3}
        color="#4488ff"
        distance={8}
      />
      {/* Lumière arrière pour souligner les contours des boules */}
      <pointLight
        position={[0, 2, -5]}
        intensity={0.4}
        color="#ffffff"
        distance={10}
      />

      {/* ===== OMBRES ===== */}
      <ContactShadows
        position={[0, -5.8, 0]}
        opacity={0.5}
        scale={14}
        blur={2.5}
        far={7}
        color="#000033"
      />

      {/* ===== SOL ===== */}
      <mesh
        position={[0, -6.0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={-1}
      >
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial
          color="#080818"
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* ===== PHYSIQUE ===== */}
      <Physics gravity={[0, -9.81, 0]}>
        {/* Boulier visuel */}
        <Boulier phase={state.phase} />

        {/* Canal sous le boulier → tube */}
        <Canal />

        {/* Tube de réception */}
        <ReceptionTube />
        {/* Boîte de collection (droite) — reçoit les 77 boules évacuées */}
        <CollectionBox />

        {/* Confinement sphérique */}
        <BoulierConfinement
          ballRefs={ballRefs}
          phase={state.phase}
          gateOpen={gateOpen}
        />

        {/* 90 Boules */}
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

      {/* ===== POST-PROCESSING ===== */}
    </>
  );
}

// =============================================================================
// JETON — Boule tirée affichée dans l'UI
// =============================================================================

function Jeton({ number, type, delay = 0 }) {
  const bg = {
    gagnante: "bg-blue-700",
    bonus: "bg-purple-600",
    finale: "bg-yellow-500",
  }[type];
  const text = type === "finale" ? "text-black" : "text-white";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: -180 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: delay * 0.08,
      }}
      className={`w-9 h-9 md:w-11 md:h-11 ${bg} ${text} rounded-full font-bold flex items-center justify-center text-sm md:text-base shadow-lg`}
    >
      <motion.span
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 0.3, delay: delay * 0.08 + 0.15 }}
      >
        {number}
      </motion.span>
    </motion.div>
  );
}

// =============================================================================
// EMPLACEMENT VIDE
// =============================================================================

function EmptySlot({ type }) {
  const border = {
    gagnante: "border-blue-700/40",
    bonus: "border-purple-600/40",
    finale: "border-yellow-500/40",
  }[type];
  return (
    <div
      className={`w-9 h-9 md:w-11 md:h-11 border-2 border-dashed ${border} rounded-full`}
    />
  );
}

// =============================================================================
// OVERLAY UI
// =============================================================================

function UIOverlay({ state, dispatch, onStartDraw }) {
  const isActive = state.phase !== "IDLE" && state.phase !== "DONE";

  return (
    <div
      className="shrink-0 bg-black/85 backdrop-blur-lg border-t border-white/10 px-4 py-3 md:px-8 md:py-4 flex flex-col gap-2"
      style={{ height: "38vh" }}
    >
      {/* Status */}
      {state.statusMessage && (
        <p
          className={`text-center text-sm md:text-base font-medium ${isActive ? "animate-pulse text-blue-300" : "text-white"}`}
        >
          {state.statusMessage}
        </p>
      )}

      {/* Barre de progression */}
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

      {/* Rangée Phase 1 */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          Phase 1
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

      {/* Rangée Finales */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          Finales
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

      {/* Boutons */}
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
          onClick={() => dispatch({ type: "RESET" })}
          className="py-2.5 px-5 rounded-full font-semibold text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("3D Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-950 text-white p-8">
          <div className="text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h2 className="text-lg font-bold mb-2">Erreur de rendu 3D</h2>
            <p className="text-gray-400 text-sm mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-blue-600 rounded-full text-sm hover:bg-blue-700"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// =============================================================================
// APP — Racine
// =============================================================================

export default function App() {
  const [state, dispatch] = useReducer(drawReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const startDrawRef = useRef(null);

  const handleStartDraw = useCallback(() => {
    if (startDrawRef.current) startDrawRef.current();
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-black">
      {/* Loading */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="loader"
            className="absolute inset-0 z-50 flex items-center justify-center bg-black"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <p className="text-4xl mb-4 animate-bounce">⏳</p>
              <p className="text-white text-lg">Chargement...</p>
              <p className="text-gray-500 text-xs mt-2">
                Initialisation du moteur physique WASM
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas 3D */}
      <div className="flex-1 relative min-h-0">
        <ErrorBoundary>
          <Canvas
            camera={{ position: [1, -0.5, 12], fov: 58 }}
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
            onCreated={() => setTimeout(() => setIsLoaded(true), 800)}
          >
            <Scene
              state={state}
              dispatch={dispatch}
              startDrawRef={startDrawRef}
            />
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* UI */}
      <UIOverlay
        state={state}
        dispatch={dispatch}
        onStartDraw={handleStartDraw}
      />
    </div>
  );
}
