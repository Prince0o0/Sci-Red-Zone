"use client";

import {
    useEffect,
    useMemo,
} from "react";
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
    const rawTexture =
        useTexture(url);

    const texture = useMemo(() => {
        const cloned = rawTexture.clone();
        cloned.colorSpace = THREE.SRGBColorSpace;
        cloned.needsUpdate = true;
        return cloned;
    }, [rawTexture]);

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
// Video Background
// ==============================

function VideoBackground({
    url,
    position,
    size,
}: {
    url: string;
    position: [number, number, number];
    size: [number, number];
}) {
    const texture = useMemo(() => {
        const video = document.createElement("video");

        video.src = url;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.colorSpace = THREE.SRGBColorSpace;

        return videoTexture;
    }, [url]);

    useEffect(() => {
        const video = texture.image as HTMLVideoElement;

        video.play().catch(() => {
            // บางเบราว์เซอร์บล็อก autoplay แม้ muted แล้วก็ตาม เงียบไว้
        });

        return () => {
            video.pause();
            video.src = "";
            texture.dispose();
        };
    }, [texture]);

    return (
        <mesh position={position}>
            <planeGeometry args={size} />

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
    if (background.videoUrl) {
        return (
            <VideoBackground
                url={background.videoUrl}
                position={
                    background.position
                }
                size={
                    background.size
                }
            />
        );
    }

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

    return null;
}