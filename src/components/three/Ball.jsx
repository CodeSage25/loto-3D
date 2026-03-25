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
    const r = 0.5 + Math.random() * (BOULIER_RADIUS * 0.55);
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
        if (onBallReady) onBallReady(number, api, meshRef);
      }
    },
    [index, number, onBallReady],
  );

  useFrame(() => {
    const rb = rigidBodyRef.current;
    if (!rb || isDrawn.current) return;

    const pos = rb.translation();

    if (pos.y < -12) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    frameCount.current++;
    if (frameCount.current % 6 !== 0) return;

    if (
      phase === "IDLE" ||
      phase === "DRAWING_PHASE1" ||
      phase === "DRAWING_PHASE3" // ✅ CORRIGÉ
    ) {
      const t = Date.now() * 0.001;
      const uniqueAngle = t * 1.5 + index * ((Math.PI * 2) / TOTAL_BALLS);

      const impulseStrength = 0.012;
      rb.applyImpulse(
        {
          x:
            Math.cos(uniqueAngle) * impulseStrength +
            (Math.random() - 0.5) * 0.004,
          y:
            Math.sin(uniqueAngle * 0.6) * impulseStrength * 0.8 +
            (Math.random() - 0.5) * 0.004,
          z:
            Math.sin(uniqueAngle * 1.3) * impulseStrength * 0.6 +
            (Math.random() - 0.5) * 0.003,
        },
        true,
      );

      const vel = rb.linvel();
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
      if (speed > 3) {
        const scale = 3 / speed;
        rb.setLinvel(
          { x: vel.x * scale, y: vel.y * scale, z: vel.z * scale },
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
