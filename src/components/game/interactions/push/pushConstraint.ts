import {
    PUSH_LOCK_TOLERANCE,
    PUSH_PLAYER_LOCK_MAX_SPEED,
    PUSH_PLAYER_LOCK_STRENGTH,
} from "./pushConfig";

type ResolvePushConstraintOptions = {
    playerX: number;
    playerVelocityX: number;

    objectX: number;

    grabSide: 1 | -1;
    grabDistance: number;

    followStrength: number;
    maxFollowSpeed: number;

    targetX: number;
    targetOnRight: boolean;

    delta: number;
};

type PushConstraintResult = {
    objectVelocityX: number;
    playerLockVelocityX: number | null;
};

function clamp(
    value: number,
    min: number,
    max: number,
) {
    return Math.max(
        min,
        Math.min(max, value),
    );
}

export function resolvePushConstraint({
    playerX,
    playerVelocityX,
    objectX,
    grabSide,
    grabDistance,
    followStrength,
    maxFollowSpeed,
    targetX,
    targetOnRight,
    delta,
}: ResolvePushConstraintOptions): PushConstraintResult {
    // Printer ควรอยู่ตรงไหนเมื่อเทียบกับ Player
    const targetObjectX =
        playerX +
        grabSide * grabDistance;

    const objectPositionError =
        targetObjectX - objectX;

    // ให้ Printer เคลื่อนตาม Player ทั้งตอนเดินเข้าและเดินถอย
    let objectVelocityX =
        clamp(
            playerVelocityX +
                objectPositionError *
                    followStrength,
            -maxFollowSpeed,
            maxFollowSpeed,
        );

    // กัน Printer วิ่งทะลุจุดหมาย
    const safeDelta =
        Math.max(delta, 0.0001);

    const velocityUntilTarget =
        (targetX - objectX) /
        safeDelta;

    if (
        targetOnRight &&
        objectVelocityX > 0
    ) {
        objectVelocityX =
            Math.min(
                objectVelocityX,
                Math.max(
                    0,
                    velocityUntilTarget,
                ),
            );
    }

    if (
        !targetOnRight &&
        objectVelocityX < 0
    ) {
        objectVelocityX =
            Math.max(
                objectVelocityX,
                Math.min(
                    0,
                    velocityUntilTarget,
                ),
            );
    }

    // Player ควรยืนห่าง Printer เท่าเดิมตลอด
    const desiredPlayerX =
        objectX -
        grabSide * grabDistance;

    const playerPositionError =
        desiredPlayerX - playerX;

    if (
        Math.abs(playerPositionError) <=
        PUSH_LOCK_TOLERANCE
    ) {
        return {
            objectVelocityX,
            playerLockVelocityX: null,
        };
    }

    // Printer ติดกำแพง / ตามไม่ทัน
    // → ดึงความเร็ว Player กลับ ไม่ให้เดินหนีออกไป
    const playerLockVelocityX =
        clamp(
            objectVelocityX +
                playerPositionError *
                    PUSH_PLAYER_LOCK_STRENGTH,
            -PUSH_PLAYER_LOCK_MAX_SPEED,
            PUSH_PLAYER_LOCK_MAX_SPEED,
        );

    return {
        objectVelocityX,
        playerLockVelocityX,
    };
}