"use client";

import { useRef } from "react";
import {
  useAfterPhysicsStep,
  type RapierCollider,
  type RapierRigidBody,
} from "@react-three/rapier";

import {
  GROUND_SUPPORT_RAY_MARGIN,
  MIN_GROUND_SUPPORT_NORMAL_Y,
  PLAYER_FOOT_OFFSET,
  TAKEOFF_GROUND_IGNORE_VELOCITY,
} from "../playerConfig";

type UsePlayerGroundingOptions = {
  bodyRef: React.MutableRefObject<RapierRigidBody | null>;
  standingColliderRef: React.MutableRefObject<RapierCollider | null>;
  crouchingColliderRef: React.MutableRefObject<RapierCollider | null>;
  isCrouching: React.MutableRefObject<boolean>;
  didJump: React.MutableRefObject<boolean>;
  rapier: any;
};

export function usePlayerGrounding({
  bodyRef,
  standingColliderRef,
  crouchingColliderRef,
  isCrouching,
  didJump,
  rapier,
}: UsePlayerGroundingOptions) {
  const stableGrounded = useRef(false);

  useAfterPhysicsStep((physicsWorld) => {
    const body = bodyRef.current;

    const activePlayerCollider = isCrouching.current
      ? crouchingColliderRef.current
      : standingColliderRef.current;

    if (!body || !activePlayerCollider) {
      stableGrounded.current = false;
      return;
    }

    if (
      didJump.current &&
      body.linvel().y > TAKEOFF_GROUND_IGNORE_VELOCITY
    ) {
      stableGrounded.current = false;
      return;
    }

    let hasGroundSupport = false;

    physicsWorld.contactPairsWith(
      activePlayerCollider,
      (otherCollider) => {
        if (
          hasGroundSupport ||
          otherCollider.isSensor()
        ) {
          return;
        }

        physicsWorld.contactPair(
          activePlayerCollider,
          otherCollider,
          (manifold, flipped) => {
            if (
              hasGroundSupport ||
              manifold.numSolverContacts() === 0
            ) {
              return;
            }

            const manifoldNormal = manifold.normal();
            const supportNormalY = flipped
              ? manifoldNormal.y
              : -manifoldNormal.y;

            if (
              supportNormalY >=
              MIN_GROUND_SUPPORT_NORMAL_Y
            ) {
              hasGroundSupport = true;
            }
          },
        );
      },
    );

    if (!hasGroundSupport) {
      const groundRay = new rapier.Ray(
        body.translation(),
        {
          x: 0,
          y: -1,
          z: 0,
        },
      );

      const groundHit = physicsWorld.castRayAndGetNormal(
        groundRay,
        PLAYER_FOOT_OFFSET + GROUND_SUPPORT_RAY_MARGIN,
        true,
        rapier.QueryFilterFlags.EXCLUDE_SENSORS,
        undefined,
        undefined,
        body,
      );

      hasGroundSupport =
        groundHit !== null &&
        groundHit.normal.y >= MIN_GROUND_SUPPORT_NORMAL_Y;
    }

    stableGrounded.current = hasGroundSupport;
  });

  return stableGrounded;
}
