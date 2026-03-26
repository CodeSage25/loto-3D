import * as THREE from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import {
  BOX_X,
  BOX_Y,
  BOX_WIDTH,
  BOX_HEIGHT,
  BOX_DEPTH,
} from "../../constants";

export function CollectionBox() {
  const glassMat = {
    transmission: 0.7,
    roughness: 0.1,
    metalness: 0.05,
    thickness: 0.4,
    ior: 1.45,
    transparent: false,
    opacity: 0.3,
    
    depthWrite: true,
    color: "#88aad0",
    envMapIntensity: 0.3,
    side: THREE.DoubleSide,
  };

  return (
    <group>
      {/* Face arrière Z- */}
      <mesh position={[BOX_X, BOX_Y, -BOX_DEPTH / 2]} renderOrder={8}>
        <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT, 0.07]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Face avant Z+ (côté caméra — très transparent) */}
      <mesh position={[BOX_X, BOX_Y, BOX_DEPTH / 2]} renderOrder={10}>
        <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT, 0.07]} />
        <meshPhysicalMaterial {...glassMat} opacity={0.12} />
      </mesh>

      {/* Face gauche (ouverture haute pour le tuyau) */}
      <mesh position={[BOX_X - BOX_WIDTH / 2, BOX_Y - 0.4, 0]} renderOrder={8}>
        <boxGeometry args={[0.07, BOX_HEIGHT - 0.8, BOX_DEPTH]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Face droite */}
      <mesh position={[BOX_X + BOX_WIDTH / 2, BOX_Y, 0]} renderOrder={8}>
        <boxGeometry args={[0.3, BOX_HEIGHT, BOX_DEPTH]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Fond */}
      <mesh position={[BOX_X, BOX_Y - BOX_HEIGHT / 2, 0]} renderOrder={8}>
        <boxGeometry args={[BOX_WIDTH, 0.07, BOX_DEPTH]} />
        <meshPhysicalMaterial {...glassMat} opacity={0.35} />
      </mesh>

      {/* Colliders */}
      <RigidBody type="fixed" position={[BOX_X, BOX_Y - BOX_HEIGHT / 2, 0]}>
        <CuboidCollider
          args={[BOX_WIDTH / 2, 0.035, BOX_DEPTH / 2]}
          restitution={0.2}
          friction={0.5}
        />
      </RigidBody>
      <RigidBody type="fixed" position={[BOX_X, BOX_Y, -BOX_DEPTH / 2 - 0.035]}>
        <CuboidCollider
          args={[BOX_WIDTH / 2, BOX_HEIGHT / 2, 0.035]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>
      <RigidBody type="fixed" position={[BOX_X, BOX_Y, BOX_DEPTH / 2 + 0.035]}>
        <CuboidCollider
          args={[BOX_WIDTH / 2, BOX_HEIGHT / 2, 0.035]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[BOX_X - BOX_WIDTH / 2 - 0.035, BOX_Y - 0.4, 0]}
      >
        <CuboidCollider
          args={[0.035, (BOX_HEIGHT - 0.8) / 2, BOX_DEPTH / 2]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>
      <RigidBody
        type="fixed"
        position={[BOX_X + BOX_WIDTH / 2 + 0.035, BOX_Y, 0]}
      >
        <CuboidCollider
          args={[0.035, BOX_HEIGHT / 2, BOX_DEPTH / 2]}
          restitution={0.2}
          friction={0.3}
        />
      </RigidBody>

      {/* Supports */}
      {[BOX_X - BOX_WIDTH * 0.35, BOX_X + BOX_WIDTH * 0.35].map((x, i) => (
        <group key={`box-support-${i}`}>
          <mesh
            position={[x, BOX_Y - BOX_HEIGHT / 2 - 0.6, -BOX_DEPTH * 0.35]}
            renderOrder={3}
          >
            <boxGeometry args={[0.08, 1.2, 0.08]} />
            <meshStandardMaterial
              color="#777"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          <mesh
            position={[x, BOX_Y - BOX_HEIGHT / 2 - 0.6, BOX_DEPTH * 0.35]}
            renderOrder={3}
          >
            <boxGeometry args={[0.08, 1.2, 0.08]} />
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
