import * as THREE from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import {
  BOULIER_RADIUS,
  CANAL_WIDTH,
  CANAL_DEPTH,
  TUBE2_ENTRY_X,
  TUBE2_Y,
  FUNNEL_HEIGHT,
} from "../../constants";

export function Canal() {
  const startX = -0.7;
  const startY = -BOULIER_RADIUS - FUNNEL_HEIGHT - 0.1;
  const endX = TUBE2_ENTRY_X;
  const endY = TUBE2_Y;

  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const cx = (startX + endX) / 2;
  const cy = (startY + endY) / 2;

  const hw = CANAL_DEPTH / 2;
  const wallH = CANAL_WIDTH;

  // Rayon du tube = demi-hauteur du canal pour que ça corresponde
  const tubeRadius = Math.max(hw, wallH / 2);
  const tubeLength = length + 1.3;

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

  return (
    <group>
      {/* ========== VISUEL : Tube cylindrique arrondi ========== */}
      <mesh
        position={[cx, cy + wallH / 2, 0]}
        rotation={[0, 0, angle]}
        renderOrder={8}
      >
        {/* Le cylindre est orienté le long de Y par défaut, 
            on le tourne de 90° sur Z pour l'aligner sur X (longueur du canal) */}
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[tubeRadius, tubeRadius, tubeLength, 32, 1, false]} />
            <meshPhysicalMaterial {...mat} />
          </mesh>
        </group>
      </mesh>

      {/* Version simplifiée : un seul mesh cylindre bien positionné */}
      {/* On remplace le group imbriqué par la bonne rotation composée */}
      <mesh
        position={[cx, cy + wallH / 2, 0]}
        rotation={[0, 0, angle + Math.PI / 2]}
        renderOrder={8}
      >
        <cylinderGeometry args={[tubeRadius, tubeRadius, tubeLength, 32, 1, false]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>

      {/* Bouchon début */}
      <mesh
        position={[
          startX - 0.5 * Math.cos(angle),
          startY - 0.5 * Math.sin(angle) + wallH / 2,
          0,
        ]}
        rotation={[0, 0, angle]}
      >
        <circleGeometry args={[tubeRadius, 32]} />
        <meshPhysicalMaterial {...mat} opacity={0.2} />
      </mesh>

      {/* Bouchon fin */}
      <mesh
        position={[
          endX + 0.5 * Math.cos(angle),
          endY + 0.5 * Math.sin(angle) + wallH / 2,
          0,
        ]}
        rotation={[0, 0, angle + Math.PI]}
      >
        <circleGeometry args={[tubeRadius, 32]} />
        <meshPhysicalMaterial {...mat} opacity={0.2} />
      </mesh>

      {/* ========== COLLIDERS (inchangés, même positionnement) ========== */}

      {/* Collider fond */}
      <RigidBody type="fixed" position={[cx, cy, 0]} rotation={[0, 0, angle]}>
        <CuboidCollider
          args={[tubeLength / 2, 0.04, hw]}
          restitution={0.3}
          friction={0.3}
        />
      </RigidBody>

      {/* Collider paroi Z- */}
      <RigidBody
        type="fixed"
        position={[cx, cy + wallH / 2, -hw - 0.04]}
        rotation={[0, 0, angle]}
      >
        <CuboidCollider
          args={[tubeLength / 2, wallH / 2, 0.04]}
          restitution={0.3}
          friction={0.3}
        />
      </RigidBody>

      {/* Collider paroi Z+ */}
      <RigidBody
        type="fixed"
        position={[cx, cy + wallH / 2, hw + 0.04]}
        rotation={[0, 0, angle]}
      >
        <CuboidCollider
          args={[tubeLength / 2, wallH / 2, 0.04]}
          restitution={0.3}
          friction={0.3}
        />
      </RigidBody>

      {/* Collider plafond */}
      <RigidBody
        type="fixed"
        position={[cx, cy + wallH, 0]}
        rotation={[0, 0, angle]}
      >
        <CuboidCollider
          args={[tubeLength / 2, 0.04, hw]}
          restitution={0.3}
          friction={0.3}
        />
      </RigidBody>
    </group>
  );
}