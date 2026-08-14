"use client";

import {
    Html,
} from "@react-three/drei";

import {
    CuboidCollider,
    RigidBody,
} from "@react-three/rapier";

import {
    useFrame,
} from "@react-three/fiber";

import {
    useEffect,
    useRef,
    useState,
} from "react";

type HoldExitTriggerProps = {
    position: [
        number,
        number,
        number,
    ];

    halfExtents: [
        number,
        number,
        number,
    ];

    onComplete: () => void;

    holdDuration?: number;

    promptOffsetY?: number;

    enabled?: boolean;
};

export default function HoldExitTrigger({
    position,
    halfExtents,
    onComplete,
    holdDuration = 1.2,
    promptOffsetY = 2,
    enabled = true,
}: HoldExitTriggerProps) {
    const playerInsideRef = useRef(false);

    const holdingERef = useRef(false);

    const holdTimeRef = useRef(0);

    const completedRef = useRef(false);

    const [
        isPlayerNear,
        setIsPlayerNear,
    ] = useState(false);

    const [
        progress,
        setProgress,
    ] = useState(0);

    // ==============================
    // Keyboard
    // ==============================

    useEffect(() => {
        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (event.code !== "KeyE") {
                return;
            }

            if (!enabled) {
                return;
            }

            if (!playerInsideRef.current) {
                return;
            }

            if (completedRef.current) {
                return;
            }

            holdingERef.current = true;
        }

        function handleKeyUp(event: KeyboardEvent,) {
            if (event.code !== "KeyE") {
                return;
            }

            holdingERef.current = false;

            /*
             * ปล่อย E ก่อนครบ
             * ต้องเริ่มใหม่
             */
            if (!completedRef.current) {
                holdTimeRef.current = 0;

                setProgress(0);
            }
        }

        function handleBlur() {
            holdingERef.current = false;

            holdTimeRef.current = 0;

            setProgress(0);
        }

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        window.addEventListener(
            "keyup",
            handleKeyUp,
        );

        window.addEventListener(
            "blur",
            handleBlur,
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );

            window.removeEventListener(
                "keyup",
                handleKeyUp,
            );

            window.removeEventListener(
                "blur",
                handleBlur,
            );
        };
    }, [enabled]);

    // ==============================
    // Hold Progress
    // ==============================

    useFrame((_, delta) => {
        if (
            completedRef.current
        ) {
            return;
        }

        if (
            !playerInsideRef.current
        ) {
            return;
        }

        if (
            !holdingERef.current
        ) {
            return;
        }

        const safeDelta =
            Math.min(delta, 0.1);

        holdTimeRef.current +=
            safeDelta;

        const nextProgress =
            Math.min(
                holdTimeRef.current /
                holdDuration,
                1,
            );

        setProgress(nextProgress);

        // ============================
        // เปิดประตูสำเร็จ
        // ============================

        if (
            holdTimeRef.current >=
            holdDuration
        ) {
            completedRef.current = true;

            holdingERef.current = false;

            setProgress(1);

            onComplete();
        }
    });

    return (
        <>
            {/* ======================
                Trigger
            ====================== */}

            <RigidBody
                type="fixed"
                colliders={false}
            >
                <CuboidCollider
                    sensor
                    args={halfExtents}
                    position={position}

                    onIntersectionEnter={({
                        other,
                    }) => {
                        if (
                            other
                                .rigidBodyObject
                                ?.name !==
                            "player"
                        ) {
                            return;
                        }

                        playerInsideRef.current =
                            true;

                        setIsPlayerNear(true);
                    }}

                    onIntersectionExit={({
                        other,
                    }) => {
                        if (
                            other
                                .rigidBodyObject
                                ?.name !==
                            "player"
                        ) {
                            return;
                        }

                        playerInsideRef.current =
                            false;

                        holdingERef.current =
                            false;

                        holdTimeRef.current = 0;

                        setProgress(0);

                        setIsPlayerNear(false);
                    }}
                />
            </RigidBody>

            {/* ======================
                UI
            ====================== */}

            {enabled && isPlayerNear && !completedRef.current && (
                <Html
                    position={[
                        position[0],
                        position[1] +
                        promptOffsetY,
                        position[2],
                    ]}
                    center
                >
                    <div
                        className="
                                w-52
                                rounded-lg
                                bg-black/75
                                px-4
                                py-3
                                text-center
                                text-sm
                                text-white
                                backdrop-blur-sm
                            "
                    >
                        <div>
                            กด{" "}
                            <span className="font-bold">
                                E
                            </span>{" "}
                            ค้างเพื่อเปิดประตู
                        </div>

                        <div
                            className="
                                    mt-2
                                    h-1.5
                                    overflow-hidden
                                    rounded-full
                                    bg-white/20
                                "
                        >
                            <div
                                className="
                                        h-full
                                        bg-white
                                    "
                                style={{
                                    width: `${progress * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                </Html>
            )}
        </>
    );
}