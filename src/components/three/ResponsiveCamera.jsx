import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    camera.fov = aspect < 1 ? 90 : 65;
    camera.position.set(2, -1.5, 18);
    camera.lookAt(1.5, -3, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}
