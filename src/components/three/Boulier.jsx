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

  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!agitatorRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    if (phase === "CLEARING" || phase === "DONE") {
      // Ralentir progressivement
      agitatorRef.current.rotation.y += 0.015 * Math.max(0, 1 - t * 0.1);
      if (phase === "DONE") {
        agitatorRef.current.children.forEach((child) => {
          if (child.material) {
            child.material.opacity = Math.max(
              0,
              (child.material.opacity || 1) - delta * 0.5,
            );
            child.material.transparent = true;
          }
        });
      }
    } else {
      agitatorRef.current.visible = true;
      // Rotation principale horizontale
      agitatorRef.current.rotation.y += 0.03;
      // Oscillation douce sur les autres axes
      agitatorRef.current.rotation.x = Math.sin(t * 1.2) * 0.4;
      agitatorRef.current.rotation.z = Math.cos(t * 0.8) * 0.25;
    }
  });

  const armAngles = [0, 60, 120, 180, 240, 300];
  const funnelY = -BOULIER_RADIUS - FUNNEL_HEIGHT / 2 + 0.1;

  return (
    <group position={[0, 0, 0]}>
      {/* Sphère de verre principale — plus épaisse et réaliste */}
      <mesh renderOrder={10}>
        <sphereGeometry args={[BOULIER_RADIUS, 128, 128]} />
        <meshPhysicalMaterial
          transmission={0.92}
          roughness={0.03}
          metalness={0}
          thickness={2.5}
          ior={1.52}
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
          color="#d4e8f5"
          envMapIntensity={0.8}
          clearcoat={1}
          clearcoatRoughness={0.02}
          specularIntensity={1.5}
          specularColor="#ffffff"
          attenuationColor="#b8d8f0"
          attenuationDistance={8}
        />
      </mesh>

      {/* Deuxième couche — reflet intérieur */}
      <mesh renderOrder={10}>
        <sphereGeometry args={[BOULIER_RADIUS - 0.15, 128, 128]} />
        <meshPhysicalMaterial
          transmission={0.98}
          roughness={0.01}
          metalness={0}
          thickness={0.5}
          ior={1.5}
          transparent
          opacity={0.04}
          depthWrite={false}
          side={THREE.FrontSide}
          color="#ffffff"
          envMapIntensity={0.6}
          clearcoat={0.5}
          clearcoatRoughness={0.01}
        />
      </mesh>

      {/* Troisième couche — highlight spéculaire */}
      <mesh renderOrder={11}>
        <sphereGeometry args={[BOULIER_RADIUS + 0.02, 64, 64]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.03}
          depthWrite={false}
          side={THREE.FrontSide}
          color="#ffffff"
          envMapIntensity={2.0}
          clearcoat={1}
          clearcoatRoughness={0.0}
          roughness={0.0}
          metalness={0.1}
        />
      </mesh>

      <group ref={agitatorRef}>
        {/* Hub central — boule chromée */}
        <mesh renderOrder={5}>
          <sphereGeometry args={[BOULIER_RADIUS * 0.035, 24, 24]} />
          <meshStandardMaterial
            color="#e8e8e8"
            metalness={1}
            roughness={0.02}
            envMapIntensity={2.0}
          />
        </mesh>

        {/* Axe vertical principal */}
        <mesh renderOrder={5}>
          <cylinderGeometry
            args={[
              BOULIER_RADIUS * 0.012,
              BOULIER_RADIUS * 0.012,
              BOULIER_RADIUS * 1.3,
              12,
            ]}
          />
          <meshStandardMaterial
            color="#d0d0d0"
            metalness={1}
            roughness={0.05}
            envMapIntensity={1.8}
          />
        </mesh>

        {/* Renforts annulaires sur l'axe */}
        {[-0.3, 0, 0.3].map((yFrac, i) => (
          <mesh
            key={`ring-${i}`}
            position={[0, BOULIER_RADIUS * yFrac, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            renderOrder={5}
          >
            <torusGeometry
              args={[BOULIER_RADIUS * 0.025, BOULIER_RADIUS * 0.006, 8, 16]}
            />
            <meshStandardMaterial
              color="#c0c0c0"
              metalness={1}
              roughness={0.05}
            />
          </mesh>
        ))}

        {/* 6 bras avec palettes */}
        {armAngles.map((deg, i) => {
          const radY = (deg * Math.PI) / 180;
          const tiltX = ((i % 2 === 0 ? 1 : -1) * Math.PI) / 8;
          const armLength = BOULIER_RADIUS * 0.58;
          const armThick = BOULIER_RADIUS * 0.01;
          const paddleW = BOULIER_RADIUS * 0.07;
          const paddleH = BOULIER_RADIUS * 0.02;
          const paddleD = BOULIER_RADIUS * 0.035;

          return (
            <group key={`arm-${i}`} rotation={[tiltX, radY, 0]}>
              {/* Tige du bras — cylindre fin chromé */}
              <mesh renderOrder={5}>
                <cylinderGeometry args={[armThick, armThick, armLength, 8]} />
                <meshStandardMaterial
                  color="#c8c8c8"
                  metalness={1}
                  roughness={0.08}
                  envMapIntensity={1.5}
                />
              </mesh>

              {/* Palette supérieure — rectangle arrondi */}
              <group position={[0, armLength / 2, 0]}>
                <mesh renderOrder={5}>
                  <boxGeometry args={[paddleW, paddleH, paddleD]} />
                  <meshStandardMaterial
                    color="#d8d8d8"
                    metalness={0.95}
                    roughness={0.1}
                    envMapIntensity={1.2}
                  />
                </mesh>
                {/* Arrondi aux extrémités */}
                <mesh position={[paddleW / 2, 0, 0]} renderOrder={5}>
                  <sphereGeometry args={[paddleH / 2, 8, 8]} />
                  <meshStandardMaterial
                    color="#d8d8d8"
                    metalness={0.95}
                    roughness={0.1}
                  />
                </mesh>
                <mesh position={[-paddleW / 2, 0, 0]} renderOrder={5}>
                  <sphereGeometry args={[paddleH / 2, 8, 8]} />
                  <meshStandardMaterial
                    color="#d8d8d8"
                    metalness={0.95}
                    roughness={0.1}
                  />
                </mesh>
              </group>

              {/* Palette inférieure */}
              <group position={[0, -armLength / 2, 0]}>
                <mesh renderOrder={5}>
                  <boxGeometry args={[paddleW, paddleH, paddleD]} />
                  <meshStandardMaterial
                    color="#d8d8d8"
                    metalness={0.95}
                    roughness={0.1}
                    envMapIntensity={1.2}
                  />
                </mesh>
                <mesh position={[paddleW / 2, 0, 0]} renderOrder={5}>
                  <sphereGeometry args={[paddleH / 2, 8, 8]} />
                  <meshStandardMaterial
                    color="#d8d8d8"
                    metalness={0.95}
                    roughness={0.1}
                  />
                </mesh>
                <mesh position={[-paddleW / 2, 0, 0]} renderOrder={5}>
                  <sphereGeometry args={[paddleH / 2, 8, 8]} />
                  <meshStandardMaterial
                    color="#d8d8d8"
                    metalness={0.95}
                    roughness={0.1}
                  />
                </mesh>
              </group>

              {/* Jonction bras-hub */}
              <mesh position={[0, 0, 0]} renderOrder={5}>
                <sphereGeometry args={[armThick * 1.5, 8, 8]} />
                <meshStandardMaterial
                  color="#d0d0d0"
                  metalness={1}
                  roughness={0.05}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Anneau de maintien — cerclage chromé */}
      <mesh
        position={[0, -BOULIER_RADIUS + 0.1, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={3}
      >
        <torusGeometry
          args={[BOULIER_RADIUS * 0.22, BOULIER_RADIUS * 0.015, 16, 48]}
        />
        <meshStandardMaterial
          color="#999"
          metalness={1}
          roughness={0.05}
          envMapIntensity={2}
        />
      </mesh>

      {/* Deuxième cerclage plus haut */}
      <mesh
        position={[0, -BOULIER_RADIUS * 0.85, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={3}
      >
        <torusGeometry
          args={[BOULIER_RADIUS * 0.45, BOULIER_RADIUS * 0.008, 12, 48]}
        />
        <meshStandardMaterial
          color="#aaa"
          metalness={1}
          roughness={0.08}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Pieds de support — 4 pattes */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => {
        const footX = Math.cos(angle) * BOULIER_RADIUS * 0.2;
        const footZ = Math.sin(angle) * BOULIER_RADIUS * 0.2;
        const footY = -BOULIER_RADIUS - FUNNEL_HEIGHT - 0.5;
        return (
          <group key={`foot-${i}`}>
            {/* Patte verticale */}
            <mesh position={[footX, footY + 0.8, footZ]} renderOrder={3}>
              <cylinderGeometry
                args={[BOULIER_RADIUS * 0.012, BOULIER_RADIUS * 0.015, 1.6, 8]}
              />
              <meshStandardMaterial
                color="#777"
                metalness={0.95}
                roughness={0.1}
              />
            </mesh>
            {/* Pied plat */}
            <mesh position={[footX, footY, footZ]} renderOrder={3}>
              <cylinderGeometry
                args={[BOULIER_RADIUS * 0.025, BOULIER_RADIUS * 0.03, 0.1, 12]}
              />
              <meshStandardMaterial
                color="#555"
                metalness={0.9}
                roughness={0.15}
              />
            </mesh>
          </group>
        );
      })}

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
    </group>
  );
}
