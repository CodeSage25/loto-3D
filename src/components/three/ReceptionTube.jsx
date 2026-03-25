import * as THREE from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import {
  TUBE_LEFT_ENTRY_X,
  TUBE_LEFT_Y,
  TUBE_LENGTH,
  TUBE_RADIUS,
} from "../../constants";

export function ReceptionTube() {
  const tubeStartX = TUBE_LEFT_ENTRY_X;
  const tubeEndX = tubeStartX - TUBE_LENGTH;
  const tubeCenterX = (tubeStartX + tubeEndX) / 2;
  const tubeY = TUBE_LEFT_Y;

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
          args={[TUBE_RADIUS, TUBE_RADIUS, TUBE_LENGTH, 32, 1, true]}
        />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Bouchon gauche (fermé) */}
      <mesh
        position={[tubeEndX, tubeY, 0]}
        rotation={[0, Math.PI / 2, 0]}
        renderOrder={9}
      >
        <circleGeometry args={[TUBE_RADIUS, 32]} />
        <meshPhysicalMaterial {...glassMat} opacity={0.5} />
      </mesh>

      {/* Bouchon droit (entrée — anneau) */}
      <mesh
        position={[tubeStartX, tubeY, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        renderOrder={9}
      >
        <ringGeometry args={[TUBE_RADIUS - 0.12, TUBE_RADIUS, 32]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Supports */}
      {[
        tubeCenterX - TUBE_LENGTH * 0.3,
        tubeCenterX,
        tubeCenterX + TUBE_LENGTH * 0.3,
      ].map((x, i) => (
        <group key={`tube-support-${i}`}>
          <mesh position={[x, tubeY - TUBE_RADIUS - 0.5, 0]} renderOrder={3}>
            <boxGeometry args={[0.1, 1.0, 0.1]} />
            <meshStandardMaterial
              color="#777"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[x, tubeY - TUBE_RADIUS - 1.0, 0]} renderOrder={3}>
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

      {/* Fond du tube */}
      <RigidBody
        type="fixed"
        position={[tubeCenterX, tubeY - TUBE_RADIUS + 0.04, 0]}
      >
        <CuboidCollider
          args={[TUBE_LENGTH / 2, 0.04, TUBE_RADIUS * 0.8]}
          restitution={0.2}
          friction={0.5}
        />
      </RigidBody>

      {/* Plafond du tube */}
      <RigidBody
        type="fixed"
        position={[tubeCenterX, tubeY + TUBE_RADIUS - 0.04, 0]}
      >
        <CuboidCollider
          args={[TUBE_LENGTH / 2, 0.04, TUBE_RADIUS * 0.8]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>

      {/* Paroi arrière Z- */}
      <RigidBody type="fixed" position={[tubeCenterX, tubeY, -TUBE_RADIUS]}>
        <CuboidCollider
          args={[TUBE_LENGTH / 2, TUBE_RADIUS, 0.04]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>

      {/* Paroi avant Z+ */}
      <RigidBody type="fixed" position={[tubeCenterX, tubeY, TUBE_RADIUS]}>
        <CuboidCollider
          args={[TUBE_LENGTH / 2, TUBE_RADIUS, 0.04]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>

      {/* Bouchon gauche */}
      <RigidBody type="fixed" position={[tubeEndX - 0.04, tubeY, 0]}>
        <CuboidCollider
          args={[0.04, TUBE_RADIUS, TUBE_RADIUS]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>
    </group>
  );
}
