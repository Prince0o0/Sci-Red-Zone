import type { PlayerAnimation } from "./PlayerModel";
import type { GroundTransition } from "./playerConfig";

type ResolvePlayerAnimationInput = {
    currentAnimation: PlayerAnimation;
    isRunJumpingUp: boolean;
    isClimbing: boolean;
    isHanging: boolean;
    isEnteringHang: boolean;
    isHangDropping: boolean;
    shouldPreLand: boolean;
    animationGrounded: boolean;
    landingTimer: number;
    landingAnimation: "Landing" | "HardLanding";
    isSliding: boolean;
    highFallActive: boolean;
    didJump: boolean;
    jumpStartedRunning: boolean;
    groundTransition: GroundTransition | null;
    pushTransitionState: "none" | "start" | "pushing" | "stop";
    pushTransitionTimer: number;
    isPushing: boolean;
    isMoving: boolean;
    isCrouching: boolean;
    isWaitingForRunStop: boolean;
    isRunning: boolean;
    isJogging: boolean;
};

export function resolvePlayerAnimation({
    currentAnimation,
    isRunJumpingUp,
    isClimbing,
    isHanging,
    isEnteringHang,
    isHangDropping,
    shouldPreLand,
    animationGrounded,
    landingTimer,
    landingAnimation,
    isSliding,
    highFallActive,
    didJump,
    jumpStartedRunning,
    groundTransition,
    pushTransitionState,
    pushTransitionTimer,
    isPushing,
    isMoving,
    isCrouching,
    isWaitingForRunStop,
    isRunning,
    isJogging,
}: ResolvePlayerAnimationInput): PlayerAnimation {
    if (isRunJumpingUp) {
        return "JumpUp";
    }

    if (isClimbing) {
        return "Climb";
    }

    if (isHanging) {
        return isEnteringHang
            ? "JumpHang"
            : "HangingIdle";
    }

    if (isHangDropping) {
        return "BracedHangDrop";
    }

    if (shouldPreLand || (animationGrounded && landingTimer > 0)) {
        return shouldPreLand
            ? "Landing"
            : landingAnimation;
    }

    if (isSliding) {
        return "RunningSlide";
    }

    if (!animationGrounded) {
        if (highFallActive) {
            return "Jump";
        }

        if (didJump && jumpStartedRunning) {
            return "RunningJump";
        }

        return "Jump";
    }

    if (groundTransition !== null) {
        return groundTransition;
    }

    if (
        pushTransitionState === "stop" &&
        pushTransitionTimer > 0 &&
        animationGrounded &&
        !isCrouching
    ) {
        return "PushStop";
    }

    if (isPushing && animationGrounded && !isCrouching) {
        if (
            pushTransitionState === "start" &&
            pushTransitionTimer > 0
        ) {
            return "PushStart";
        }

        if (isMoving) {
            return "Pushing";
        }

        return "PushStart";
    }

    if (isCrouching) {
        return isMoving
            ? "CrouchWalking"
            : "CrouchingIdle";
    }

    if (isWaitingForRunStop) {
        return currentAnimation;
    }

    if (isRunning) {
        return "Spint";
    }

    if (isJogging) {
        return "Jog";
    }

    return "Idle";
}
