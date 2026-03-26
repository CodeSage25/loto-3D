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

  // Fond couleur plein sur toute la texture
  ctx.fillStyle = colors.edge;
  ctx.fillRect(0, 0, size, size);

  // Dégradé centré sur chaque face visible (U=0.25 et U=0.75)
  // SphereGeometry UV : U=0.25 → équateur face +Z (caméra), U=0.75 → face -Z (dos)
  const drawFace = (cx) => {
    // Dégradé radial centré sur cette face
    const grad = ctx.createRadialGradient(
      cx - size * 0.05,
      size * 0.42,
      size * 0.01,
      cx,
      size * 0.5,
      size * 0.22,
    );
    grad.addColorStop(0, colors.center);
    grad.addColorStop(1, colors.edge);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, size / 2, size * 0.24, 0, Math.PI * 2);
    ctx.fill();

    // Cercle blanc pour le numéro
    ctx.beginPath();
    ctx.arc(cx, size / 2, size * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fill();

    // Numéro
    ctx.font = `bold ${size * 0.18}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = "#111111";
    ctx.fillText(String(number), cx, size / 2);
    ctx.shadowColor = "transparent";
    ctx.fillText(String(number), cx, size / 2);
  };

  // Face +Z (caméra) : U=0.25 → x=size*0.25
  drawFace(size * 0.55);
  // Face -Z (dos, côté opposé) : U=0.75 → x=size*0.75
  drawFace(size * 0.9);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
