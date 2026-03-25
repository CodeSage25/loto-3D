import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  BOULIER_RADIUS,
  FUNNEL_TOP_RADIUS,
  FUNNEL_BOTTOM_RADIUS,
  FUNNEL_HEIGHT,
} from "../../constants";

export function Boulier({ phase }) {
  const agitatorRef = useRef();

  useFrame((_, delta) => {
    if (!agitatorRef.current) return;

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
      agitatorRef.current.rotation.y += 0.015;
      agitatorRef.current.rotation.x += 0.004;
    }
  });

  const armAngles = [0, 60, 120, 180, 240, 300];
  const funnelY = -BOULIER_RADIUS - FUNNEL_HEIGHT / 2 + 0.1;

  return (
    <group position={[0, 0, 0]}>
      {/* Sphère de verre principale */}
      <mesh renderOrder={10}>
        <sphereGeometry args={[BOULIER_RADIUS, 64, 64]} />
        <meshPhysicalMaterial
          transmission={0.9}
          roughness={0.05}
          metalness={0}
          thickness={0.3}
          ior={1.45}
          transparent
          opacity={0.15}
          depthWrite={false}
          side={THREE.DoubleSide}
          color="#a0c4e8"
          envMapIntensity={0.3}
        />
      </mesh>

      {/* Double paroi intérieure */}
      <mesh renderOrder={10}>
        <sphereGeometry args={[BOULIER_RADIUS - 0.08, 64, 64]} />
        <meshPhysicalMaterial
          transmission={0.98}
          roughness={0.02}
          metalness={0}
          thickness={0.1}
          ior={1.5}
          transparent
          opacity={0.06}
          depthWrite={false}
          side={THREE.FrontSide}
          color="#ffffff"
          envMapIntensity={0.4}
        />
      </mesh>

      {/* Agitateur central */}
      <group ref={agitatorRef}>
        <mesh renderOrder={5}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color="#dddddd"
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
        <mesh renderOrder={5}>
          <cylinderGeometry args={[0.05, 0.05, BOULIER_RADIUS * 1.4, 8]} />
          <meshStandardMaterial
            color="#bbbbbb"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {armAngles.map((deg, i) => {
          const radY = (deg * Math.PI) / 180;
          const tiltX = ((i % 2 === 0 ? 1 : -1) * Math.PI) / 10;
          const armLength = BOULIER_RADIUS * 0.65;
          return (
            <group key={`arm-${i}`} rotation={[tiltX, radY, 0]}>
              <mesh renderOrder={5}>
                <boxGeometry args={[0.06, armLength, 0.06]} />
                <meshStandardMaterial
                  color="#aaaaaa"
                  metalness={0.85}
                  roughness={0.15}
                />
              </mesh>
              <mesh position={[0, armLength / 2, 0]} renderOrder={5}>
                <boxGeometry args={[0.35, 0.1, 0.18]} />
                <meshStandardMaterial
                  color="#ff6600"
                  metalness={0.5}
                  roughness={0.3}
                  emissive="#ff4400"
                  emissiveIntensity={0.2}
                />
              </mesh>
              <mesh position={[0, -armLength / 2, 0]} renderOrder={5}>
                <sphereGeometry args={[0.08, 10, 10]} />
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

      {/* Anneau de base — petit */}
      <mesh position={[0, -BOULIER_RADIUS + 0.15, 0]} renderOrder={3}>
        <torusGeometry args={[0.7, 0.04, 12, 32]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Entonnoir GAUCHE — assez large pour les boules */}
      <mesh
        position={[-0.7, funnelY, 0]}
        rotation={[0, 0, 0.1]}
        renderOrder={3}
      >
        <cylinderGeometry
          args={[
            FUNNEL_TOP_RADIUS,
            FUNNEL_BOTTOM_RADIUS,
            FUNNEL_HEIGHT,
            20,
            1,
            true,
          ]}
        />
        <meshPhysicalMaterial
          transmission={0.85}
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.3}
          depthWrite={false}
          side={THREE.DoubleSide}
          color="#88aad0"
        />
      </mesh>

      {/* Entonnoir DROIT — assez large pour les boules */}
      <mesh
        position={[0.7, funnelY, 0]}
        rotation={[0, 0, -0.1]}
        renderOrder={3}
      >
        <cylinderGeometry
          args={[
            FUNNEL_TOP_RADIUS,
            FUNNEL_BOTTOM_RADIUS,
            FUNNEL_HEIGHT,
            20,
            1,
            true,
          ]}
        />
        <meshPhysicalMaterial
          transmission={0.85}
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.3}
          depthWrite={false}
          side={THREE.DoubleSide}
          color="#88aad0"
        />
      </mesh>

      {/* Séparateur central entre les deux entonnoirs */}
      <mesh position={[0, funnelY, 0]} renderOrder={3}>
        <boxGeometry args={[0.1, FUNNEL_HEIGHT + 0.2, FUNNEL_TOP_RADIUS * 2]} />
        <meshStandardMaterial
          color="#778899"
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}
