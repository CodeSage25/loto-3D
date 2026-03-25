// Le problème : le confinement repousse les boules même quand elles
// sont en train d'être aspirées. Il faut vérifier `drawn` correctement.

import { useFrame } from "@react-three/fiber";
import { BOULIER_RADIUS, BALL_RADIUS } from "../../constants";

export function BoulierConfinement({ ballRefs, phase, gateOpen }) {
  useFrame(() => {
    if (!ballRefs.current) return;

    const entries = Object.entries(ballRefs.current);
    for (let i = 0; i < entries.length; i++) {
      const [, data] = entries[i];
      const { rb, drawn } = data;
      if (!rb) continue;

      // ✅ FIX PRINCIPAL : si la boule est marquée drawn, on la laisse partir
      if (drawn) continue;

      try {
        const pos = rb.translation();
        const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
        const innerRadius = BOULIER_RADIUS - BALL_RADIUS - 0.25;

        if (dist > innerRadius) {
          const overshoot = dist - innerRadius;
          const strength = overshoot * 20;
          const nx = pos.x / dist;
          const ny = pos.y / dist;
          const nz = pos.z / dist;

          rb.applyImpulse(
            {
              x: -nx * strength * 0.016,
              y: -ny * strength * 0.016,
              z: -nz * strength * 0.016,
            },
            true,
          );

          if (dist > BOULIER_RADIUS + 1.0) {
            const safeR = innerRadius * 0.5;
            rb.setTranslation(
              { x: nx * safeR || 0, y: ny * safeR || 0, z: nz * safeR || 0 },
              true,
            );
            rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
          }
        }

        if (!gateOpen) {
          if (pos.y < -(BOULIER_RADIUS - BALL_RADIUS - 0.5)) {
            rb.applyImpulse({ x: 0, y: 0.15, z: 0 }, true);
          }
        } else {
          if (phase === "DRAWING_PHASE1" || phase === "DRAWING_PHASE3") {
            if (pos.y < -(BOULIER_RADIUS - BALL_RADIUS - 0.5)) {
              const distXZ = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
              if (distXZ > 1.0) {
                rb.applyImpulse({ x: 0, y: 0.15, z: 0 }, true);
              }
            }
          } else if (phase === "CLEARING") {
            rb.applyImpulse({ x: 0.04, y: -0.02, z: 0 }, true);
          }
        }
      } catch (e) {}
    }
  });

  return null;
}
