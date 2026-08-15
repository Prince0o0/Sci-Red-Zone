"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

const COLLISION_PATH = "/maps/laboratory/Labatory Edit maybe comp.glb";
const FLOOR_TEXTURE_PATH = "/maps/laboratory/floor-diffuse.jpg";
const FLOOR_MATERIAL_NAME = "Material.010";

export default function LaboratoryCollision() {
  const collision = useGLTF(COLLISION_PATH);

  useEffect(() => {
    // Loaded outside Suspense: useTexture would suspend the whole Canvas
    // tree (Physics + RigidBody included), remounting the floor collider
    // and letting the player fall through before it re-registers.
    new THREE.TextureLoader().load(FLOOR_TEXTURE_PATH, (map) => {
      map.colorSpace = THREE.SRGBColorSpace;
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;

      collision.scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const material = child.material as THREE.MeshStandardMaterial;
        if (material?.name === FLOOR_MATERIAL_NAME) {
          material.map = map;
          material.needsUpdate = true;
        }
      });
    });
  }, [collision.scene]);

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

useGLTF.preload(COLLISION_PATH);