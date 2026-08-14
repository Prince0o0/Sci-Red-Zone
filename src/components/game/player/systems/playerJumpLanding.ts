"use client";

import { useRef } from "react";
import type { GroundTransition } from "../playerConfig";
import { GROUND_TRANSITION_DURATIONS } from "../playerConfig";

export function usePlayerJumpLanding() {
    const didJump = useRef(false);
    const jumpStartedRunning = useRef(false);
    const jumpTakeoffFootY = useRef(0);
    const lastGroundFootY = useRef(0);
    const highFallActive = useRef(false);
    const wasGrounded = useRef(true);

    const landingTimer = useRef(0);
    const landingAnimation = useRef<"Landing" | "HardLanding">("Landing");

    const groundTransition = useRef<GroundTransition | null>(null);
    const groundTransitionTimer = useRef(0);
    const groundTransitionStartedThisFrame = useRef(false);
    const runStopInputTimer = useRef(0);

    function startGroundTransition(nextTransition: GroundTransition) {
        if (groundTransition.current === nextTransition) {
            return;
        }

        groundTransition.current = nextTransition;
        groundTransitionTimer.current = 0;
        groundTransitionStartedThisFrame.current = true;
    }

    function clearGroundTransition() {
        groundTransition.current = null;
        groundTransitionTimer.current = 0;
        groundTransitionStartedThisFrame.current = false;
    }

    function updateGroundTransitionTimer(safeDelta: number) {
        if (groundTransition.current !== null) {
            if (!groundTransitionStartedThisFrame.current) {
                groundTransitionTimer.current += safeDelta;
            }

            const maxDuration =
                GROUND_TRANSITION_DURATIONS[groundTransition.current];

            if (
                maxDuration !== undefined &&
                groundTransitionTimer.current >= maxDuration
            ) {
                clearGroundTransition();
            }
        }
        groundTransitionStartedThisFrame.current = false;
    }

    function resetJumpFallState() {
        didJump.current = false;
        jumpStartedRunning.current = false;
        highFallActive.current = false;
        landingTimer.current = 0;
    }

    return {
        didJump,
        jumpStartedRunning,
        jumpTakeoffFootY,
        lastGroundFootY,
        highFallActive,
        wasGrounded,
        landingTimer,
        landingAnimation,
        groundTransition,
        groundTransitionTimer,
        groundTransitionStartedThisFrame,
        runStopInputTimer,
        startGroundTransition,
        clearGroundTransition,
        updateGroundTransitionTimer,
        resetJumpFallState,
    };
}
