"use client";

import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

export default function StairwayCollision() {
    const collision = useGLTF(
        "/maps/stairway/collision.glb",
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
    "/maps/stairway/collision.glb",
);