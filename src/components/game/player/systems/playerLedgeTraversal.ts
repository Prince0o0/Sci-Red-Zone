"use client";

import { useRef } from "react";

export function usePlayerLedgeTraversal() {
    // กำลังห้อยขอบหรือไม่
    const isHanging = useRef(false);

    // ตำแหน่งที่ต้องค้างตอน Hang
    const hangPosition = useRef({ x: 0, y: 0, z: 0 });

    // กดลงเพื่อปล่อยขอบ
    const dropFromLedgeQueued = useRef(false);

    const isEnteringHang = useRef(false);
    const hangEntryTimer = useRef(0);

    const isHangDropping = useRef(false);
    const hangDropTimer = useRef(0);

    // ป้องกันปล่อยแล้วคว้าซ้ำทันที
    const ledgeGrabCooldown = useRef(0);

    // ==============================
    // Climb State
    // ==============================
    const isClimbing = useRef(false);
    const climbQueued = useRef(false);
    const climbTimer = useRef(0);

    // จุดขอบด้านบนที่ Ray ตรวจเจอ
    const ledgeTopPosition = useRef({ x: 0, y: 0, z: 0 });

    // จุดเริ่มปีน
    const climbStartPosition = useRef({ x: 0, y: 0, z: 0 });

    // จุดที่ยกตัวขึ้นเหนือขอบ
    const climbUpPosition = useRef({ x: 0, y: 0, z: 0 });

    // จุดสุดท้ายที่ยืนบน Platform
    const climbEndPosition = useRef({ x: 0, y: 0, z: 0 });

    const isRunJumpingUp = useRef(false);
    const runJumpUpTimer = useRef(0);

    const runJumpUpStartPosition = useRef({ x: 0, y: 0, z: 0 });
    const runJumpUpTopPosition = useRef({ x: 0, y: 0, z: 0 });
    const runJumpUpEndPosition = useRef({ x: 0, y: 0, z: 0 });

    function resetLedgeState() {
        isHanging.current = false;
        isEnteringHang.current = false;
        hangEntryTimer.current = 0;

        isHangDropping.current = false;
        hangDropTimer.current = 0;

        isClimbing.current = false;
        climbQueued.current = false;
        dropFromLedgeQueued.current = false;
        climbTimer.current = 0;

        isRunJumpingUp.current = false;
        runJumpUpTimer.current = 0;
    }

    return {
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
    };
}
