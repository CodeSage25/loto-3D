import { useRef, useMemo, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, BallCollider } from "@react-three/rapier";
import { BALL_RADIUS, BOULIER_RADIUS, TOTAL_BALLS } from "../../constants";
import { createBallTexture } from "../../utils/createBallTexture";

export function Ball({ number, index, phase, onBallReady }) {
  const rigidBodyRef = useRef();
  const meshRef = useRef();
  const frameCount = useRef(0);
  const isDrawn = useRef(false);

  const texture = useMemo(() => createBallTexture(number), [number]);

  const initialPosition = useMemo(() => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.5 + Math.random() * (BOULIER_RADIUS * 1);
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.6,
      r * Math.cos(phi) * 0.5,
    ];
  }, []);

  const handleRef = useCallback(
    (api) => {
      rigidBodyRef.current = api;
      if (api) {
        const angle = index * ((Math.PI * 2) / TOTAL_BALLS);
        api.applyImpulse(
          {
            x: Math.cos(angle) * 0.4,
            y: Math.sin(angle * 0.7) * 0.3 + 0.2,
            z: Math.sin(angle) * 0.2,
          },
          true,
        );
        if (onBallReady) onBallReady(number, api, meshRef, isDrawn);
      }
    },
    [index, number, onBallReady],
  );

useFrame(() => {
  const rb = rigidBodyRef.current;
  if (!rb) return;

  if (isDrawn.current) return;

  const pos = rb.translation();
  if (pos.y < -12) {
    if (meshRef.current) meshRef.current.visible = false;
    return;
  }

  frameCount.current++;

  if (
    phase === "IDLE" ||
    phase === "DRAWING_PHASE1" ||
    phase === "DRAWING_PHASE3"
  ) {
    const t = Date.now() * 0.001;
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    const tooFar = dist > BOULIER_RADIUS * 1;

    // ═══ RAPPEL VERS LE CENTRE si trop près des parois ═══
    if (tooFar) {
      const nx = pos.x / (dist || 1);
      const ny = pos.y / (dist || 1);
      const nz = pos.z / (dist || 1);
      rb.applyImpulse(
        {
          x: -nx * 0.4,
          y: -ny * 0.4,
          z: -nz * 0.4,
        },
        true,
      );
      return; // pas d'autre impulsion ce frame
    }

    // ═══ IMPULSION DISCONTINUE ═══
    // Chaque boule a son propre timer aléatoire
    // On n'applique une impulsion que tous les N frames (variable)
    const interval = 3 + Math.floor((index % 7)); // entre 3 et 9 frames
    if (frameCount.current % interval !== 0) return;

    // Direction totalement aléatoire à chaque déclenchement
    const randX = (Math.random() - 0.5) * 2;
    const randY = (Math.random() - 0.5) * 2;
    const randZ = (Math.random() - 0.5) * 2;

    // Normaliser la direction
    const len = Math.sqrt(randX * randX + randY * randY + randZ * randZ) || 1;

    // Force de base + variation temporelle par boule
    const strength = 0.18 + Math.sin(t * 2.5 + index * 0.8) * 1;

    rb.applyImpulse(
      {
        x: (randX / len) * strength,
        y: (randY / len) * strength + 0.05, // légère poussée vers le haut
        z: (randZ / len) * strength,
      },
      true,
    );

    // ═══ ROTATION ALÉATOIRE SUR ELLE-MÊME ═══
    rb.applyTorqueImpulse(
      {
        x: (Math.random() - 0.5) * 0.06,
        y: (Math.random() - 0.5) * 0.06,
        z: (Math.random() - 0.5) * 0.05,
      },
      true,
    );

    // ═══ LIMITER VITESSE LINEAIRE ═══
    const vel = rb.linvel();
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
    if (speed > 12) {
      const scale = 12 / speed;
      rb.setLinvel(
        { x: vel.x * scale, y: vel.y * scale, z: vel.z * scale },
        true,
      );
    }

    // ═══ LIMITER VITESSE ANGULAIRE ═══
    const angvel = rb.angvel();
    const angSpeed = Math.sqrt(
      angvel.x * angvel.x + angvel.y * angvel.y + angvel.z * angvel.z
    );
    if (angSpeed > 15) {
      const scale = 15 / angSpeed;
      rb.setAngvel(
        { x: angvel.x * scale, y: angvel.y * scale, z: angvel.z * scale },
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
      <mesh ref={meshRef} renderOrder={0}>
        <sphereGeometry args={[BALL_RADIUS, 28, 28]} />
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
