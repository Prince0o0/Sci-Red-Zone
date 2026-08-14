"use client";

import { useRef } from "react";
import type { RapierCollider, RapierRigidBody } from "@react-three/rapier";
import {
    CROUCH_SPEED,
    CROUCHED_SPINTING_DURATION,
    CROUCHED_STANDING_DURATION,
    INACTIVE_COLLISION_GROUPS,
    SLIDE_BLOCKED_SPEED,
    SLIDE_DRAG,
    SLIDE_DURATION,
    SLIDE_MIN_ENTRY_SPEED,
    SLIDE_MIN_INITIAL_SPEED,
} from "../playerConfig";

export type UsePlayerCrouchSlideOptions = {
    bodyRef: React.RefObject<RapierRigidBody | null>;
    standingColliderRef: React.RefObject<RapierCollider | null>;
    crouchingColliderRef: React.RefObject<RapierCollider | null>;
    ceilingContacts: React.MutableRefObject<number>;
    keys: React.MutableRefObject<{
        left: boolean;
        right: boolean;
        run: boolean;
        crouch: boolean;
    }>;
    crouchPressed: React.MutableRefObject<boolean>;
    crouchKeysDown: React.MutableRefObject<Set<string>>;
    manualCrouchActive: React.MutableRefObject<boolean>;
    standFromManualCrouchQueued: React.MutableRefObject<boolean>;
    crouchSprintOverride: React.MutableRefObject<boolean>;
};

export function usePlayerCrouchSlide({
    bodyRef,
    standingColliderRef,
    crouchingColliderRef,
    ceilingContacts,
    keys,
    crouchPressed,
    crouchKeysDown,
    manualCrouchActive,
    standFromManualCrouchQueued,
    crouchSprintOverride,
}: UsePlayerCrouchSlideOptions) {
    const isCrouching = useRef(false);
    const isSliding = useRef(false);
    const slideTimer = useRef(0);
    const slideDirection = useRef<1 | -1>(1);

    // ==============================
    // เปลี่ยน Standing / Crouch Collider
    // ==============================
    function setCrouching(crouching: boolean) {
        const standingCollider = standingColliderRef.current;
        const crouchingCollider = crouchingColliderRef.current;
        const body = bodyRef.current;

        if (!standingCollider || !crouchingCollider || !body) {
            return;
        }

        if (crouching) {
            const collisionGroups = standingCollider.collisionGroups();

            crouchingCollider.setCollisionGroups(collisionGroups);
            crouchingCollider.setEnabled(true);

            standingCollider.setCollisionGroups(INACTIVE_COLLISION_GROUPS);
            standingCollider.setEnabled(false);
        } else {
            const collisionGroups = crouchingCollider.collisionGroups();

            standingCollider.setCollisionGroups(collisionGroups);
            standingCollider.setEnabled(true);

            crouchingCollider.setCollisionGroups(INACTIVE_COLLISION_GROUPS);
            crouchingCollider.setEnabled(false);
        }

        body.recomputeMassPropertiesFromColliders();
        body.wakeUp();

        isCrouching.current = crouching;
    }

    // ==============================
    // Exit Crouch State / Reset
    // ==============================
    function exitCrouchState() {
        keys.current.crouch = false;
        crouchPressed.current = false;
        crouchKeysDown.current.clear();

        manualCrouchActive.current = false;
        standFromManualCrouchQueued.current = false;
        crouchSprintOverride.current = false;

        isSliding.current = false;
        slideTimer.current = 0;

        if (isCrouching.current && ceilingContacts.current === 0) {
            setCrouching(false);
        }
    }

    return {
        isCrouching,
        isSliding,
        slideTimer,
        slideDirection,
        setCrouching,
        exitCrouchState,
    };
}
