import { useRef } from "react";
import { BOULIER_RADIUS, FUNNEL_HEIGHT } from "../../constants";

const SUCTION_LEFT = {
  x: -0.7,
  y: -BOULIER_RADIUS - FUNNEL_HEIGHT * 0.3,
  z: 0,
};
const SUCTION_RIGHT = {
  x: 0.7,
  y: -BOULIER_RADIUS - FUNNEL_HEIGHT * 0.3,
  z: 0,
};
const ARRIVAL_THRESHOLD = 1.2;

function animateSuction(rb, target) {
  try {
    const pos = rb.translation();
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const dz = target.z - pos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < ARRIVAL_THRESHOLD) {
      return false;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const nz = dz / dist;

    // ✅ Force beaucoup plus forte
    const suctionForce = 0.25 * (1 + 5 / (dist + 0.3));

    rb.applyImpulse(
      {
        x: nx * suctionForce,
        y: ny * suctionForce,
        z: nz * suctionForce,
      },
      true,
    );

    const vel = rb.linvel();
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
    if (speed > 8) {
      const scale = 8 / speed;
      rb.setLinvel(
        { x: vel.x * scale, y: vel.y * scale, z: vel.z * scale },
        true,
      );
    }

    return true;
  } catch (e) {
    return false;
  }
}

export function useSuctionAnimation() {
  const animatingBalls = useRef(new Map());

  const startSuction = (ballNumber, rb, direction, onComplete) => {
    const target = direction === "left" ? SUCTION_LEFT : SUCTION_RIGHT;
    animatingBalls.current.set(ballNumber, {
      rb,
      target,
      onComplete,
      active: true,
      startTime: Date.now(),
    });
  };

  const updateAnimations = () => {
    animatingBalls.current.forEach((data, key) => {
      if (!data.active) return;

      const elapsed = Date.now() - data.startTime;

      // ✅ Timeout réduit à 2s : si l'aspiration échoue, forcer la téléportation
      if (elapsed > 2000) {
        try {
          data.rb.setTranslation(
            { x: data.target.x, y: data.target.y, z: data.target.z },
            true,
          );
          data.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        } catch (e) {}
        data.active = false;
        if (data.onComplete) data.onComplete();
        return;
      }

      const stillAnimating = animateSuction(data.rb, data.target);
      if (!stillAnimating) {
        data.active = false;
        if (data.onComplete) data.onComplete();
      }
    });
  };

  const clearAll = () => {
    animatingBalls.current.clear();
  };

  return { startSuction, updateAnimations, clearAll };
}
