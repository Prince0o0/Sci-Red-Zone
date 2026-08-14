"use client";

import {
    useEffect,
    useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { PlayerEffectStateRef } from "./playerEffectTypes";

// ==============================
// Speed-line tuning
// ==============================

export const SPEED_LINE_COUNT = 10;
export const SPEED_LINE_MIN_SPEED = 13;
export const SPEED_LINE_FULL_SPEED = 18;
export const SPEED_LINE_MIN_LENGTH = 0.65;
export const SPEED_LINE_MAX_LENGTH = 1.35;
export const SPEED_LINE_THICKNESS = 0.018;
export const SPEED_LINE_MAX_OPACITY = 0.11;

const SPEED_LINE_RANGE = 2.4;
const SPEED_LINE_FADE_IN = 6;
const SPEED_LINE_FADE_OUT = 4.5;
const SPEED_LINE_COLOR = new THREE.Color(
    "#94a0ad",
);

type SpeedLine = {
    offsetX: number;
    y: number;
    z: number;
    length: number;
    travelSpeed: number;
};

type SpeedLinesEffectProps = {
    stateRef: PlayerEffectStateRef;
};

function createSpeedLine(index: number): SpeedLine {
    const fraction =
        (index + 0.5) / SPEED_LINE_COUNT;
    const sequence =
        (index * 0.61803398875) % 1;

    return {
        offsetX:
            THREE.MathUtils.lerp(
                -SPEED_LINE_RANGE,
                SPEED_LINE_RANGE,
                fraction,
            ),
        y: THREE.MathUtils.lerp(
            0.38,
            1.85,
            sequence,
        ),
        z: 0.1 + (index % 3) * 0.018,
        length: THREE.MathUtils.lerp(
            SPEED_LINE_MIN_LENGTH,
            SPEED_LINE_MAX_LENGTH,
            (index * 0.37) % 1,
        ),
        travelSpeed: THREE.MathUtils.lerp(
            2.5,
            4.2,
            (index * 0.53) % 1,
        ),
    };
}

export default function SpeedLinesEffect({
    stateRef,
}: SpeedLinesEffectProps) {
    const meshRef =
        useRef<THREE.InstancedMesh>(null);

    const materialRef =
        useRef<THREE.MeshBasicMaterial>(null);

    const intensity = useRef(0);
    const lastDirection = useRef(1);

    const linesRef = useRef(
        Array.from(
            { length: SPEED_LINE_COUNT },
            (_, index) =>
                createSpeedLine(index),
        ),
    );

    const matrixHelper =
        useRef(new THREE.Object3D());

    useEffect(() => {
        meshRef.current?.instanceMatrix.setUsage(
            THREE.DynamicDrawUsage,
        );
    }, []);

    useFrame((_, delta) => {
        const mesh = meshRef.current;
        const material = materialRef.current;

        if (!mesh || !material) {
            return;
        }

        const state = stateRef.current;
        const safeDelta = Math.min(delta, 0.05);

        if (!state.enabled || !state.grounded) {
            intensity.current = 0;
            material.opacity = 0;
            mesh.visible = false;
            return;
        }

        const speed = Math.abs(state.velocityX);
        const targetIntensity =
            state.locomotionActive
                ? THREE.MathUtils.smoothstep(
                    speed,
                    SPEED_LINE_MIN_SPEED,
                    SPEED_LINE_FULL_SPEED,
                )
                : 0;

        const fadeSpeed =
            targetIntensity > intensity.current
                ? SPEED_LINE_FADE_IN
                : SPEED_LINE_FADE_OUT;

        intensity.current =
            THREE.MathUtils.lerp(
                intensity.current,
                targetIntensity,
                1 - Math.exp(-fadeSpeed * safeDelta),
            );

        if (intensity.current < 0.004) {
            material.opacity = 0;
            mesh.visible = false;
            return;
        }

        if (speed > 0.05) {
            lastDirection.current =
                state.velocityX >= 0 ? 1 : -1;
        }

        const direction = lastDirection.current;
        const currentIntensity = intensity.current;
        const lines = linesRef.current;
        const helper = matrixHelper.current;

        material.opacity =
            SPEED_LINE_MAX_OPACITY *
            currentIntensity;
        mesh.visible = true;

        for (
            let i = 0;
            i < SPEED_LINE_COUNT;
            i += 1
        ) {
            const line = lines[i];

            line.offsetX -=
                direction *
                line.travelSpeed *
                safeDelta;

            if (
                direction > 0 &&
                line.offsetX < -SPEED_LINE_RANGE
            ) {
                line.offsetX = SPEED_LINE_RANGE;
            } else if (
                direction < 0 &&
                line.offsetX > SPEED_LINE_RANGE
            ) {
                line.offsetX = -SPEED_LINE_RANGE;
            }

            helper.position.set(
                state.x + line.offsetX,
                state.footY + line.y,
                state.z + line.z,
            );
            helper.scale.set(
                line.length *
                    (
                        0.7 +
                        currentIntensity * 0.3
                    ),
                SPEED_LINE_THICKNESS,
                1,
            );
            helper.updateMatrix();

            mesh.setMatrixAt(
                i,
                helper.matrix,
            );
        }

        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh
            ref={meshRef}
            name="speed-lines-effect"
            args={[undefined, undefined, SPEED_LINE_COUNT]}
            visible={false}
            frustumCulled={false}
            renderOrder={1}
        >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
                ref={materialRef}
                color={SPEED_LINE_COLOR}
                transparent
                opacity={0}
                depthWrite={false}
                toneMapped={false}
            />
        </instancedMesh>
    );
}
