import { useFrame } from "@react-three/fiber";
import { BOULIER_RADIUS, BALL_RADIUS } from "../../constants";

export function BoulierConfinement({ ballRefs, phase, gateOpen }) {
  useFrame(() => {
    if (!ballRefs.current) return;

    const entries = Object.entries(ballRefs.current);
    for (let i = 0; i < entries.length; i++) {
      const [, data] = entries[i];
      const { rb, drawn } = data;
      if (!rb || drawn) continue;

      try {
        const pos = rb.translation();
        const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);

        // Mur intérieur — la boule ne doit JAMAIS dépasser ce rayon
        const wallRadius = BOULIER_RADIUS - BALL_RADIUS - 0.5;

        // ═══ CONFINEMENT PROGRESSIF ═══
        // Zone 1 : 70-85% → force douce de rappel
        if (dist > wallRadius * 0.7 && dist <= wallRadius * 0.85) {
          const overshoot = dist - wallRadius * 0.7;
          const strength = overshoot * 8;
          const nx = pos.x / (dist || 1);
          const ny = pos.y / (dist || 1);
          const nz = pos.z / (dist || 1);

          rb.applyImpulse(
            {
              x: -nx * strength * 0.01,
              y: -ny * strength * 0.01,
              z: -nz * strength * 0.01,
            },
            true,
          );
        }

        // Zone 2 : 85-95% → force forte
        if (dist > wallRadius * 0.85 && dist <= wallRadius) {
          const overshoot = dist - wallRadius * 0.85;
          const strength = overshoot * 30;
          const nx = pos.x / (dist || 1);
          const ny = pos.y / (dist || 1);
          const nz = pos.z / (dist || 1);

          rb.applyImpulse(
            {
              x: -nx * strength * 0.03,
              y: -ny * strength * 0.03,
              z: -nz * strength * 0.03,
            },
            true,
          );

          // Rebondir : inverser la composante radiale de la vitesse
          const vel = rb.linvel();
          const dotProduct = vel.x * nx + vel.y * ny + vel.z * nz;
          if (dotProduct > 0) {
            rb.setLinvel(
              {
                x: vel.x - nx * dotProduct * 1.5,
                y: vel.y - ny * dotProduct * 1.5,
                z: vel.z - nz * dotProduct * 1.5,
              },
              true,
            );
          }
        }

        // Zone 3 : > 95% → TÉLÉPORTATION
        if (dist > wallRadius) {
          const safeR = wallRadius * 0.6;
          const nx = pos.x / (dist || 1);
          const ny = pos.y / (dist || 1);
          const nz = pos.z / (dist || 1);

          rb.setTranslation(
            { x: nx * safeR, y: ny * safeR, z: nz * safeR },
            true,
          );

          // Inverser la vitesse pour rebondir vers l'intérieur
          const vel = rb.linvel();
          rb.setLinvel(
            { x: -vel.x * 0.3, y: -vel.y * 0.3, z: -vel.z * 0.3 },
            true,
          );
        }

        // ═══ PLANCHER ═══
        if (!gateOpen) {
          if (pos.y < -(BOULIER_RADIUS - BALL_RADIUS - 1.5)) {
            rb.applyImpulse({ x: 0, y: 0.8, z: 0 }, true);
          }
        } else {
          if (phase === "DRAWING_PHASE1" || phase === "DRAWING_PHASE3") {
            if (pos.y < -(BOULIER_RADIUS - BALL_RADIUS - 1.5)) {
              const distXZ = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
              if (distXZ > 3.0) {
                rb.applyImpulse({ x: 0, y: 0.8, z: 0 }, true);
              }
            }
          } else if (phase === "CLEARING") {
            rb.applyImpulse({ x: 0.12, y: -0.06, z: 0 }, true);
          }
        }

        // ═══ LIMITER VITESSE ═══
        const vel = rb.linvel();
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        if (speed > 12) {
          const scale = 12 / speed;
          rb.setLinvel(
            { x: vel.x * scale, y: vel.y * scale, z: vel.z * scale },
            true,
          );
        }
      } catch (e) {}
    }
  });

  return null;
}
