"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    useFrame,
    useThree,
} from "@react-three/fiber";
import {
    CapsuleCollider,
    CuboidCollider,
    RigidBody,
    useRapier,
    type RapierCollider,
    type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";

import RunDustEffect from "./effects/RunDustEffect";
import SpeedLinesEffect from "./effects/SpeedLinesEffect";
import type { PlayerEffectSnapshot } from "./effects/playerEffectTypes";
import PlayerModel, {
    type PlayerAnimation,
} from "./PlayerModel";
import {
    CEILING_SENSOR_BOTTOM_Y,
    CEILING_SENSOR_HALF_HEIGHT,
    CEILING_SENSOR_HALF_WIDTH,
    CEILING_SENSOR_OFFSET_Y,
    CEILING_SENSOR_TOP_Y,
    CLIMB_DURATION,
    CLIMB_FORWARD_DISTANCE,
    CROUCHING_HALF_HEIGHT,
    CROUCHING_TOTAL_HEIGHT,
    CROUCH_COLLIDER_OFFSET_Y,
    CROUCH_COLLIDER_TOP_Y,
    CROUCH_SPEED,
    CROUCHED_SPINTING_DURATION,
    CROUCHED_STANDING_DURATION,
    GROUND_SUPPORT_RAY_MARGIN,
    GROUND_TRANSITION_DURATIONS,
    HANG_BODY_BELOW_LEDGE,
    HANG_DISTANCE_FROM_WALL,
    HANG_DROP_DURATION,
    HARD_LANDING_DURATION,
    HIGH_FALL_MIN_CLEARANCE,
    HIGH_FALL_START_VELOCITY,
    INACTIVE_COLLISION_GROUPS,
    JOG_SPEED,
    JUMP_HANG_DURATION,
    JUMP_SPEED,
    LAND_DURATION,
    LAND_PREP_DISTANCE,
    LEDGE_FORWARD_DISTANCE,
    LEDGE_LOWER_RAY_Y,
    LEDGE_REGRAB_COOLDOWN,
    LEDGE_TOP_RAY_DISTANCE,
    LEDGE_TOP_RAY_Y,
    LEDGE_UPPER_RAY_Y,
    MIN_GROUND_SUPPORT_NORMAL_Y,
    PLAYER_FOOT_OFFSET,
    PLAYER_RADIUS,
    REVERSE_BRAKE_ACCELERATION,
    RUN_JUMP_UP_DURATION,
    RUN_JUMP_UP_MAX_LEDGE_HEIGHT,
    RUN_SPEED,
    RUN_STOP_DURATION,
    RUN_STOP_INPUT_GRACE,
    SLIDE_BLOCKED_SPEED,
    SLIDE_DRAG,
    SLIDE_DURATION,
    SLIDE_MIN_ENTRY_SPEED,
    SLIDE_MIN_INITIAL_SPEED,
    STANDING_BODY_TO_FOOT,
    STANDING_COLLIDER_OFFSET_Y,
    STANDING_COLLIDER_TOP_Y,
    STANDING_HALF_HEIGHT,
    TAKEOFF_GROUND_IGNORE_VELOCITY,
    MIN_PASSIVE_LEDGE_GRAB_FALL_DISTANCE,
    SAME_LEDGE_HEIGHT_TOLERANCE,
    type GroundTransition,
} from "./playerConfig";
import { resolvePlayerAnimation } from "./resolvePlayerAnimation";
import { usePlayerCamera } from "./systems/playerCamera";
import { usePlayerCrouchSlide } from "./systems/playerCrouchSlide";
import { usePlayerGrounding } from "./systems/usePlayerGrounding";
import { usePlayerJumpLanding } from "./systems/playerJumpLanding";
import { usePlayerLedgeTraversal } from "./systems/playerLedgeTraversal";
import { usePlayerInput } from "./usePlayerInput";
import {
    PUSH_PLAYER_SPEED,
} from "../interactions/push/pushConfig";

import type {
    PushInteractionState,
} from "../interactions/push/pushTypes";

function moveTowards(
    current: number,
    target: number,
    maxDelta: number,
) {
    const delta = target - current;

    if (Math.abs(delta) <= maxDelta) {
        return target;
    }

    return (
        current + Math.sign(delta) * maxDelta
    );
}

type PlayerProps = {
    pushState: PushInteractionState;

    spawnPosition?: [
        number,
        number,
        number,
    ];

    mapExitTransition?: {
        active: boolean;
        steps: {
            velocityX: number;
            velocityZ: number;

            duration: number;

            rotationY: number;
        }[];
    };

    onMapExitWalkComplete?: () => void;

    controlsLocked?: boolean;

    mapEnterTransition?: {
        active: boolean;

        steps: {
            velocityX: number;
            velocityZ: number;
            duration: number;
            rotationY: number;
        }[];
    };

    onMapEnterWalkComplete?: () => void;
};

export default function Player({
    pushState,
    spawnPosition = [-10, 3, 0],
    mapExitTransition,
    onMapExitWalkComplete,
    controlsLocked = false,
    mapEnterTransition,
    onMapEnterWalkComplete,
}: PlayerProps) {
    const isPushing = pushState.active;
    const { camera } = useThree();

    const {
        updateCamera,
    } = usePlayerCamera({
        camera,
    });

    const {
        keys,
        jumpQueued,
        climbInputQueued,
        dropInputQueued,
        crouchPressed,
        crouchKeysDown,
        manualCrouchActive,
        standFromManualCrouchQueued,
        crouchSprintOverride,
    } = usePlayerInput({
        isPushing,
    });

    const { world, rapier } = useRapier();

    const mapExitTimer = useRef(0);
    const mapExitStarted = useRef(false);
    const mapExitCompleted = useRef(false);
    const mapExitStepIndex = useRef(0);

    const mapEnterTimer = useRef(0);
    const mapEnterStarted = useRef(false);
    const mapEnterCompleted = useRef(false);
    const mapEnterStepIndex = useRef(0);

    const bodyRef =
        useRef<RapierRigidBody>(null);

    const standingColliderRef =
        useRef<RapierCollider>(null);

    const crouchingColliderRef =
        useRef<RapierCollider>(null);

    const visualRef =
        useRef<THREE.Group>(null);

    const playerEffectState =
        useRef<PlayerEffectSnapshot>({
            x: -10,
            footY: 2.1,
            z: 0,
            velocityX: 0,
            grounded: false,
            enabled: false,
            locomotionActive: false,
        });

    // ==============================
    // Player State
    // ==============================

    const groundContacts = useRef(0);

    /*
     * Sensor บริเวณเหนือหัว
     *
     * ถ้า > 0 แสดงว่ามีเพดาน
     * จึงยังลุกไม่ได้
     */
    const ceilingContacts = useRef(0);

    const {
        isCrouching,
        isSliding,
        slideTimer,
        slideDirection,
        setCrouching,
        exitCrouchState,
    } = usePlayerCrouchSlide({
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
    });

    const prevIsPushingRef = useRef(false);
    const pushTransitionStateRef = useRef<
        "none" | "start" | "pushing" | "stop"
    >("none");
    const pushTransitionTimerRef = useRef(0);

    /*
 * ใช้ตรวจ transition:
 *
 * airborne -> grounded
 *
 * เพื่อรู้ว่า "เพิ่งลงถึงพื้น"
 */
    const {
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
    } = usePlayerJumpLanding();

    const stableGrounded = usePlayerGrounding({
        bodyRef,
        standingColliderRef,
        crouchingColliderRef,
        isCrouching,
        didJump,
        rapier,
    });

    // ==============================
    // Ledge State
    // ==============================

    // ตัวละครหันไปทางไหน
    // 1 = ขวา
    // -1 = ซ้าย
    const facingDirection =
        useRef<1 | -1>(1);

    const {
        isHanging,
        hangPosition,
        dropFromLedgeQueued,
        isEnteringHang,
        hangEntryTimer,
        isHangDropping,
        hangDropTimer,
        ledgeGrabCooldown,
        isClimbing,
        climbQueued,
        climbTimer,
        ledgeTopPosition,
        climbStartPosition,
        climbUpPosition,
        climbEndPosition,
        isRunJumpingUp,
        runJumpUpTimer,
        runJumpUpStartPosition,
        runJumpUpTopPosition,
        runJumpUpEndPosition,
        resetLedgeState,
    } = usePlayerLedgeTraversal();

    const setCrouchingColliderRef =
        useCallback((collider: RapierCollider | null) => {
            crouchingColliderRef.current = collider;

            if (!collider) {
                return;
            }

            if (isCrouching.current) {
                collider.setEnabled(true);
            } else {
                collider.setCollisionGroups(
                    INACTIVE_COLLISION_GROUPS,
                );
                collider.setEnabled(false);
            }
        }, []);


    const [
        animation,
        setAnimation,
    ] = useState<PlayerAnimation>(
        "Idle",
    );

    const currentAnimation =
        useRef<PlayerAnimation>("Idle");

    function changeAnimation(
        nextAnimation: PlayerAnimation,
    ) {
        if (
            currentAnimation.current ===
            nextAnimation
        ) {
            return;
        }

        currentAnimation.current =
            nextAnimation;

        setAnimation(nextAnimation);
    }

    // ==============================
    // Game Loop
    // ==============================

    useFrame((_, delta) => {
        const body = bodyRef.current;

        if (!body) {
            return;
        }

        const safeDelta = Math.min(
            delta,
            0.1,
        );

        const currentVelocity = body.linvel();

        // ============================
        // Scripted Map Exit
        // ============================
        if (mapExitTransition?.active) {
            // ============================
            // เริ่ม Transition
            // ============================

            if (!mapExitStarted.current) {
                mapExitStarted.current = true;
                mapExitCompleted.current = false;

                mapExitTimer.current = 0;
                mapExitStepIndex.current = 0;

                /*
                 * ล้าง Input
                 */
                keys.current.left = false;
                keys.current.right = false;
                keys.current.run = false;
                keys.current.crouch = false;

                jumpQueued.current = false;
            }

            // ============================
            // เดิน Transition เสร็จแล้ว
            // ============================

            if (mapExitCompleted.current) {
                body.setLinvel(
                    {
                        x: 0,
                        y: currentVelocity.y,
                        z: 0,
                    },
                    true,
                );

                return;
            }

            const steps =
                mapExitTransition.steps;

            const currentStep =
                steps[
                mapExitStepIndex.current
                ];

            // ============================
            // ไม่มี Step แล้ว = เสร็จ
            // ============================

            if (!currentStep) {
                mapExitCompleted.current = true;

                body.setLinvel(
                    {
                        x: 0,
                        y: currentVelocity.y,
                        z: 0,
                    },
                    true,
                );

                changeAnimation("Idle");

                onMapExitWalkComplete?.();

                return;
            }

            // ============================
            // เดิน Step ปัจจุบัน
            // ============================

            mapExitTimer.current += safeDelta;

            /*
             * หันตัวตาม Step
             */
            if (visualRef.current) {
                visualRef.current.rotation.y =
                    currentStep.rotationY;
            }

            /*
             * ใช้ Jog ตอนเดิน
             */
            changeAnimation("Jog");

            /*
             * เดินตาม X / Z ของ Step
             */
            body.setLinvel(
                {
                    x: currentStep.velocityX,
                    y: currentVelocity.y,
                    z: currentStep.velocityZ,
                },
                true,
            );

            // ============================
            // Step นี้เดินครบแล้ว
            // ============================

            if (
                mapExitTimer.current >=
                currentStep.duration
            ) {
                mapExitTimer.current = 0;

                mapExitStepIndex.current += 1;
            }

            return;
        }

        // ============================
        // Reset Map Exit
        // ============================

        if (mapExitStarted.current) {
            mapExitStarted.current = false;
            mapExitCompleted.current = false;

            mapExitTimer.current = 0;
            mapExitStepIndex.current = 0;
        }

        /*
         * เข้า Map ใหม่แล้ว Reset
         */
        if (mapExitStarted.current) {
            mapExitStarted.current = false;
            mapExitCompleted.current = false;
            mapExitTimer.current = 0;
        }

        const isTouchingDownThisFrame =
            !wasGrounded.current &&
            stableGrounded.current;

        groundTransitionStartedThisFrame.current = false;

        // ============================
        // Map Enter Transition
        // ============================

        if (mapEnterTransition?.active) {
            if (!mapEnterStarted.current) {
                mapEnterStarted.current = true;
                mapEnterCompleted.current = false;

                mapEnterTimer.current = 0;
                mapEnterStepIndex.current = 0;

                // ล้าง input เก่า
                keys.current.left = false;
                keys.current.right = false;
                keys.current.run = false;
                keys.current.crouch = false;

                jumpQueued.current = false;
            }

            // ==========================
            // Script จบแล้ว
            // ==========================

            if (mapEnterCompleted.current) {
                body.setLinvel(
                    {
                        x: 0,
                        y: currentVelocity.y,
                        z: 0,
                    },
                    true,
                );

                return;
            }

            const steps =
                mapEnterTransition.steps;

            const currentStep =
                steps[
                mapEnterStepIndex.current
                ];

            // ==========================
            // ไม่มี Step เหลือแล้ว
            // ==========================

            if (!currentStep) {
                mapEnterCompleted.current =
                    true;

                body.setLinvel(
                    {
                        x: 0,
                        y: currentVelocity.y,
                        z: 0,
                    },
                    true,
                );

                changeAnimation("Idle");

                onMapEnterWalkComplete?.();

                return;
            }

            mapEnterTimer.current +=
                safeDelta;

            // ==========================
            // หันทิศ
            // ==========================

            if (visualRef.current) {
                visualRef.current.rotation.y =
                    currentStep.rotationY;
            }

            // ==========================
            // เดินเข้าฉาก
            // ==========================

            changeAnimation("Jog");

            body.setLinvel(
                {
                    x: currentStep.velocityX,
                    y: currentVelocity.y,
                    z: currentStep.velocityZ,
                },
                true,
            );

            const enterPosition =
                body.translation();

            const enterDirection =
                currentStep.velocityX > 0
                    ? 1
                    : currentStep.velocityX < 0
                        ? -1
                        : 0;

            updateCamera({
                position: enterPosition,
                isMoving: true,
                direction: enterDirection,
                isRunning: false,
                safeDelta,
            });

            // ==========================
            // Step ต่อไป
            // ==========================

            if (
                mapEnterTimer.current >=
                currentStep.duration
            ) {
                mapEnterTimer.current = 0;

                mapEnterStepIndex.current += 1;
            }

            return;
        }

        // ============================
        // Reset Map Enter
        // ============================

        if (mapEnterStarted.current) {
            mapEnterStarted.current = false;
            mapEnterCompleted.current = false;

            mapEnterTimer.current = 0;
            mapEnterStepIndex.current = 0;
        }

        // ============================
        // Controls Locked
        // Puzzle / Menu / Cutscene
        // ============================

        if (controlsLocked) {
            /*
             * ล้าง input ที่ค้างอยู่
             */
            keys.current.left = false;
            keys.current.right = false;
            keys.current.run = false;
            keys.current.crouch = false;

            jumpQueued.current = false;
            crouchPressed.current = false;

            /*
             * หยุดการเคลื่อนที่แนวนอน
             * แต่ยังให้ Gravity ทำงานได้
             */
            body.setLinvel(
                {
                    x: 0,
                    y: currentVelocity.y,
                    z: 0,
                },
                true,
            );

            /*
             * ถ้ายืนปกติให้ Idle
             */
            if (
                stableGrounded.current &&
                !isCrouching.current
            ) {
                changeAnimation("Idle");
            }

            return;
        }

        // ============================
        // Direction
        // ============================
        let direction = 0;

        if (keys.current.left) {
            direction -= 1;
        }

        if (keys.current.right) {
            direction += 1;
        }

        const isMoving = direction !== 0;
        const requestedFacingDirection:
            1 | -1 | null =
            direction > 0
                ? 1
                : direction < 0
                    ? -1
                    : null;

        // ============================
        // Push State Transition
        // ============================

        if (
            !prevIsPushingRef.current &&
            isPushing
        ) {
            pushTransitionStateRef.current =
                "start";

            pushTransitionTimerRef.current =
                0.6;

            // ห้าม input เก่าค้างแล้วทำงานหลังจับ
            jumpQueued.current = false;

            exitCrouchState();

            clearGroundTransition();

            climbQueued.current = false;
            dropFromLedgeQueued.current = false;

            // หันหน้าหา Object ตอนเริ่มจับ
            facingDirection.current =
                pushState.facingDirection;

            if (visualRef.current) {
                visualRef.current.rotation.y =
                    pushState.facingDirection > 0
                        ? Math.PI / 2
                        : -Math.PI / 2;
            }
        }

        else if (
            prevIsPushingRef.current &&
            !isPushing
        ) {
            pushTransitionStateRef.current =
                "stop";

            pushTransitionTimerRef.current =
                0.5;
        }

        prevIsPushingRef.current =
            isPushing;

        if (
            pushTransitionTimerRef.current > 0
        ) {
            pushTransitionTimerRef.current -=
                safeDelta;

            if (
                pushTransitionTimerRef.current <= 0
            ) {
                pushTransitionTimerRef.current =
                    0;

                if (
                    pushTransitionStateRef.current ===
                    "start"
                ) {
                    pushTransitionStateRef.current =
                        "pushing";
                }

                else if (
                    pushTransitionStateRef.current ===
                    "stop"
                ) {
                    pushTransitionStateRef.current =
                        "none";
                }
            }
        }

        // ============================
        // Crouch
        // ============================

        const wantsCrouchedSprint =
            keys.current.crouch &&
            keys.current.run &&
            isMoving;

        if (!wantsCrouchedSprint) {
            crouchSprintOverride.current = false;
        }

        /*
         * Crouch + Sprint เป็น transition ลุกขึ้นวิ่งหนึ่งครั้ง
         * สลับกลับ Standing collider ก่อนเริ่มคลิปเพื่อให้ปลายท่า
         * ตรงกับ Spint และไม่ฝังโมเดลไว้กับ collider ย่อ
         */
        if (
            wantsCrouchedSprint &&
            !crouchSprintOverride.current &&
            isCrouching.current &&
            stableGrounded.current &&
            !isTouchingDownThisFrame &&
            !jumpQueued.current &&
            !crouchPressed.current &&
            !isSliding.current &&
            !isHanging.current &&
            !isHangDropping.current &&
            !isClimbing.current &&
            !isRunJumpingUp.current &&
            !isPushing &&
            landingTimer.current <= 0 &&
            groundTransition.current === null &&
            ceilingContacts.current === 0 &&
            requestedFacingDirection !== null
        ) {
            manualCrouchActive.current = false;
            standFromManualCrouchQueued.current =
                false;
            keys.current.crouch = false;
            setCrouching(false);

            if (!isCrouching.current) {
                crouchSprintOverride.current = true;
                facingDirection.current =
                    requestedFacingDirection;

                if (visualRef.current) {
                    visualRef.current.rotation.y =
                        requestedFacingDirection > 0
                            ? Math.PI / 2
                            : -Math.PI / 2;
                }

                startGroundTransition(
                    "CrouchedSpinting",
                );
            }
        }

        if (
            !isPushing &&
            keys.current.crouch &&
            !wantsCrouchedSprint &&
            !crouchSprintOverride.current &&
            !isCrouching.current &&
            stableGrounded.current &&
            !isTouchingDownThisFrame &&
            landingTimer.current <= 0 &&
            groundTransition.current === null
        ) {
            setCrouching(true);

            if (isCrouching.current) {
                manualCrouchActive.current = true;
            }
        }

        /*
         * ถ้ากด crouch ระหว่าง grounded one-shot ให้คิว input ไว้
         * แล้วค่อยสลับ collider หลังคลิปจบ เพื่อไม่ให้ pose ยืน
         * เล่นอยู่บน collider ย่อ
         */

        if (
            !keys.current.crouch &&
            isCrouching.current &&
            !isSliding.current &&
            !isTouchingDownThisFrame &&
            landingTimer.current <= 0
        ) {
            /*
             * ถ้าไม่มีอะไรอยู่เหนือหัว
             * ถึงจะยืนได้
             */
            if (
                ceilingContacts.current === 0 &&
                (
                    groundTransition.current ===
                    null ||
                    groundTransition.current ===
                    "CrouchedStanding"
                )
            ) {
                const shouldPlayManualStand =
                    standFromManualCrouchQueued.current &&
                    manualCrouchActive.current &&
                    stableGrounded.current &&
                    !isTouchingDownThisFrame &&
                    !jumpQueued.current &&
                    !isSliding.current &&
                    !isHanging.current &&
                    !isHangDropping.current &&
                    !isClimbing.current &&
                    !isRunJumpingUp.current &&
                    landingTimer.current <= 0 &&
                    groundTransition.current === null;

                setCrouching(false);

                if (!isCrouching.current) {
                    manualCrouchActive.current = false;
                    standFromManualCrouchQueued.current =
                        false;

                    if (shouldPlayManualStand) {
                        startGroundTransition(
                            "CrouchedStanding",
                        );
                    }
                }
            }
        }

        if (isMoving) {
            runStopInputTimer.current = 0;
        } else if (
            stableGrounded.current &&
            groundTransition.current === null &&
            currentAnimation.current ===
            "Spint"
        ) {
            runStopInputTimer.current +=
                safeDelta;
        } else {
            runStopInputTimer.current = 0;
        }

        /*
         * Jump และ traversal มี priority สูงกว่า grounded one-shot
         * จึงยกเลิก transition เดิมทันทีที่ขอกระโดด
         */
        if (
            jumpQueued.current &&
            groundTransition.current !== null
        ) {
            clearGroundTransition();
        }

        const activeGroundTransition =
            groundTransition.current;

        if (
            activeGroundTransition !== null &&
            !groundTransitionStartedThisFrame.current &&
            currentAnimation.current ===
            activeGroundTransition
        ) {
            groundTransitionTimer.current +=
                safeDelta;

            const transitionDuration =
                GROUND_TRANSITION_DURATIONS[
                activeGroundTransition
                ];

            if (
                groundTransitionTimer.current >=
                transitionDuration
            ) {
                clearGroundTransition();

                /*
                 * ถ้ากด C คิวไว้ระหว่าง one-shot ให้เข้า crouch ทันที
                 * ในเฟรมที่คลิปจบ ไม่ปล่อย Spint/Jog แทรกหนึ่งเฟรม
                 */
                if (
                    !isPushing &&
                    keys.current.crouch &&
                    !wantsCrouchedSprint &&
                    !crouchSprintOverride.current &&
                    !isCrouching.current &&
                    stableGrounded.current &&
                    !isTouchingDownThisFrame &&
                    ceilingContacts.current === 0
                ) {
                    setCrouching(true);

                    if (isCrouching.current) {
                        manualCrouchActive.current =
                            true;
                    }
                }
            }
        }

        if (
            direction > 0 &&
            currentVelocity.x >= -0.05 &&
            !isHanging.current &&
            !isClimbing.current &&
            !isRunJumpingUp.current &&
            !isSliding.current &&
            groundTransition.current === null
        ) {
            facingDirection.current = 1;
        }

        if (
            direction < 0 &&
            currentVelocity.x <= 0.05 &&
            !isHanging.current &&
            !isClimbing.current &&
            !isRunJumpingUp.current &&
            !isSliding.current &&
            groundTransition.current === null
        ) {
            facingDirection.current = -1;
        }

        // ============================
        // Speed
        // ============================

        let maxSpeed = JOG_SPEED;

        // ตอนย่อใช้ความเร็ว crouch จนกว่าจะเริ่ม transition ลุกวิ่ง
        if (isCrouching.current) {
            maxSpeed = CROUCH_SPEED;
        } else if (isPushing) {
            maxSpeed = PUSH_PLAYER_SPEED;
        } else if (keys.current.run) {
            maxSpeed = RUN_SPEED;
        }

        const isRunStopping =
            groundTransition.current ===
            "RunStop";

        const targetVelocityX =
            isRunStopping
                ? 0
                : direction * maxSpeed;

        /*
         * acceleration / deceleration
         */
        const movementSmoothing =
            1 - Math.exp(-14 * safeDelta);

        const isReversingVelocity =
            !isPushing &&
            stableGrounded.current &&
            !isCrouching.current &&
            direction !== 0 &&
            currentVelocity.x * direction < 0;

        let velocityX =
            isReversingVelocity
                ? moveTowards(
                    currentVelocity.x,
                    0,
                    REVERSE_BRAKE_ACCELERATION *
                    safeDelta,
                )
                : THREE.MathUtils.lerp(
                    currentVelocity.x,
                    targetVelocityX,
                    movementSmoothing,
                );

        let velocityY =
            currentVelocity.y;

        if (
            stableGrounded.current &&
            !didJump.current
        ) {
            lastGroundFootY.current =
                body.translation().y -
                PLAYER_FOOT_OFFSET;
        }

        // ============================
        // Sprint -> Slide
        // ============================

        const currentHorizontalSpeed =
            Math.abs(currentVelocity.x);

        let startedSlideThisFrame = false;

        if (
            crouchPressed.current &&
            keys.current.run &&
            isMoving &&
            currentAnimation.current === "Spint" &&
            !isPushing &&
            !isSliding.current &&
            stableGrounded.current &&
            groundTransition.current === null &&
            !isTouchingDownThisFrame &&
            !isHanging.current &&
            !isClimbing.current &&
            !isRunJumpingUp.current &&
            currentHorizontalSpeed >=
            SLIDE_MIN_ENTRY_SPEED
        ) {
            const nextSlideDirection =
                currentVelocity.x >= 0
                    ? 1
                    : -1;

            slideDirection.current =
                nextSlideDirection;
            facingDirection.current =
                nextSlideDirection;

            if (visualRef.current) {
                visualRef.current.rotation.y =
                    nextSlideDirection > 0
                        ? Math.PI / 2
                        : -Math.PI / 2;
            }

            isSliding.current = true;
            slideTimer.current = 0;
            startedSlideThisFrame = true;
            clearGroundTransition();
            manualCrouchActive.current = false;
            standFromManualCrouchQueued.current =
                false;

            if (!isCrouching.current) {
                setCrouching(true);
            }
        }

        if (isSliding.current) {
            /*
             * เริ่ม clock หลังเฟรมที่ resolver เปลี่ยนเป็น RunningSlide
             * เพื่อให้ physics และ AnimationAction เริ่มพร้อมกัน
             */
            if (!startedSlideThisFrame) {
                slideTimer.current += delta;
            }

            const speedAlongSlide =
                startedSlideThisFrame
                    ? Math.max(
                        currentHorizontalSpeed,
                        SLIDE_MIN_INITIAL_SPEED,
                    )
                    : Math.max(
                        0,
                        currentVelocity.x *
                        slideDirection.current,
                    );

            const nextSlideSpeed =
                speedAlongSlide *
                Math.exp(
                    -SLIDE_DRAG * safeDelta,
                );

            velocityX =
                slideDirection.current *
                nextSlideSpeed;

            const shouldEndSlide =
                !stableGrounded.current ||
                nextSlideSpeed <=
                SLIDE_BLOCKED_SPEED ||
                slideTimer.current >=
                SLIDE_DURATION;

            if (shouldEndSlide) {
                isSliding.current = false;
                slideTimer.current = 0;

                keys.current.crouch = false;
                if (
                    ceilingContacts.current === 0
                ) {
                    setCrouching(false);
                    manualCrouchActive.current = false;
                    standFromManualCrouchQueued.current =
                        false;
                } else {
                    manualCrouchActive.current = true;
                    standFromManualCrouchQueued.current =
                        true;
                }
            }
        }

        crouchPressed.current = false;

        const grounded = stableGrounded.current;

        // ============================
        // Ledge / Hang
        // ============================

        // ลด cooldown
        if (ledgeGrabCooldown.current > 0) {
            ledgeGrabCooldown.current -=
                safeDelta;
        }

        // ============================
        // Hang Input
        // ============================

        if (isHanging.current) {
            // Space หรือ W = ปีนขึ้น
            if (
                jumpQueued.current ||
                climbInputQueued.current
            ) {
                climbQueued.current = true;
                jumpQueued.current = false;
            }

            // S / ArrowDown = ปล่อยขอบ
            if (dropInputQueued.current) {
                dropFromLedgeQueued.current =
                    true;
            }
        }

        // input แบบ one-shot
        climbInputQueued.current = false;
        dropInputQueued.current = false;

        // ============================
        // ปล่อยขอบ
        // ============================

        if (
            isHanging.current &&
            dropFromLedgeQueued.current
        ) {
            isHanging.current = false;
            isEnteringHang.current = false;
            hangEntryTimer.current = 0;

            isHangDropping.current = true;
            hangDropTimer.current = 0;

            dropFromLedgeQueued.current =
                false;
            climbQueued.current = false;

            ledgeGrabCooldown.current =
                LEDGE_REGRAB_COOLDOWN;

            // เปิด Gravity กลับมา
            body.setGravityScale(
                1,
                true,
            );

            velocityX = 0;
            velocityY = -1;
        }

        if (isHangDropping.current) {
            hangDropTimer.current +=
                safeDelta;

            if (
                hangDropTimer.current >=
                HANG_DROP_DURATION
            ) {
                isHangDropping.current = false;
                hangDropTimer.current = 0;
            }
        }

        // ============================
        // เริ่ม Climb
        // ============================

        if (
            isHanging.current &&
            climbQueued.current &&
            !isEnteringHang.current
        ) {
            climbQueued.current = false;
            dropFromLedgeQueued.current =
                false;

            isHanging.current = false;
            isClimbing.current = true;

            isHangDropping.current = false;
            hangDropTimer.current = 0;

            isSliding.current = false;
            slideTimer.current = 0;
            clearGroundTransition();

            climbTimer.current = 0;

            const facing =
                facingDirection.current;

            const top =
                ledgeTopPosition.current;

            // จุดเริ่ม
            climbStartPosition.current = {
                ...hangPosition.current,
            };

            /*
             * Phase 1:
             *
             * ขึ้นตรง ๆ ก่อน
             * ยังไม่เข้าไปใน Platform
             *
             * จะช่วยไม่ให้ Collider
             * วิ่งทะลุกำแพงระหว่างปีน
             */
            climbUpPosition.current = {
                x: hangPosition.current.x,

                y:
                    top.y +
                    STANDING_BODY_TO_FOOT,

                z: 0,
            };

            /*
             * Phase 2:
             *
             * เมื่อสูงกว่าขอบแล้ว
             * ค่อยเลื่อนเข้าไปบน Platform
             */
            climbEndPosition.current = {
                x:
                    top.x +
                    facing *
                    CLIMB_FORWARD_DISTANCE,

                y:
                    top.y +
                    STANDING_BODY_TO_FOOT,

                z: 0,
            };

            body.setGravityScale(
                0,
                true,
            );

            body.setLinvel(
                {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                true,
            );

            landingTimer.current = 0;
            jumpQueued.current = false;
        }

        // ============================
        // กำลัง Climb
        // ============================

        if (isClimbing.current) {
            climbTimer.current +=
                safeDelta;

            const progress =
                Math.min(
                    climbTimer.current /
                    CLIMB_DURATION,
                    1,
                );

            let x: number;
            let y: number;

            /*
             * 65% แรก
             * ยกตัวขึ้น
             */
            if (progress < 0.65) {
                const phase =
                    progress / 0.65;

                /*
                 * smoothstep
                 * ไม่ให้เริ่ม/หยุดแข็งเกิน
                 */
                const smooth =
                    phase *
                    phase *
                    (3 - 2 * phase);

                x =
                    THREE.MathUtils.lerp(
                        climbStartPosition
                            .current.x,
                        climbUpPosition
                            .current.x,
                        smooth,
                    );

                y =
                    THREE.MathUtils.lerp(
                        climbStartPosition
                            .current.y,
                        climbUpPosition
                            .current.y,
                        smooth,
                    );
            }

            /*
             * 35% หลัง
             * ขยับเข้า Platform
             */
            else {
                const phase =
                    (progress - 0.65) /
                    0.35;

                const smooth =
                    phase *
                    phase *
                    (3 - 2 * phase);

                x =
                    THREE.MathUtils.lerp(
                        climbUpPosition
                            .current.x,
                        climbEndPosition
                            .current.x,
                        smooth,
                    );

                y =
                    THREE.MathUtils.lerp(
                        climbUpPosition
                            .current.y,
                        climbEndPosition
                            .current.y,
                        smooth,
                    );
            }

            body.setTranslation(
                {
                    x,
                    y,
                    z: 0,
                },
                true,
            );

            body.setLinvel(
                {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                true,
            );

            velocityX = 0;
            velocityY = 0;

            jumpQueued.current = false;

            // ========================
            // Climb เสร็จ
            // ========================

            if (progress >= 1) {
                isClimbing.current = false;

                body.setTranslation(
                    climbEndPosition.current,
                    true,
                );

                body.setLinvel(
                    {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    true,
                );

                // เปิด Gravity กลับ
                body.setGravityScale(
                    1,
                    true,
                );

                /*
                 * จุดปลายวางก้น collider บนผิว Platform พอดี
                 * ล็อก traversal นี้เป็น grounded จน physics step ถัดไป
                 * ตรวจยืนยันด้วย contact/ray เพื่อไม่คั่น Jump/Landing ปลอม
                 */
                stableGrounded.current = true;
                wasGrounded.current = true;
                didJump.current = false;
                jumpStartedRunning.current = false;
                highFallActive.current = false;

                /*
                 * กันตรวจเจอ Ledge
                 * เดิมทันที
                 */
                ledgeGrabCooldown.current =
                    LEDGE_REGRAB_COOLDOWN;

                landingTimer.current = 0;
            }
        }

        // ============================
        // Run Jump Up: ขอบเตี้ย
        // ============================

        if (isRunJumpingUp.current) {
            runJumpUpTimer.current +=
                safeDelta;

            const progress = Math.min(
                runJumpUpTimer.current /
                RUN_JUMP_UP_DURATION,
                1,
            );

            let nextPosition: {
                x: number;
                y: number;
                z: number;
            };

            if (progress < 0.6) {
                const phase = progress / 0.6;
                const smooth =
                    phase *
                    phase *
                    (3 - 2 * phase);

                nextPosition = {
                    x:
                        runJumpUpStartPosition
                            .current.x,
                    y: THREE.MathUtils.lerp(
                        runJumpUpStartPosition
                            .current.y,
                        runJumpUpTopPosition
                            .current.y,
                        smooth,
                    ),
                    z: 0,
                };
            } else {
                const phase =
                    (progress - 0.6) /
                    0.4;
                const smooth =
                    phase *
                    phase *
                    (3 - 2 * phase);

                nextPosition = {
                    x: THREE.MathUtils.lerp(
                        runJumpUpTopPosition
                            .current.x,
                        runJumpUpEndPosition
                            .current.x,
                        smooth,
                    ),
                    y:
                        runJumpUpEndPosition
                            .current.y,
                    z: 0,
                };
            }

            body.setTranslation(
                nextPosition,
                true,
            );
            body.setLinvel(
                { x: 0, y: 0, z: 0 },
                true,
            );

            velocityX = 0;
            velocityY = 0;
            jumpQueued.current = false;

            if (progress >= 1) {
                isRunJumpingUp.current = false;
                runJumpUpTimer.current = 0;

                body.setTranslation(
                    runJumpUpEndPosition.current,
                    true,
                );
                body.setGravityScale(1, true);

                stableGrounded.current = true;
                wasGrounded.current = true;
                didJump.current = false;
                jumpStartedRunning.current =
                    false;
                highFallActive.current = false;
                landingTimer.current = 0;
                ledgeGrabCooldown.current =
                    LEDGE_REGRAB_COOLDOWN;
            }
        }

        // ============================
        // กำลัง Hang
        // ============================

        if (isHanging.current) {
            if (isEnteringHang.current) {
                hangEntryTimer.current +=
                    safeDelta;

                if (
                    hangEntryTimer.current >=
                    JUMP_HANG_DURATION
                ) {
                    isEnteringHang.current =
                        false;
                    hangEntryTimer.current = 0;
                }
            }

            /*
             * ล็อก Body ไว้ที่ขอบ
             */
            body.setTranslation(
                hangPosition.current,
                true,
            );

            velocityX = 0;
            velocityY = 0;

            /*
             * ตอน Hang ห้าม Jump เดิมทำงาน
             */
            jumpQueued.current = false;
        }

        // ============================
        // หา Ledge
        // ============================

        else if (
            !isPushing &&
            !isClimbing.current &&
            !isRunJumpingUp.current &&
            (
                !grounded ||
                (
                    didJump.current &&
                    velocityY >
                    TAKEOFF_GROUND_IGNORE_VELOCITY
                )
            ) &&
            (
                velocityY <= 0 ||
                (
                    didJump.current &&
                    velocityY >
                    TAKEOFF_GROUND_IGNORE_VELOCITY
                )
            ) &&
            ledgeGrabCooldown.current <= 0
        ) {
            const playerPosition =
                body.translation();

            const facing =
                facingDirection.current;

            // ========================
            // Ray 1
            // ยิงระดับตัว
            // ต้องเจอกำแพง
            // ========================

            const wallRay =
                new rapier.Ray(
                    {
                        x: playerPosition.x,
                        y:
                            playerPosition.y +
                            LEDGE_LOWER_RAY_Y,
                        z: playerPosition.z,
                    },
                    {
                        x: facing,
                        y: 0,
                        z: 0,
                    },
                );

            // ========================
            // Ray 2
            // ยิงระดับหัว
            // ต้องไม่เจอกำแพง
            // ========================

            const upperRay =
                new rapier.Ray(
                    {
                        x: playerPosition.x,
                        y:
                            playerPosition.y +
                            LEDGE_UPPER_RAY_Y,
                        z: playerPosition.z,
                    },
                    {
                        x: facing,
                        y: 0,
                        z: 0,
                    },
                );

            /*
             * EXCLUDE_SENSORS
             *
             * ไม่ให้ Ray ไปโดนพวก
             * Ground Sensor
             * Interaction Sensor
             * ฯลฯ
             */
            const queryFlags =
                rapier.QueryFilterFlags
                    .EXCLUDE_SENSORS;

            const wallHit =
                world.castRay(
                    wallRay,
                    LEDGE_FORWARD_DISTANCE,
                    true,
                    queryFlags,
                    undefined,
                    undefined,

                    // ไม่ให้ Ray ชน Player เอง
                    body,
                );

            const upperHit =
                world.castRay(
                    upperRay,
                    LEDGE_FORWARD_DISTANCE,
                    true,
                    queryFlags,
                    undefined,
                    undefined,
                    body,
                );

            /*
             * ลักษณะที่เราต้องการ:
             *
             * Upper Ray → ไม่เจออะไร
             *
             *      ─────→
             *     🧍
             *      ─────→ █  ← Lower เจอกำแพง
             *             █
             */
            if (
                wallHit &&
                !upperHit
            ) {
                const wallPoint =
                    wallRay.pointAt(
                        wallHit.timeOfImpact,
                    );

                // ========================
                // Ray 3
                // ยิงลงเพื่อหาพื้นบนขอบ
                // ========================

                const topRay =
                    new rapier.Ray(
                        {
                            /*
                             * ข้ามเข้าไปด้านใน
                             * platform นิดหนึ่ง
                             */
                            x:
                                wallPoint.x +
                                facing * 0.12,

                            y:
                                playerPosition.y +
                                LEDGE_TOP_RAY_Y,

                            z:
                                playerPosition.z,
                        },
                        {
                            x: 0,
                            y: -1,
                            z: 0,
                        },
                    );

                const topHit =
                    world.castRay(
                        topRay,
                        LEDGE_TOP_RAY_DISTANCE,
                        true,
                        queryFlags,
                        undefined,
                        undefined,
                        body,
                    );

                if (topHit) {
                    const topPoint =
                        topRay.pointAt(
                            topHit.timeOfImpact,
                        );

                    ledgeTopPosition.current = {
                        x: topPoint.x,
                        y: topPoint.y,
                        z: topPoint.z,
                    };

                    const ledgeHeight = topPoint.y - lastGroundFootY.current;

                    const currentFootY = playerPosition.y - PLAYER_FOOT_OFFSET;

                    // ระยะที่ตกจากพื้นล่าสุด
                    const passiveFallDistance = Math.max(
                        0,
                        lastGroundFootY.current -
                        currentFootY,
                    );

                    // ขอบที่กำลังตรวจอยู่เป็นขอบเดิม
                    // ที่เราเพิ่งเดินตกลงมาหรือไม่
                    const isSameLevelLedge = Math.abs(ledgeHeight) <= SAME_LEDGE_HEIGHT_TOLERANCE;

                    /*
                     * ถ้าเกิดจาก Jump:
                     * → อนุญาตให้จับขอบตามระบบเดิม
                     *
                     * ถ้าแค่เดินตก:
                     * → ต้องตกไกลพอ
                     * → และห้ามเป็นขอบระดับเดิมที่เพิ่งตกมา
                     */
                    const canGrabLedgeFromFall = didJump.current || (
                        passiveFallDistance >= MIN_PASSIVE_LEDGE_GRAB_FALL_DISTANCE
                        && !isSameLevelLedge
                    );

                    const shouldRunJumpUp = didJump.current
                        && ledgeHeight <= RUN_JUMP_UP_MAX_LEDGE_HEIGHT;

                    if (shouldRunJumpUp) {
                        isSliding.current = false;
                        slideTimer.current = 0;
                        clearGroundTransition();

                        const targetBodyY = topPoint.y + STANDING_BODY_TO_FOOT;

                        isRunJumpingUp.current = true;
                        runJumpUpTimer.current = 0;
                        body.setGravityScale(0, true);

                        /*
                         * ล็อก state ก่อน resolver ด้านล่างทันที
                         * เพื่อไม่ให้มี Jog / Run คั่นหนึ่งเฟรม
                         */
                        stableGrounded.current = false;

                        runJumpUpStartPosition.current = {
                            x: playerPosition.x,
                            y: playerPosition.y,
                            z: 0,
                        };

                        runJumpUpTopPosition.current = {
                            x: playerPosition.x,
                            y: targetBodyY,
                            z: 0,
                        };

                        runJumpUpEndPosition.current = {
                            x:
                                wallPoint.x +
                                facing *
                                (
                                    PLAYER_RADIUS +
                                    0.12
                                ),
                            y: targetBodyY,
                            z: 0,
                        };
                    } else if (velocityY <= 0 && canGrabLedgeFromFall) {
                        isSliding.current = false;
                        slideTimer.current = 0;
                        clearGroundTransition();

                        /*
                         * ขอบสูง: จับขอบก่อน แล้วค่อยเปลี่ยน
                         * JumpHang -> HangingIdle
                         */
                        isHanging.current = true;
                        isEnteringHang.current = true;
                        hangEntryTimer.current = 0;
                        body.setGravityScale(0, true);

                        isHangDropping.current = false;
                        hangDropTimer.current = 0;

                        hangPosition.current = {
                            x:
                                wallPoint.x -
                                facing *
                                HANG_DISTANCE_FROM_WALL,
                            y:
                                topPoint.y -
                                HANG_BODY_BELOW_LEDGE,
                            z: 0,
                        };

                        body.setTranslation(
                            hangPosition.current,
                            true,
                        );

                        /*
                         * เมื่อจับขอบสำเร็จ Jump รอบเดิมจบแล้ว
                         * เพื่อให้ปล่อยจากขอบสูงเข้า Falling ได้
                         */
                        didJump.current = false;
                        jumpStartedRunning.current =
                            false;
                        highFallActive.current = false;
                    }

                    if (
                        shouldRunJumpUp ||
                        isHanging.current
                    ) {
                        velocityX = 0;
                        velocityY = 0;

                        groundContacts.current =
                            0;

                        landingTimer.current =
                            0;

                        jumpQueued.current =
                            false;
                    }
                }
            }
        }

        // ============================
        // Jump
        // ============================

        if (
            isSliding.current &&
            jumpQueued.current &&
            ceilingContacts.current === 0
        ) {
            isSliding.current = false;
            slideTimer.current = 0;
        }

        const groundedBeforeJump =
            stableGrounded.current;

        let jumpedThisFrame = false;

        /*
         * ถ้ากดกระโดดตอนย่อและด้านบนว่าง
         * ให้ลุกก่อนเริ่ม Jump อัตโนมัติ
         * แต่ยังคงบล็อกไว้เมื่อมีเพดานจริง
         */
        if (
            !isPushing &&
            jumpQueued.current &&
            groundedBeforeJump &&
            landingTimer.current <= 0 &&
            isCrouching.current &&
            ceilingContacts.current === 0
        ) {
            keys.current.crouch = false;
            manualCrouchActive.current = false;
            standFromManualCrouchQueued.current =
                false;
            setCrouching(false);
        }

        // กด Space แล้ว Takeoff ทันที
        if (
            !isPushing &&
            jumpQueued.current &&
            groundedBeforeJump &&
            landingTimer.current <= 0 &&
            !isCrouching.current
        ) {
            /*
             * จำว่าตอนเริ่มกระโดด
             * กำลังวิ่งหรือไม่
             */
            jumpStartedRunning.current =
                (
                    currentAnimation.current ===
                    "Jog" ||
                    currentAnimation.current ===
                    "Spint" ||
                    (
                        isMoving &&
                        keys.current.run
                    )
                );

            /*
             * บอกระบบว่า Jump รอบนี้
             * เกิดจากการกด Space
             */
            didJump.current = true;
            highFallActive.current = false;

            landingTimer.current = 0;

            velocityY = JUMP_SPEED;
            jumpedThisFrame = true;

            /*
             * กัน Double Jump
             */
            groundContacts.current = 0;
            stableGrounded.current = false;
        }

        jumpQueued.current = false;

        const animationGrounded =
            jumpedThisFrame
                ? false
                : stableGrounded.current;

        const highFallBeforeGroundReset =
            highFallActive.current;

        if (animationGrounded) {
            isHangDropping.current = false;
            hangDropTimer.current = 0;
        }

        if (
            animationGrounded ||
            isHanging.current ||
            isClimbing.current
        ) {
            highFallActive.current = false;
        }

        // ============================
        // ตรวจพื้นล่วงหน้าสำหรับ Landing
        // ============================

        let shouldPreLand = false;

        if (
            !animationGrounded &&
            velocityY < 0
        ) {
            const playerPosition =
                body.translation();

            const ray = new rapier.Ray(
                {
                    x: playerPosition.x,
                    y: playerPosition.y,
                    z: playerPosition.z,
                },
                {
                    x: 0,
                    y: -1,
                    z: 0,
                },
            );

            const maxRayDistance =
                PLAYER_FOOT_OFFSET +
                Math.max(
                    LAND_PREP_DISTANCE,
                    HIGH_FALL_MIN_CLEARANCE,
                );

            const hit =
                world.castRayAndGetNormal(
                    ray,
                    maxRayDistance,
                    true,
                    rapier.QueryFilterFlags
                        .EXCLUDE_SENSORS,
                    undefined,
                    undefined,

                    // ไม่ให้ Ray ชน Player เอง
                    body,
                );

            const hasWalkableGround =
                hit !== null &&
                hit.normal.y >=
                MIN_GROUND_SUPPORT_NORMAL_Y;

            const distanceFromFeet =
                hasWalkableGround
                    ? hit.timeOfImpact -
                    PLAYER_FOOT_OFFSET
                    : Number.POSITIVE_INFINITY;

            shouldPreLand =
                hasWalkableGround &&
                distanceFromFeet <=
                LAND_PREP_DISTANCE;

            /*
             * ไม่ใช้ Falling กับการกด Jump ตามที่ออกแบบไว้
             * และไม่ใช้กับการตกเตี้ยที่ยังเห็นพื้นอยู่ในระยะ
             */
            if (
                !didJump.current &&
                velocityY <=
                HIGH_FALL_START_VELOCITY &&
                distanceFromFeet >
                HIGH_FALL_MIN_CLEARANCE
            ) {
                highFallActive.current = true;
            }
        }

        // ============================
        // Landing Detection
        // ============================

        /*
         * frame ก่อนหน้า = airborne
         * frame ปัจจุบัน = grounded
         *
         * แปลว่าเพิ่งแตะพื้น
         */
        const justLanded =
            !wasGrounded.current &&
            animationGrounded;

        if (justLanded) {
            landingAnimation.current =
                highFallBeforeGroundReset
                    ? "HardLanding"
                    : "Landing";

            landingTimer.current =
                highFallBeforeGroundReset
                    ? HARD_LANDING_DURATION
                    : LAND_DURATION;

            /*
             * Jump รอบนี้จบแล้ว
             */
            didJump.current = false;

            jumpStartedRunning.current =
                false;
        }

        /*
         * ลดเวลา Landing
         */
        if (
            landingTimer.current > 0 &&
            !justLanded &&
            currentAnimation.current ===
            landingAnimation.current
        ) {
            landingTimer.current =
                Math.max(
                    0,
                    landingTimer.current -
                    safeDelta,
                );
        }

        /*
         * ลงจาก Jump ปกติขณะยังถือทิศ ให้ต่อ Jog/Spint ทันที
         * ไม่ล็อกความเร็วหรือคั่นด้วย Landing จน movement สะดุด
         * แต่ HardLanding จากการตกสูงยังคงเป็น one-shot เต็มคลิป
         */
        if (
            animationGrounded &&
            isMoving &&
            landingAnimation.current ===
            "Landing"
        ) {
            landingTimer.current = 0;
        }

        // ============================
        // Animation State
        // ============================

        const isRunning =
            !isPushing &&
            isMoving &&
            keys.current.run &&
            !isCrouching.current;

        const isJogging =
            !isPushing &&
            isMoving &&
            !keys.current.run &&
            !isCrouching.current;

        const isWaitingForRunStop =
            groundTransition.current === null &&
            animationGrounded &&
            !isMoving &&
            !isCrouching.current &&
            runStopInputTimer.current > 0 &&
            runStopInputTimer.current <
            RUN_STOP_INPUT_GRACE &&
            currentAnimation.current ===
            "Spint";

        /*
         * Traversal, slide และ airborne มี priority สูงกว่า
         * grounded one-shot และต้องไม่ปล่อย transition เก่ากลับมาเล่นซ้ำ
         */
        if (
            groundTransition.current !== null &&
            (
                !animationGrounded ||
                isRunJumpingUp.current ||
                isClimbing.current ||
                isHanging.current ||
                isHangDropping.current ||
                isSliding.current
            )
        ) {
            clearGroundTransition();
        }

        /*
         * เริ่ม RunStop เพียงครั้งเดียวเมื่อหยุดจาก Spint
         * ส่วน Jog กลับ Idle ทันทีเพื่อไม่ให้การขยับสั้น ๆ สะดุด
         * timer/latch จะกัน Idle หรือ locomotion ใหม่มาตัดกลางคลิป
         */
        if (
            groundTransition.current === null &&
            animationGrounded &&
            !isMoving &&
            !isCrouching.current &&
            !isPushing &&
            landingTimer.current <= 0 &&
            runStopInputTimer.current >=
            RUN_STOP_INPUT_GRACE &&
            currentAnimation.current ===
            "Spint"
        ) {
            startGroundTransition("RunStop");
        }

        const nextAnimation =
            resolvePlayerAnimation({
                currentAnimation: currentAnimation.current,
                isRunJumpingUp: isRunJumpingUp.current,
                isClimbing: isClimbing.current,
                isHanging: isHanging.current,
                isEnteringHang: isEnteringHang.current,
                isHangDropping: isHangDropping.current,
                shouldPreLand,
                animationGrounded,
                landingTimer: landingTimer.current,
                landingAnimation: landingAnimation.current,
                isSliding: isSliding.current,
                highFallActive: highFallActive.current,
                didJump: didJump.current,
                jumpStartedRunning: jumpStartedRunning.current,
                groundTransition: groundTransition.current,
                pushTransitionState: pushTransitionStateRef.current,
                pushTransitionTimer: pushTransitionTimerRef.current,
                isPushing,
                isMoving,
                isCrouching: isCrouching.current,
                isWaitingForRunStop,
                isRunning,
                isJogging,
            });

        /*
         * แตะพื้นแล้วหยุดนิ่งจน Landing จบ
         * แต่ไม่ล็อกช่วง Pre-Landing ที่ยังอยู่กลางอากาศ
         */
        if (
            (
                nextAnimation === "Landing" ||
                nextAnimation === "HardLanding"
            ) &&
            animationGrounded
        ) {
            velocityX = 0;
        }

        changeAnimation(
            nextAnimation,
        );

        /*
         * เก็บ Grounded ปัจจุบัน
         * เพื่อเทียบ frame หน้า
         *
         * ต้องอยู่หลัง justLanded
         */
        wasGrounded.current =
            animationGrounded;

        // ============================
        // Apply Velocity
        // ============================

        body.setLinvel(
            {
                x: velocityX,
                y: velocityY,

                /*
                 * Side-scroller
                 * ล็อกความลึก
                 */
                z: 0,
            },
            true,
        );

        // ============================
        // หันซ้าย / ขวา
        // ============================

        if (
            visualRef.current &&
            isMoving &&
            !isHanging.current &&
            !isClimbing.current &&
            !isRunJumpingUp.current &&
            !isSliding.current &&
            groundTransition.current === null
        ) {
            if (!isPushing && direction > 0 && currentVelocity.x >= -0.05) {
                visualRef.current.rotation.y = Math.PI / 2;
            }

            if (!isPushing && direction < 0 && currentVelocity.x <= 0.05) {
                visualRef.current.rotation.y = -Math.PI / 2;
            }
        }

        // ============================
        // Reset เมื่อตก Map
        // ============================
        const position = body.translation();

        const effectState = playerEffectState.current;

        effectState.x = position.x;
        effectState.footY = position.y - PLAYER_FOOT_OFFSET;
        effectState.z = position.z;
        effectState.velocityX = currentVelocity.x;
        effectState.grounded = animationGrounded;
        effectState.enabled = animationGrounded &&
            !isCrouching.current &&
            !isSliding.current &&
            !isHanging.current &&
            !isClimbing.current &&
            !isRunJumpingUp.current &&
            !isPushing;
        effectState.locomotionActive =
            currentAnimation.current ===
            "Jog" ||
            currentAnimation.current ===
            "Spint" ||
            currentAnimation.current ===
            "CrouchedSpinting" ||
            currentAnimation.current ===
            "RunStop";

        // ============================
        // Cinematic Side Camera
        // ============================
        updateCamera({
            position,
            isMoving,
            direction,
            isRunning,
            safeDelta,
        });

        if (position.y < -10) {
            // ============================
            // Reset Ledge / Climb
            // ============================

            isHanging.current = false;
            isClimbing.current = false;
            isEnteringHang.current = false;
            hangEntryTimer.current = 0;
            isHangDropping.current = false;
            hangDropTimer.current = 0;
            isRunJumpingUp.current = false;
            runJumpUpTimer.current = 0;

            climbQueued.current = false;
            dropFromLedgeQueued.current = false;

            climbTimer.current = 0;
            highFallActive.current = false;
            isSliding.current = false;
            slideTimer.current = 0;
            crouchPressed.current = false;
            manualCrouchActive.current = false;
            standFromManualCrouchQueued.current = false;
            clearGroundTransition();
            groundTransitionStartedThisFrame.current = false;

            body.setGravityScale(
                1,
                true,
            );

            // ============================
            // Reset Position
            // ============================
            body.setTranslation(
                {
                    x: spawnPosition[0],
                    y: spawnPosition[1],
                    z: spawnPosition[2],
                },
                true,
            );

            body.setLinvel(
                {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                true,
            );

            setCrouching(false);
        }
    });

    return (
        <>
            <RigidBody
                ref={bodyRef}
                name="player"
                position={spawnPosition}
                colliders={false}
                lockRotations
                enabledTranslations={[
                    true,
                    true,
                    false,
                ]}
                ccd
                canSleep={false}
                linearDamping={1}
            >
                {/* Collider ตอนยืน */}
                <CapsuleCollider
                    ref={standingColliderRef}
                    args={[
                        STANDING_HALF_HEIGHT,
                        PLAYER_RADIUS,
                    ]}
                    position={[
                        0,
                        STANDING_COLLIDER_OFFSET_Y,
                        0,
                    ]}
                    friction={0}
                    frictionCombineRule={
                        rapier.CoefficientCombineRule.Min
                    }
                />

                {/* Collider ตอนย่อ */}
                <CapsuleCollider
                    ref={setCrouchingColliderRef}
                    args={[
                        CROUCHING_HALF_HEIGHT,
                        PLAYER_RADIUS,
                    ]}
                    position={[
                        0,
                        CROUCH_COLLIDER_OFFSET_Y,
                        0,
                    ]}
                    friction={0}
                    frictionCombineRule={
                        rapier.CoefficientCombineRule.Min
                    }
                />

                {/* Ground Sensor */}
                <CuboidCollider
                    args={[
                        0.22,
                        0.06,
                        0.22,
                    ]}
                    position={[
                        0,
                        -0.94,
                        0,
                    ]}
                    sensor
                    onIntersectionEnter={({ other }) => {
                        // Interaction Sensor ต่าง ๆ
                        // ไม่นับเป็นพื้น
                        if (other.collider.isSensor()) {
                            return;
                        }

                        groundContacts.current += 1;
                    }}

                    onIntersectionExit={({ other }) => {
                        if (other.collider.isSensor()) {
                            return;
                        }

                        groundContacts.current =
                            Math.max(
                                0,
                                groundContacts.current - 1,
                            );
                    }}
                />

                {/* Ceiling Sensor */}
                <CuboidCollider
                    args={[
                        CEILING_SENSOR_HALF_WIDTH,
                        CEILING_SENSOR_HALF_HEIGHT,
                        CEILING_SENSOR_HALF_WIDTH,
                    ]}
                    position={[
                        0,
                        CEILING_SENSOR_OFFSET_Y,
                        0,
                    ]}
                    sensor
                    onIntersectionEnter={({ other }) => {
                        // Sensor อื่นไม่ถือเป็นเพดาน
                        if (other.collider.isSensor()) {
                            return;
                        }

                        ceilingContacts.current += 1;
                    }}

                    onIntersectionExit={({ other }) => {
                        if (other.collider.isSensor()) {
                            return;
                        }

                        ceilingContacts.current = Math.max(
                            0,
                            ceilingContacts.current - 1,
                        );
                    }}
                />

                {/* ตัวละครจริง */}
                <group ref={visualRef}>
                    <PlayerModel
                        animation={animation}
                    />
                </group>
            </RigidBody>

            <RunDustEffect
                stateRef={playerEffectState}
            />

            <SpeedLinesEffect
                stateRef={playerEffectState}
            />
        </>
    );
}
