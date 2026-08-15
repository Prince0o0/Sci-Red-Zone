"use client";

import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

export default function LaboratoryCollision() {
  const collision = useGLTF(
    "/maps/laboratory/Labatory Edit maybe comp.glb",
  );

  return (
    <RigidBody
      type="fixed"
      colliders="trimesh"
      includeInvisible
    >
      <primitive
        object={collision.scene}
        visible={true}
      />
    </RigidBody>
  );
}

useGLTF.preload(
  "/maps/laboratory/Labatory Edit maybe comp.glb",
);