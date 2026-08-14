"use client";

import {
    CuboidCollider,
    RigidBody,
} from "@react-three/rapier";

import {
    useRef,
} from "react";

type MapExitTriggerProps = {
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

    onEnter: () => void;
};

export default function MapExitTrigger({
    position,
    halfExtents,
    onEnter,
}: MapExitTriggerProps) {
    const triggered =
        useRef(false);

    return (
        <RigidBody
            type="fixed"
            colliders={false}
        >
            <CuboidCollider
                args={halfExtents}
                position={position}
                sensor
                onIntersectionEnter={({
                    other,
                }) => {
                    if (
                        triggered.current
                    ) {
                        return;
                    }

                    if (
                        other
                            .rigidBodyObject
                            ?.name !==
                        "player"
                    ) {
                        return;
                    }

                    triggered.current =
                        true;

                    onEnter();
                }}
            />
        </RigidBody>
    );
}