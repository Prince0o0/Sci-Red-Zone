"use client";

import { Html } from "@react-three/drei";
import {
    CuboidCollider,
    RigidBody,
} from "@react-three/rapier";
import {
    useEffect,
    useRef,
    useState,
} from "react";

type InteractionTriggerProps = {
    position: [
        number,
        number,
        number,
    ];

    halfExtents?: [
        number,
        number,
        number,
    ];

    label: string;

    enabled?: boolean;

    onInteract: () => void;
};

export default function InteractionTrigger({
    position,
    halfExtents = [1.5, 2, 1.5],
    label,
    enabled = true,
    onInteract,
}: InteractionTriggerProps) {
    const playerCollidersRef =
        useRef<Set<number>>(
            new Set(),
        );

    const playerNearRef =
        useRef(false);

    const [
        isPlayerNear,
        setIsPlayerNear,
    ] = useState(false);

    // ==============================
    // Keyboard
    // ==============================

    useEffect(() => {
        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (
                event.code !== "KeyE" ||
                event.repeat
            ) {
                return;
            }

            if (!enabled) {
                return;
            }

            if (
                !playerNearRef.current
            ) {
                return;
            }

            event.preventDefault();

            onInteract();
        }

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [
        enabled,
        onInteract,
    ]);

    return (
        <>
            {/* ======================
                Sensor
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

                        playerCollidersRef
                            .current
                            .add(
                                other
                                    .collider
                                    .handle,
                            );

                        playerNearRef.current =
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

                        playerCollidersRef
                            .current
                            .delete(
                                other
                                    .collider
                                    .handle,
                            );

                        if (
                            playerCollidersRef
                                .current
                                .size === 0
                        ) {
                            playerNearRef.current =
                                false;

                            setIsPlayerNear(
                                false,
                            );
                        }
                    }}
                />
            </RigidBody>

            {/* ======================
                Prompt
            ====================== */}

            {enabled &&
                isPlayerNear && (
                    <Html
                        position={[
                            position[0],
                            position[1] +
                            2,
                            position[2],
                        ]}
                        center
                    >
                        <div
                            className="
                                whitespace-nowrap
                                rounded-lg
                                bg-black/80
                                px-4
                                py-2
                                text-sm
                                text-white
                                shadow-lg
                                backdrop-blur-sm
                            "
                        >
                            <span
                                className="
                                    mr-2
                                    rounded
                                    bg-white
                                    px-2
                                    py-1
                                    font-bold
                                    text-black
                                "
                            >
                                E
                            </span>

                            {label}
                        </div>
                    </Html>
                )}
        </>
    );
}