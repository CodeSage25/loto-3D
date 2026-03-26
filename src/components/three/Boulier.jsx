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
        {/* --- 1. MOYEU CENTRAL (CÔNE DE DÉFLEXION) --- */}
        {/* Ce cône sert à pousser les boules vers l'extérieur, vers les pales */}
        <mesh position={[0, -BOULIER_RADIUS * 0.1, 0]} renderOrder={5}>
          <cylinderGeometry
            args={[
              BOULIER_RADIUS * 0.08, // Rayon haut (plus fin)
              BOULIER_RADIUS * 0.25, // Rayon bas (large base)
              BOULIER_RADIUS * 0.3, // Hauteur
              32, // Résolution lisse
            ]}
          />
          <meshStandardMaterial
            color="#202020" // Plastique dur noir ou métal peint
            metalness={0.6}
            roughness={0.4}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Capuchon chromé du moyeu (le boulon central) */}
        <mesh position={[0, BOULIER_RADIUS * 0.06, 0]} renderOrder={5}>
          <cylinderGeometry
            args={[
              BOULIER_RADIUS * 0.04,
              BOULIER_RADIUS * 0.04,
              BOULIER_RADIUS * 0.05,
              16,
            ]}
          />
          <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.1} />
        </mesh>

        {/* --- 2. LES PALES (PROPELLER) --- */}
        {/* On utilise 3 pales à 120°, c'est plus efficace pour le chaos que 4 ou 6 */}
        {[0, 120, 240].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const armLen = BOULIER_RADIUS * 0.65; // Longueur de la pale

          return (
            <group key={`blade-${i}`} rotation={[0, rad, 0]}>
              {/* A. La tige de support (Métal solide) */}
              <mesh
                position={[0, 0, armLen / 2]}
                rotation={[Math.PI / 2, 0, 0]} // Couché horizontalement
                renderOrder={5}
              >
                {/* Forme rectangulaire arrondie, pas un cylindre fin */}
                <boxGeometry
                  args={[BOULIER_RADIUS * 0.04, armLen, BOULIER_RADIUS * 0.02]}
                />
                <meshStandardMaterial
                  color="#a0a0a0"
                  metalness={0.9}
                  roughness={0.2}
                />
              </mesh>

              {/* B. La Pale / La Cuillère (Partie active en bout) */}
              {/* On crée un angle pour soulever les boules (effet "scoop") */}
              <group
                position={[0, 0, armLen]}
                rotation={[Math.PI / 6, 0, -Math.PI / 12]}
              >
                {/* Le "Pad" en caoutchouc qui touche les boules */}
                <mesh renderOrder={5}>
                  <boxGeometry
                    args={[
                      BOULIER_RADIUS * 0.18, // Largeur de la pale
                      BOULIER_RADIUS * 0.08, // Hauteur
                      BOULIER_RADIUS * 0.02, // Épaisseur fine
                    ]}
                  />
                  {/* Matériau type silicone/caoutchouc rouge ou bleu (très "Loto") */}
                  <meshStandardMaterial
                    color="#bf1a1a" // Rouge industriel (ou changez pour bleu/noir)
                    metalness={0.1}
                    roughness={0.8} // Aspect mat caoutchouc
                  />
                </mesh>

                {/* Renfort arrière de la pale (détail mécanique) */}
                <mesh
                  position={[0, 0, -BOULIER_RADIUS * 0.015]}
                  renderOrder={5}
                >
                  <boxGeometry
                    args={[
                      BOULIER_RADIUS * 0.1,
                      BOULIER_RADIUS * 0.04,
                      BOULIER_RADIUS * 0.02,
                    ]}
                  />
                  <meshStandardMaterial
                    color="#505050"
                    metalness={0.8}
                    roughness={0.3}
                  />
                </mesh>
              </group>
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
