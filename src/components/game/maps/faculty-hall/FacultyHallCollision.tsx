"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import {
    RigidBody,
} from "@react-three/rapier";
import * as THREE from "three";

export default function FacultyHallCollision() {
    // ============================
    // Visual Map
    // ============================

    const visual =
        useGLTF("/maps/faculty-hall/collision.glb");

    // ============================
    // Collision Map
    // ============================

    const collision =
        useGLTF(
            "/maps/faculty-hall/collision.glb",
        );

    // ============================
    // Shadow
    // ============================

    useEffect(() => {
        visual.scene.traverse(
            (object) => {
                if (
                    object instanceof
                    THREE.Mesh
                ) {
                    object.castShadow =
                        true;

                    object.receiveShadow =
                        true;
                }
            },
        );
    }, [visual.scene]);

    return (
        <>
            {/* =====================
                Visual อย่างเดียว
            ===================== */}

            <primitive
                object={visual.scene}
                visible={false}
            />

            {/* =====================
                Physics อย่างเดียว
            ===================== */}

            <RigidBody
                type="fixed"
                colliders="trimesh"
                includeInvisible
            >
                <primitive
                    object={
                        collision.scene
                    }
                    visible={true}
                />
            </RigidBody>
        </>
    );
}

useGLTF.preload(
    "/map/map.glb",
);

useGLTF.preload(
    "/map/map-collision.glb",
);
