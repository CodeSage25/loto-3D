import * as THREE from "three";
import { getBallColorGroup } from "../constants";

export function createBallTexture(number) {
  const size = 512;
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(size, size)
      : (() => {
          const c = document.createElement("canvas");
          c.width = size;
          c.height = size;
          return c;
        })();

  const ctx = canvas.getContext("2d");
  const colors = getBallColorGroup(number);

  const gradient = ctx.createRadialGradient(
    size * 0.35,
    size * 0.3,
    size * 0.02,
    size * 0.5,
    size * 0.5,
    size * 0.55,
  );
  gradient.addColorStop(0, colors.center);
  gradient.addColorStop(0.7, colors.edge);
  gradient.addColorStop(1, colors.edge);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Cercle blanc pour le numéro
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fill();

  ctx.font = `bold ${size * 0.28}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = "#111111";
  ctx.fillText(String(number), size / 2, size / 2);

  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#111111";
  ctx.fillText(String(number), size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
