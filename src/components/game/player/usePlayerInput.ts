import { useEffect, useRef } from "react";
import type { KeyboardState } from "./playerConfig";

type UsePlayerInputOptions = {
  isPushing: boolean;
};

export function usePlayerInput({ isPushing }: UsePlayerInputOptions) {
  const keys = useRef<KeyboardState>({
    left: false,
    right: false,
    run: false,
    crouch: false,
  });

  const jumpQueued = useRef(false);

  const climbInputQueued = useRef(false);

  const dropInputQueued = useRef(false);

  const crouchPressed = useRef(false);

  const crouchKeysDown = useRef(new Set<string>());

  const manualCrouchActive = useRef(false);

  const standFromManualCrouchQueued = useRef(false);

  const crouchSprintOverride = useRef(false);

  // ==============================
  // Push Input Lock
  // ==============================

  useEffect(() => {
    if (!isPushing) {
      return;
    }

    // A / D ยังใช้ดัน Object ได้

    // ปิด Action อื่นทั้งหมด
    keys.current.run = false;
    keys.current.crouch = false;

    jumpQueued.current = false;
    crouchPressed.current = false;

    crouchKeysDown.current.clear();

    manualCrouchActive.current = false;

    standFromManualCrouchQueued.current = false;

    crouchSprintOverride.current = false;
  }, [isPushing]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      switch (event.code) {
        // ========================
        // Movement
        // ========================

        case "KeyA":
        case "ArrowLeft":
          keys.current.left = true;
          break;

        case "KeyD":
        case "ArrowRight":
          keys.current.right = true;
          break;

        // ========================
        // Sprint
        // ========================

        case "ShiftLeft":
        case "ShiftRight":
          if (isPushing) {
            keys.current.run = false;
            break;
          }

          keys.current.run = true;
          break;

        // ========================
        // Toggle Crouch
        // ========================

        case "KeyC":
        case "ControlLeft":
        case "ControlRight": {
          event.preventDefault();

          if (isPushing || event.repeat) {
            break;
          }

          const nextCrouchState = !keys.current.crouch;

          keys.current.crouch = nextCrouchState;

          if (nextCrouchState) {
            // กดครั้งนี้ = ย่อ
            crouchPressed.current = true;

            standFromManualCrouchQueued.current = false;
          } else {
            // กดครั้งนี้ = ลุก
            crouchPressed.current = false;

            if (manualCrouchActive.current) {
              standFromManualCrouchQueued.current = true;
            }
          }

          break;
        }

        case "KeyW":
        case "ArrowUp":
          if (!isPushing && !event.repeat) {
            climbInputQueued.current = true;
          }
          break;

        case "KeyS":
        case "ArrowDown":
          if (!isPushing && !event.repeat) {
            dropInputQueued.current = true;
          }
          break;

        // ========================
        // Jump
        // ========================

        case "Space":
          event.preventDefault();

          if (event.repeat || isPushing) {
            jumpQueued.current = false;
            break;
          }

          jumpQueued.current = true;
          break;
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      switch (event.code) {
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = false;
          break;

        case "KeyD":
        case "ArrowRight":
          keys.current.right = false;
          break;

        case "ShiftLeft":
        case "ShiftRight":
          keys.current.run = false;
          break;

        /*
         * Crouch เป็น Toggle
         * ดังนั้น KeyUp ห้ามเปลี่ยน
         * keys.current.crouch
         */
        case "KeyC":
        case "ControlLeft":
        case "ControlRight":
          event.preventDefault();

          crouchKeysDown.current.delete(event.code);

          break;
      }
    }

    function handleBlur() {
      climbInputQueued.current = false;
      dropInputQueued.current = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.run = false;

      /*
       * Blur ให้ reset crouch
       * ป้องกัน state ค้างเวลาออกจากหน้าเกม
       */
      keys.current.crouch = false;

      crouchKeysDown.current.clear();

      manualCrouchActive.current = false;

      standFromManualCrouchQueued.current = false;

      crouchSprintOverride.current = false;

      jumpQueued.current = false;
      crouchPressed.current = false;
    }

    window.addEventListener("keydown", handleKeyDown);

    window.addEventListener("keyup", handleKeyUp);

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      window.removeEventListener("keyup", handleKeyUp);

      window.removeEventListener("blur", handleBlur);
    };
  }, [isPushing]);

  return {
    keys,
    jumpQueued,
    climbInputQueued,
    dropInputQueued,
    crouchPressed,
    crouchKeysDown,
    manualCrouchActive,
    standFromManualCrouchQueued,
    crouchSprintOverride,
  };
}
