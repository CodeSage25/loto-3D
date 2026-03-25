import * as THREE from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import {
  BOULIER_RADIUS,
  CANAL_RIGHT_WIDTH,
  CANAL_DEPTH,
  BOX_X,
  BOX_Y,
  BOX_WIDTH,
  BOX_HEIGHT,
  FUNNEL_HEIGHT,
} from "../../constants";

export function CanalRight() {
  const startX = 0.7;
  const startY = -BOULIER_RADIUS - FUNNEL_HEIGHT - 0.1;
  const endX = BOX_X - BOX_WIDTH / 2;
  const endY = BOX_Y + BOX_HEIGHT / 2 - 0.3;

  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const cx = (startX + endX) / 2;
  const cy = (startY + endY) / 2;

  const hw = CANAL_DEPTH / 2;
  const wallH = CANAL_RIGHT_WIDTH;

  // Direction unitaire du canal
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  // Normale perpendiculaire (vers le haut du canal)
  const normX = -dirY;
  const normY = dirX;

  const mat = {
    transmission: 0.7,
    roughness: 0.12,
    metalness: 0.08,
    thickness: 0.25,
    ior: 1.45,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    color: "#88aad0",
    envMapIntensity: 0.3,
    side: THREE.DoubleSide,
  };

  // ═══════════════════════════════════════════
  // Matériau de la sortie — foncé et visible
  // ═══════════════════════════════════════════
  const exitMat = {
    color: "#1a1a3e",
    metalness: 0.9,
    roughness: 0.15,
    side: THREE.DoubleSide,
  };

  // ═══════════════════════════════════════════
  // Position de la sortie (extrémité droite)
  // ═══════════════════════════════════════════
  const exitX = endX + dirX * 0.3;
  const exitY = endY + dirY * 0.3;

  // Épaisseur du cadre de sortie
  const frameThickness = 0.06;

  return (
    <group>
      {/* ══════════════════════════════════════ */}
      {/* CANAL — Fond, Parois, Plafond         */}
      {/* ══════════════════════════════════════ */}

      {/* Fond */}
      <mesh position={[cx, cy, 0]} rotation={[0, 0, angle]} renderOrder={8}>
        <boxGeometry args={[length + 0.6, 0.08, CANAL_DEPTH]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>

      {/* Paroi Z- */}
      <mesh
        position={[cx, cy + wallH / 2, -hw]}
        rotation={[0, 0, angle]}
        renderOrder={8}
      >
        <boxGeometry args={[length + 0.6, wallH, 0.08]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>

      {/* Paroi Z+ */}
      <mesh
        position={[cx, cy + wallH / 2, hw]}
        rotation={[0, 0, angle]}
        renderOrder={8}
      >
        <boxGeometry args={[length + 0.6, wallH, 0.08]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>

      {/* Plafond */}
      <mesh
        position={[cx, cy + wallH, 0]}
        rotation={[0, 0, angle]}
        renderOrder={8}
      >
        <boxGeometry args={[length + 0.6, 0.08, CANAL_DEPTH]} />
        <meshPhysicalMaterial {...mat} opacity={0.15} />
      </mesh>

      {/* ══════════════════════════════════════ */}
      {/* ✅ CADRE DE SORTIE — 4 barres foncées */}
      {/* ══════════════════════════════════════ */}

      <group position={[exitX, exitY, 0]} rotation={[0, 0, angle]}>
        {/* Barre du bas (seuil) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[frameThickness, 0.08, CANAL_DEPTH + 0.1]} />
          <meshStandardMaterial {...exitMat} />
        </mesh>

        {/* Barre du haut (linteau) */}
        <mesh position={[0, wallH, 0]}>
          <boxGeometry args={[frameThickness, 0.08, CANAL_DEPTH + 0.1]} />
          <meshStandardMaterial {...exitMat} />
        </mesh>

        {/* Barre Z- (montant arrière) */}
        <mesh position={[0, wallH / 2, -hw]}>
          <boxGeometry args={[frameThickness, wallH, 0.08]} />
          <meshStandardMaterial {...exitMat} />
        </mesh>

        {/* Barre Z+ (montant avant) */}
        <mesh position={[0, wallH / 2, hw]}>
          <boxGeometry args={[frameThickness, wallH, 0.08]} />
          <meshStandardMaterial {...exitMat} />
        </mesh>

        {/* ✅ Anneau lumineux (optionnel — effet glow) */}
        <pointLight
          position={[0, wallH / 2, 0]}
          intensity={0.3}
          color="#4488ff"
          distance={2}
        />
      </group>

      {/* ══════════════════════════════════════ */}
      {/* COLLIDERS                              */}
      {/* ══════════════════════════════════════ */}

      {/* Fond */}
      <RigidBody type="fixed" position={[cx, cy, 0]} rotation={[0, 0, angle]}>
        <CuboidCollider
          args={[(length + 0.6) / 2, 0.04, hw]}
          restitution={0.3}
          friction={0.25}
        />
      </RigidBody>

      {/* Paroi Z- */}
      <RigidBody
        type="fixed"
        position={[cx, cy + wallH / 2, -hw - 0.04]}
        rotation={[0, 0, angle]}
      >
        <CuboidCollider
          args={[(length + 0.6) / 2, wallH / 2, 0.04]}
          restitution={0.3}
          friction={0.25}
        />
      </RigidBody>

      {/* Paroi Z+ */}
      <RigidBody
        type="fixed"
        position={[cx, cy + wallH / 2, hw + 0.04]}
        rotation={[0, 0, angle]}
      >
        <CuboidCollider
          args={[(length + 0.6) / 2, wallH / 2, 0.04]}
          restitution={0.3}
          friction={0.25}
        />
      </RigidBody>

      {/* Plafond */}
      <RigidBody
        type="fixed"
        position={[cx, cy + wallH, 0]}
        rotation={[0, 0, angle]}
      >
        <CuboidCollider
          args={[(length + 0.6) / 2, 0.04, hw]}
          restitution={0.3}
          friction={0.25}
        />
      </RigidBody>
    </group>
  );
}
