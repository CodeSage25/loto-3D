import * as THREE from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import {
  TUBE_LEFT_ENTRY_X,
  TUBE_LEFT_Y,
  TUBE_LENGTH,
  TUBE_RADIUS,
  TUBE2_ENTRY_X,
  TUBE2_Y,
  TUBE2_LENGTH,
  TUBE2_RADIUS,
} from "../../constants";

function SingleTube({ entryX, tubeY, tubeLength, tubeRadius, label = "" }) {
  const tubeStartX = entryX;
  const tubeEndX = tubeStartX - tubeLength;
  const tubeCenterX = (tubeStartX + tubeEndX) / 2;

  const glassMat = {
    transmission: 0.75,
    roughness: 0.08,
    metalness: 0.08,
    thickness: 0.8,
    ior: 1.5,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    color: "#90b8e0",
    envMapIntensity: 0.4,
    side: THREE.DoubleSide,
  };

  return (
    <group>
      {/* Tube cylindrique */}
      <mesh
        position={[tubeCenterX, tubeY, 0]}
        rotation={[0, 0, Math.PI / 2]}
        renderOrder={9}
      >
        <cylinderGeometry
          args={[tubeRadius, tubeRadius, tubeLength, 32, 1, true]}
        />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Bouchon gauche (fermé) */}
      <mesh
        position={[tubeEndX, tubeY, 0]}
        rotation={[0, Math.PI / 2, 0]}
        renderOrder={9}
      >
        <circleGeometry args={[tubeRadius, 32]} />
        <meshPhysicalMaterial {...glassMat} opacity={0.5} />
      </mesh>

      {/* Bouchon droit (entrée — anneau) */}
      <mesh
        position={[tubeStartX, tubeY, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        renderOrder={9}
      >
        <ringGeometry args={[tubeRadius - 0.12, tubeRadius, 32]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Supports */}
      {[
        tubeCenterX - tubeLength * 0.3,
        tubeCenterX,
        tubeCenterX + tubeLength * 0.3,
      ].map((x, i) => (
        <group key={`${label}-support-${i}`}>
          <mesh position={[x, tubeY - tubeRadius - 0.5, 0]} renderOrder={3}>
            <boxGeometry args={[0.1, 1.0, 0.1]} />
            <meshStandardMaterial
              color="#777"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[x, tubeY - tubeRadius - 1.0, 0]} renderOrder={3}>
            <boxGeometry args={[0.45, 0.06, 0.45]} />
            <meshStandardMaterial
              color="#666"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* ===== COLLIDERS ===== */}

      {/* Fond */}
      <RigidBody
        type="fixed"
        position={[tubeCenterX, tubeY - tubeRadius + 0.04, 0]}
      >
        <CuboidCollider
          args={[tubeLength / 2, 0.04, tubeRadius * 0.8]}
          restitution={0.0}
          friction={2.0}
        />
      </RigidBody>

      {/* Plafond */}
      <RigidBody
        type="fixed"
        position={[tubeCenterX, tubeY + tubeRadius - 0.04, 0]}
      >
        <CuboidCollider
          args={[tubeLength / 2, 0.04, tubeRadius * 0.8]}
          restitution={0.0}
          friction={1.5}
        />
      </RigidBody>

      {/* Paroi Z- */}
      <RigidBody type="fixed" position={[tubeCenterX, tubeY, -tubeRadius]}>
        <CuboidCollider
          args={[tubeLength / 2, tubeRadius, 0.04]}
          restitution={0.0}
          friction={1.5}
        />
      </RigidBody>

      {/* Paroi Z+ */}
      <RigidBody type="fixed" position={[tubeCenterX, tubeY, tubeRadius]}>
        <CuboidCollider
          args={[tubeLength / 2, tubeRadius, 0.04]}
          restitution={0.0}
          friction={1.5}
        />
      </RigidBody>

      {/* Bouchon gauche */}
      <RigidBody type="fixed" position={[tubeEndX - 0.04, tubeY, 0]}>
        <CuboidCollider
          args={[0.04, tubeRadius, tubeRadius]}
          restitution={0.2}
          friction={0.3}
        />
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[tubeRadius, tubeRadius, 0.08, 32]} />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
      </RigidBody>
    </group>
  );
}

export function ReceptionTube() {
  return (
    <group>
      {/* Tube 1 : Phase 1 — 8 boules */}
      <SingleTube
        entryX={TUBE_LEFT_ENTRY_X}
        tubeY={TUBE_LEFT_Y}
        tubeLength={TUBE_LENGTH}
        tubeRadius={TUBE_RADIUS}
        label="tube1"
      />

      {/* Tube 2 : Phase 3 — 5 boules (aligné en dessous) */}
      <SingleTube
        entryX={TUBE2_ENTRY_X}
        tubeY={TUBE2_Y}
        tubeLength={TUBE2_LENGTH}
        tubeRadius={TUBE2_RADIUS}
        label="tube2"
      />
    </group>
  );
}
