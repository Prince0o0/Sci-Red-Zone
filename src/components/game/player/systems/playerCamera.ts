"use client";

import {
    useCallback,
    useRef,
} from "react";

import * as THREE from "three";

import {
    CAMERA_DISTANCE,
    CAMERA_FOLLOW_SPEED,
    CAMERA_HEIGHT,
    CAMERA_TARGET_HEIGHT,
    CAMERA_VERTICAL_SPEED,
    LOOK_AHEAD_SPEED,
    RUN_LOOK_AHEAD,
    WALK_LOOK_AHEAD,
} from "../playerConfig";

// ==============================
// Types
// ==============================

type UpdatePlayerCameraOptions = {
    position: {
        x: number;
        y: number;
        z: number;
    };

    isMoving: boolean;

    direction: number;

    isRunning: boolean;

    safeDelta: number;
};

type UsePlayerCameraOptions = {
    camera: THREE.Camera;
};

// ==============================
// Player Camera
// ==============================

export function usePlayerCamera({
    camera,
}: UsePlayerCameraOptions) {
    // ==============================
    // Camera State
    // ==============================

    const cameraLookAhead =
        useRef(0);

    const cameraInitialized =
        useRef(false);

    const desiredCameraPosition =
        useRef(
            new THREE.Vector3(),
        );

    const desiredCameraTarget =
        useRef(
            new THREE.Vector3(),
        );

    const currentCameraTarget =
        useRef(
            new THREE.Vector3(),
        );

    // ==============================
    // Update Camera
    // ==============================

    const updateCamera =
        useCallback(
            ({
                position,
                isMoving,
                direction,
                isRunning,
                safeDelta,
            }: UpdatePlayerCameraOptions) => {
                // ============================
                // Cinematic Side Camera
                // ============================

                /*
                 * ถ้าเดินขวา direction = 1
                 * ถ้าเดินซ้าย direction = -1
                 *
                 * กล้องจะมองล่วงหน้า
                 * ไปยังทิศที่ Player เดิน
                 */

                let targetLookAhead = 0;

                if (isMoving) {
                    targetLookAhead =
                        direction *
                        (
                            isRunning
                                ? RUN_LOOK_AHEAD
                                : WALK_LOOK_AHEAD
                        );
                }

                // ============================
                // Look Ahead Smoothing
                // ============================

                /*
                 * เวลาเปลี่ยนซ้าย → ขวา
                 * หรือขวา → ซ้าย
                 *
                 * ไม่ให้กล้องกระชากทันที
                 */

                const lookAheadSmoothing =
                    1 -
                    Math.exp(
                        -LOOK_AHEAD_SPEED *
                        safeDelta,
                    );

                cameraLookAhead.current =
                    THREE.MathUtils.lerp(
                        cameraLookAhead.current,
                        targetLookAhead,
                        lookAheadSmoothing,
                    );

                // ============================
                // Camera Target
                // ============================

                /*
                 * จุดที่กล้องจะมอง
                 */

                desiredCameraTarget.current.set(
                    position.x +
                        cameraLookAhead.current,

                    position.y +
                        CAMERA_TARGET_HEIGHT,

                    0,
                );

                // ============================
                // Camera Position
                // ============================

                /*
                 * X:
                 * ตาม Player
                 * + Look Ahead เล็กน้อย
                 *
                 * Y:
                 * อยู่เหนือ Player
                 *
                 * Z:
                 * อยู่ด้านหน้าฉาก
                 * สำหรับ Side View
                 */

                desiredCameraPosition.current.set(
                    position.x +
                        cameraLookAhead.current *
                            0.45,

                    position.y +
                        CAMERA_HEIGHT,

                    CAMERA_DISTANCE,
                );

                // ============================
                // First Frame
                // ============================

                /*
                 * เฟรมแรก
                 *
                 * ให้กล้องไปหา Player
                 * ทันที
                 *
                 * ไม่งั้นกล้องจะค่อย ๆ
                 * บินจากตำแหน่งเริ่มต้น
                 */

                if (
                    !cameraInitialized.current
                ) {
                    camera.position.copy(
                        desiredCameraPosition.current,
                    );

                    currentCameraTarget.current.copy(
                        desiredCameraTarget.current,
                    );

                    camera.lookAt(
                        currentCameraTarget.current,
                    );

                    cameraInitialized.current =
                        true;

                    return;
                }

                // ============================
                // Horizontal Smoothing
                // ============================

                /*
                 * X / Z ตาม Player เร็วกว่า Y
                 */

                const horizontalSmoothing =
                    1 -
                    Math.exp(
                        -CAMERA_FOLLOW_SPEED *
                        safeDelta,
                    );

                camera.position.x =
                    THREE.MathUtils.lerp(
                        camera.position.x,
                        desiredCameraPosition
                            .current.x,
                        horizontalSmoothing,
                    );

                camera.position.z =
                    THREE.MathUtils.lerp(
                        camera.position.z,
                        desiredCameraPosition
                            .current.z,
                        horizontalSmoothing,
                    );

                // ============================
                // Vertical Smoothing
                // ============================

                /*
                 * Y ตามช้ากว่า
                 *
                 * เวลา Jump / Fall
                 * กล้องจะไม่เด้งขึ้นลง
                 * ตาม Player แบบแข็ง ๆ
                 */

                const verticalSmoothing =
                    1 -
                    Math.exp(
                        -CAMERA_VERTICAL_SPEED *
                        safeDelta,
                    );

                camera.position.y =
                    THREE.MathUtils.lerp(
                        camera.position.y,
                        desiredCameraPosition
                            .current.y,
                        verticalSmoothing,
                    );

                // ============================
                // Target Smoothing
                // ============================

                currentCameraTarget.current.x =
                    THREE.MathUtils.lerp(
                        currentCameraTarget
                            .current.x,
                        desiredCameraTarget
                            .current.x,
                        horizontalSmoothing,
                    );

                currentCameraTarget.current.y =
                    THREE.MathUtils.lerp(
                        currentCameraTarget
                            .current.y,
                        desiredCameraTarget
                            .current.y,
                        verticalSmoothing,
                    );

                /*
                 * Side Scroller
                 * ล็อก Target Z = 0
                 */

                currentCameraTarget.current.z =
                    0;

                // ============================
                // Look At Player
                // ============================

                camera.lookAt(
                    currentCameraTarget.current,
                );
            },
            [camera],
        );

    // ==============================
    // Public API
    // ==============================

    return {
        updateCamera,
    };
}