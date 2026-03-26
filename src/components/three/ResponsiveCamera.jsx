import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;

    if (aspect < 0.6) {
      // Très petit mobile (portrait étroit)
      camera.fov = 90;
      camera.position.set(2, -1.5, 15);
    } else if (aspect < 0.8) {
      // Mobile portrait standard
      camera.fov = 85;
      camera.position.set(2, -1.5, 14);
    } else if (aspect < 1) {
      // Tablette portrait / grand mobile
      camera.fov = 78;
      camera.position.set(2, -1.5, 13);
    } else if (aspect < 1.5) {
      // Tablette paysage / petit desktop
      camera.fov = 70;
      camera.position.set(2, -1.5, 13);
    } else {
      // Desktop large
      camera.fov = 70;
      camera.position.set(2, -1.5, 12);
    }

    camera.lookAt(1.5, -3, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}