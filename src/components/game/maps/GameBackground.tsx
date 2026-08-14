"use client";

import {
    useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import type {
    MapDefinition,
} from "./mapTypes";

type GameBackgroundProps = {
    background: MapDefinition["background"];
};

// ==============================
// Image Background
// ==============================

function ImageBackground({
    url,
    position,
    size,
}: {
    url: string;

    position: [
        number,
        number,
        number,
    ];

    size: [
        number,
        number,
    ];
}) {
    const texture =
        useTexture(url);

    texture.colorSpace =
        THREE.SRGBColorSpace;

    return (
        <mesh
            position={position}
        >
            <planeGeometry
                args={size}
            />

            <meshBasicMaterial
                map={texture}
                toneMapped={false}
                depthWrite={false}
            />
        </mesh>
    );
}

// ==============================
// Fallback Background
// ==============================

function ColorBackground({
    position,
    size,
    color,
}: {
    position: [
        number,
        number,
        number,
    ];

    size: [
        number,
        number,
    ];

    color: string;
}) {
    return (
        <mesh
            position={position}
        >
            <planeGeometry
                args={size}
            />

            <meshBasicMaterial
                color={color}
                toneMapped={false}
                depthWrite={false}
            />
        </mesh>
    );
}

// ==============================
// Public Component
// ==============================

export default function GameBackground({
    background,
}: GameBackgroundProps) {
    if (background.url) {
        return (
            <ImageBackground
                url={background.url}
                position={
                    background.position
                }
                size={
                    background.size
                }
            />
        );
    }

    return (
        <ColorBackground
            position={
                background.position
            }
            size={
                background.size
            }
            color={
                background.fallbackColor
            }
        />
    );
}