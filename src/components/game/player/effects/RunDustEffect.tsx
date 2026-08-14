"use client";

import {
    useEffect,
    useMemo,
    useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { PlayerEffectStateRef } from "./playerEffectTypes";

// ==============================
// Dust tuning
// ==============================

export const DUST_POOL_SIZE = 14;
export const DUST_MIN_SPEED = 1.8;
export const DUST_RUN_SPEED = 11.5;
export const DUST_FULL_SPEED = 18;
export const DUST_JOG_SPAWN_INTERVAL = 0.17;
export const DUST_RUN_SPAWN_INTERVAL = 0.075;
export const DUST_MIN_LIFETIME = 0.38;
export const DUST_MAX_LIFETIME = 0.55;
export const DUST_JOG_SIZE = 0.055;
export const DUST_RUN_SIZE = 0.09;
export const DUST_JOG_OPACITY = 0.1;
export const DUST_RUN_OPACITY = 0.2;

const DUST_COLOR = new THREE.Color(
    "#6f747b",
);

const DUST_POOL_INDICES = Array.from(
    { length: DUST_POOL_SIZE },
    (_, index) => index,
);

type DustParticle = {
    active: boolean;
    age: number;
    lifetime: number;
    size: number;
    opacity: number;
    velocityX: number;
    velocityY: number;
    spin: number;
};

type RunDustEffectProps = {
    stateRef: PlayerEffectStateRef;
};

function createParticle(): DustParticle {
    return {
        active: false,
        age: 0,
        lifetime: DUST_MIN_LIFETIME,
        size: DUST_JOG_SIZE,
        opacity: 0,
        velocityX: 0,
        velocityY: 0,
        spin: 0,
    };
}

export default function RunDustEffect({
    stateRef,
}: RunDustEffectProps) {
    const meshRefs =
        useRef<Array<THREE.Mesh | null>>(
            [],
        );

    const materialRefs =
        useRef<
            Array<THREE.MeshBasicMaterial | null>
        >([]);

    const particlesRef = useRef(
        Array.from(
            { length: DUST_POOL_SIZE },
            createParticle,
        ),
    );

    const geometry = useMemo(
        () => new THREE.CircleGeometry(1, 7),
        [],
    );

    const spawnTimer = useRef(0);
    const nextParticleIndex = useRef(0);
    const footSide = useRef(1);

    useEffect(() => {
        return () => {
            geometry.dispose();
        };
    }, [geometry]);

    useFrame((_, delta) => {
        const state = stateRef.current;
        const safeDelta = Math.min(delta, 0.05);
        const particles = particlesRef.current;

        if (!state.enabled || !state.grounded) {
            spawnTimer.current = 0;

            for (
                let i = 0;
                i < DUST_POOL_SIZE;
                i += 1
            ) {
                particles[i].active = false;

                const mesh = meshRefs.current[i];

                if (mesh) {
                    mesh.visible = false;
                }
            }

            return;
        }

        for (
            let i = 0;
            i < DUST_POOL_SIZE;
            i += 1
        ) {
            const particle = particles[i];

            if (!particle.active) {
                continue;
            }

            const mesh = meshRefs.current[i];
            const material =
                materialRefs.current[i];

            if (!mesh || !material) {
                continue;
            }

            particle.age += safeDelta;

            if (particle.age >= particle.lifetime) {
                particle.active = false;
                mesh.visible = false;
                continue;
            }

            const progress =
                particle.age / particle.lifetime;

            mesh.position.x +=
                particle.velocityX * safeDelta;
            mesh.position.y +=
                particle.velocityY * safeDelta;
            mesh.rotation.z +=
                particle.spin * safeDelta;

            const expandedSize =
                particle.size *
                (
                    0.65 +
                    THREE.MathUtils.smoothstep(
                        progress,
                        0,
                        1,
                    ) *
                        1.35
                );

            mesh.scale.setScalar(expandedSize);

            const remaining = 1 - progress;

            material.opacity =
                particle.opacity *
                remaining *
                remaining;
        }

        const speed = Math.abs(state.velocityX);

        if (
            !state.locomotionActive ||
            speed < DUST_MIN_SPEED
        ) {
            spawnTimer.current = 0;
            return;
        }

        const runStrength =
            THREE.MathUtils.smoothstep(
                speed,
                DUST_RUN_SPEED,
                DUST_FULL_SPEED,
            );

        const spawnInterval =
            THREE.MathUtils.lerp(
                DUST_JOG_SPAWN_INTERVAL,
                DUST_RUN_SPAWN_INTERVAL,
                runStrength,
            );

        spawnTimer.current += safeDelta;

        if (spawnTimer.current < spawnInterval) {
            return;
        }

        spawnTimer.current -= spawnInterval;

        const index = nextParticleIndex.current;
        nextParticleIndex.current =
            (index + 1) % DUST_POOL_SIZE;

        const particle = particles[index];
        const mesh = meshRefs.current[index];
        const material =
            materialRefs.current[index];

        if (!mesh || !material) {
            return;
        }

        const direction =
            state.velocityX >= 0 ? 1 : -1;
        const side = footSide.current;
        footSide.current *= -1;

        particle.active = true;
        particle.age = 0;
        particle.lifetime =
            THREE.MathUtils.lerp(
                DUST_MIN_LIFETIME,
                DUST_MAX_LIFETIME,
                Math.random(),
            );
        particle.size =
            THREE.MathUtils.lerp(
                DUST_JOG_SIZE,
                DUST_RUN_SIZE,
                runStrength,
            ) *
            THREE.MathUtils.lerp(
                0.85,
                1.15,
                Math.random(),
            );
        particle.opacity =
            THREE.MathUtils.lerp(
                DUST_JOG_OPACITY,
                DUST_RUN_OPACITY,
                runStrength,
            );
        particle.velocityX =
            -direction *
                THREE.MathUtils.lerp(
                    0.18,
                    0.52,
                    runStrength,
                ) +
            (Math.random() - 0.5) * 0.12;
        particle.velocityY =
            THREE.MathUtils.lerp(
                0.12,
                0.25,
                Math.random(),
            );
        particle.spin =
            (Math.random() - 0.5) * 1.4;

        mesh.position.set(
            state.x - direction * 0.11 + side * 0.055,
            state.footY + 0.035,
            state.z +
                0.14 +
                (Math.random() - 0.5) * 0.05,
        );
        mesh.rotation.z = Math.random() * Math.PI;
        mesh.scale.setScalar(
            particle.size * 0.65,
        );
        mesh.visible = true;
        material.opacity = particle.opacity;
    });

    return (
        <group name="run-dust-effect">
            {DUST_POOL_INDICES.map(
                (index) => (
                    <mesh
                        key={index}
                        name="run-dust-particle"
                        ref={(mesh) => {
                            meshRefs.current[index] =
                                mesh;
                        }}
                        geometry={geometry}
                        visible={false}
                        renderOrder={2}
                    >
                        <meshBasicMaterial
                            ref={(material) => {
                                materialRefs.current[
                                    index
                                ] = material;
                            }}
                            color={DUST_COLOR}
                            transparent
                            opacity={0}
                            depthWrite={false}
                            toneMapped={false}
                        />
                    </mesh>
                ),
            )}
        </group>
    );
}
