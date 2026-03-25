import { useRef, useMemo, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, BallCollider } from "@react-three/rapier";
import { BALL_RADIUS, BOULIER_RADIUS, TOTAL_BALLS } from "../../constants";
import { createBallTexture } from "../../utils/createBallTexture";

export function Ball({ number, index, phase, onBallReady }) {
  const rigidBodyRef = useRef();
  const meshRef = useRef();
  const frameCount = useRef(0);
  const drawnRef = useRef(false);

  const texture = useMemo(() => createBallTexture(number), [number]);

  const initialPosition = useMemo(() => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.0 + Math.random() * (BOULIER_RADIUS * 0.3);
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.5,
      r * Math.cos(phi) * 0.3,
    ];
  }, []);

  const handleRef = useCallback(
    (api) => {
      rigidBodyRef.current = api;
      if (api) {
        const angle = Math.random() * Math.PI * 2;
        const upForce = 0.5 + Math.random() * 0.8;
        api.applyImpulse(
          {
            x: Math.cos(angle) * 0.6,
            y: upForce,
            z: Math.sin(angle) * 0.4,
          },
          true,
        );

        api.applyTorqueImpulse(
          {
            x: (Math.random() - 0.5) * 1.0,
            y: (Math.random() - 0.5) * 1.0,
            z: (Math.random() - 0.5) * 1.0,
          },
          true,
        );

        if (onBallReady) onBallReady(number, api, meshRef, drawnRef);
      }
    },
    [index, number, onBallReady],
  );

  useFrame(() => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    // ═══ Si la boule est tirée : stopper toute rotation et mouvement ═══
    if (drawnRef.current) {
      try {
        // Arrêter la rotation angulaire
        const angvel = rb.angvel();
        const angSpeed = Math.sqrt(
          angvel.x * angvel.x + angvel.y * angvel.y + angvel.z * angvel.z,
        );
        if (angSpeed > 0.1) {
          rb.setAngvel(
            {
              x: angvel.x * 0.85,
              y: angvel.y * 0.85,
              z: angvel.z * 0.85,
            },
            true,
          );
        } else if (angSpeed > 0.01) {
          rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      } catch (e) {}
      return; // Ne pas appliquer de brassage
    }

    try {
      const pos = rb.translation();
      if (pos.y < -40) {
        if (meshRef.current) meshRef.current.visible = false;
        return;
      }
    } catch (e) {
      return;
    }

    frameCount.current++;
    if (frameCount.current % 4 !== 0) return;

    if (
      phase === "IDLE" ||
      phase === "DRAWING_PHASE1" ||
      phase === "DRAWING_PHASE3"
    ) {
      try {
        const t = Date.now() * 0.001;
        const freq1 = 0.8 + (index % 7) * 0.15;
        const freq2 = 1.2 + (index % 5) * 0.2;
        const freq3 = 0.6 + (index % 9) * 0.1;
        const uniqueAngle = t * freq1 + index * ((Math.PI * 2) / TOTAL_BALLS);
        const impulseStrength = 0.06;

        rb.applyImpulse(
          {
            x:
              Math.cos(uniqueAngle) * impulseStrength +
              Math.sin(t * freq2 + index) * impulseStrength * 0.5 +
              (Math.random() - 0.5) * 0.02,
            y:
              Math.sin(uniqueAngle * 0.7) * impulseStrength * 1.2 +
              Math.cos(t * freq3) * impulseStrength * 0.8 +
              (Math.random() - 0.5) * 0.02,
            z:
              Math.sin(uniqueAngle * 1.3 + t * 0.5) * impulseStrength * 0.6 +
              (Math.random() - 0.5) * 0.015,
          },
          true,
        );

        if (frameCount.current % 8 === 0) {
          rb.applyTorqueImpulse(
            {
              x: (Math.random() - 0.5) * 0.15,
              y: (Math.random() - 0.5) * 0.15,
              z: (Math.random() - 0.5) * 0.15,
            },
            true,
          );
        }

        if (frameCount.current % 60 === 0 && Math.random() > 0.6) {
          rb.applyImpulse(
            {
              x: (Math.random() - 0.5) * 0.3,
              y: Math.random() * 0.4,
              z: (Math.random() - 0.5) * 0.2,
            },
            true,
          );
        }

        const vel = rb.linvel();
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        if (speed > 10) {
          const scale = 10 / speed;
          rb.setLinvel(
            { x: vel.x * scale, y: vel.y * scale, z: vel.z * scale },
            true,
          );
        }
      } catch (e) {}
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
      restitution={0.6}
      friction={0.15}
      linearDamping={0.2}
      angularDamping={0.08}
      type="dynamic"
    >
      <BallCollider args={[BALL_RADIUS]} />
      <mesh ref={meshRef} renderOrder={0}>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.3}
          metalness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>
    </RigidBody>
  );
}
