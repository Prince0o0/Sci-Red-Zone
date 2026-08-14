"use client";

import { Html } from "@react-three/drei";
import {
  CuboidCollider,
  RigidBody,
} from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type HoldInteractionTriggerProps = {
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

  holdDuration?: number;

  onComplete: () => void;

  onHoldingChange?: (
    holding: boolean,
  ) => void;
};

export default function HoldInteractionTrigger({
  position,
  halfExtents = [1.5, 2, 1.5],
  label,
  enabled = true,
  holdDuration = 1.5,
  onComplete,
  onHoldingChange,
}: HoldInteractionTriggerProps) {
  const playerCollidersRef =
    useRef<Set<number>>(
      new Set(),
    );

  const playerNearRef =
    useRef(false);

  const holdingRef =
    useRef(false);

  const holdTimeRef =
    useRef(0);

  const completedRef =
    useRef(false);

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
    function stopHolding() {
      holdingRef.current = false;

      holdTimeRef.current = 0;

      setProgress(0);

      onHoldingChange?.(false);
    }

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

      if (
        completedRef.current
      ) {
        return;
      }

      event.preventDefault();

      holdingRef.current = true;

      onHoldingChange?.(true);
    }

    function handleKeyUp(
      event: KeyboardEvent,
    ) {
      if (
        event.code !== "KeyE"
      ) {
        return;
      }

      stopHolding();
    }

    function handleBlur() {
      stopHolding();
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
  }, [
    enabled,
    onHoldingChange,
  ]);

  // ==============================
  // Hold Progress
  // ==============================

  useFrame((_, delta) => {
    if (
      !enabled ||
      completedRef.current ||
      !playerNearRef.current ||
      !holdingRef.current
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

    setProgress(
      nextProgress,
    );

    if (
      holdTimeRef.current <
      holdDuration
    ) {
      return;
    }

    completedRef.current = true;

    holdingRef.current = false;

    setProgress(1);

    onHoldingChange?.(false);

    onComplete();
  });

  return (
    <>
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
                .size !== 0
            ) {
              return;
            }

            playerNearRef.current =
              false;

            holdingRef.current =
              false;

            holdTimeRef.current = 0;

            setProgress(0);

            setIsPlayerNear(false);

            onHoldingChange?.(false);
          }}
        />
      </RigidBody>

      {enabled &&
        isPlayerNear &&
        !completedRef.current && (
          <Html
            position={[
              position[0],
              position[1] + 2,
              position[2],
            ]}
            center
          >
            <div
              className="
                w-56
                rounded-lg
                bg-black/80
                px-4
                py-3
                text-center
                text-sm
                text-white
                shadow-lg
                backdrop-blur-sm
              "
            >
              <div>
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

              <div
                className="
                  mt-3
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
                    transition-[width]
                  "
                  style={{
                    width:
                      `${progress * 100}%`,
                  }}
                />
              </div>
            </div>
          </Html>
        )}
    </>
  );
}