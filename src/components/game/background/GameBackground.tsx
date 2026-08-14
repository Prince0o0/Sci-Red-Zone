"use client";

import { useTexture } from "@react-three/drei";

export default function GameBackground() {
    const texture = useTexture(
        "/backgrounds/hallway.jpg",
    );

    return (
        <mesh
            position={[25, 6, -40]}
        >
            <planeGeometry
                args={[80, 16]}
            />

            <meshBasicMaterial
                map={texture}
                toneMapped={false}
            />
        </mesh>
    );
}