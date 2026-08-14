import { PLAYER_MODEL_SCALE } from "./PlayerModel";

// ==============================
// Movement
// ==============================

export const JOG_SPEED = 8.5;
export const RUN_SPEED = 14.5;
export const CROUCH_SPEED = 2.5;

export const JUMP_SPEED = 8.5;
export const TAKEOFF_GROUND_IGNORE_VELOCITY = 1;
// เริ่ม Landing ก่อนเท้าแตะพื้นกี่หน่วย
export const LAND_PREP_DISTANCE = 0;
// ระยะจากจุดกึ่งกลาง RigidBody ถึงเท้า
export const PLAYER_FOOT_OFFSET = 0.9;
// Landing เริ่มเล่นที่วินาที 0.5 ใน PlayerModel
export const LAND_DURATION = 1.0833333 - 0.5;
export const HARD_LANDING_DURATION = 2.0166667;

/*
 * Falling ใช้เฉพาะการเดินตกจากที่สูง
 * Jump / RunningJump และการตกต่างระดับต่ำจะใช้ท่าเดิมต่อไป
 */
export const HIGH_FALL_MIN_CLEARANCE = 2.25;
export const HIGH_FALL_START_VELOCITY = -1.5;

// Sprint -> Slide
export const SLIDE_MIN_ENTRY_SPEED = 7;
// ให้การกด Slide ทันทีหลังเริ่ม Sprint ยังมีแรงส่งชัดเจน
// แต่ถ้าวิ่งมาเร็วกว่านี้จะเก็บ Momentum ที่สูงกว่าไว้ทั้งหมด
export const SLIDE_MIN_INITIAL_SPEED = 20.5;
// ค่าสัมประสิทธิ์แรงเสียดทานแบบ exponential (ยิ่งต่ำยิ่งไกล)
export const SLIDE_DRAG = 0.1;
export const SLIDE_DURATION = 0.95;
export const SLIDE_BLOCKED_SPEED = 0.2;

export const JUMP_HANG_DURATION = 0.45;
export const HANG_DROP_DURATION = 0.65;
export const RUN_JUMP_UP_DURATION = 0.8;

// Grounded one-shot animation durations จาก student.glb
export const CROUCHED_STANDING_DURATION = 0.65;
export const CROUCHED_SPINTING_DURATION = 0.5166667;
export const RUN_STOP_DURATION = 0.9166667;

/*
 * เว้นช่วงสั้น ๆ ก่อน RunStop เพื่อไม่ให้ปุ่มที่ปล่อยเพียงชั่วครู่
 * ถูกตีความเป็นการหยุดจริง
 */
export const RUN_STOP_INPUT_GRACE = 0.12;

/*
 * คง inertia ตอนกลับทิศไว้โดยเบรก velocity เดิมถึงศูนย์ก่อน
 * แล้วจึงให้ acceleration ปกติเร่งไปทิศใหม่
 */
export const REVERSE_BRAKE_ACCELERATION = 45;

// ==============================
// Camera
// ==============================

// กล้องห่างจากฉากแค่ไหน
export const CAMERA_DISTANCE = 13;

// ความสูงกล้องเหนือ Player
export const CAMERA_HEIGHT = 3.5;

// กล้องมองสูงกว่าจุดกลาง Player เล็กน้อย
export const CAMERA_TARGET_HEIGHT = 3;

// มองล่วงหน้าตอนเดิน
export const WALK_LOOK_AHEAD = 1.2;

// มองล่วงหน้าเพิ่มตอนวิ่ง
export const RUN_LOOK_AHEAD = 2;

// ความเร็วในการตาม Player
export const CAMERA_FOLLOW_SPEED = 4;

// ความเร็วตอนเปลี่ยน Look Ahead
export const LOOK_AHEAD_SPEED = 5;

// Y ใช้ช้ากว่า X
// เพื่อไม่ให้กล้องเด้งตาม Jump แบบแข็ง ๆ
export const CAMERA_VERTICAL_SPEED = 2.5;

// ==============================
// Ledge / Hang
// ==============================

// Ray ยิงไปข้างหน้าไกลเท่าไร
export const LEDGE_FORWARD_DISTANCE = 0.85;

// Ray ล่าง เอาไว้หา "กำแพง"
export const LEDGE_LOWER_RAY_Y = 0.2;

// Ray บน ต้องไม่เจอกำแพง
export const LEDGE_UPPER_RAY_Y = 1.0;

// จุดเริ่มยิง Ray ลงหาพื้นด้านบน
export const LEDGE_TOP_RAY_Y = 1.4;

export const LEDGE_TOP_RAY_DISTANCE = 1.7;

// Player ห่างจากผนังตอนห้อย
export const HANG_DISTANCE_FROM_WALL = 0.1;

// Body อยู่ต่ำกว่าขอบเท่าไรตอน Hang
export const HANG_BODY_BELOW_LEDGE = 0.79;

// กันปล่อยขอบแล้วจับกลับทันที
export const LEDGE_REGRAB_COOLDOWN = 0.3;

// ต้องตกลงมาระยะอย่างน้อยเท่านี้
// ถึงจะ Auto Grab ขอบจากการ "เดินตก"
export const MIN_PASSIVE_LEDGE_GRAB_FALL_DISTANCE = 1.2;

// ถ้าขอบที่ตรวจเจออยู่ระดับเดียวกับพื้นที่เพิ่งตกมา
// ถือว่าเป็นขอบเดิม ไม่ให้หันกลับไปเกาะ
export const SAME_LEDGE_HEIGHT_TOLERANCE = 0.3;

// ==============================
// Climb
// ==============================

// ให้การขยับ Body จบพร้อมคลิป Climb
// ตรงกับความยาวจริงของ BracedHangCrouch เพื่อไม่ยืดท่าปีนจนช้า
export const CLIMB_DURATION = 1.15;

// ปีนเข้าไปด้านบน Platform เท่าไร
export const CLIMB_FORWARD_DISTANCE = 0.65;

// ==============================
// Standing Collider
// ==============================

// Collider เดิมจูนกับ Model scale 1.2
export const BASE_PLAYER_MODEL_SCALE = 1.1;

export const PLAYER_COLLIDER_HEIGHT_SCALE =
    PLAYER_MODEL_SCALE / BASE_PLAYER_MODEL_SCALE;

/*
 * คงรัศมีเดิม เพื่อไม่เปลี่ยนระยะชนกำแพง กล่อง
 * และตำแหน่ง Hang ในแนวนอน
 */
export const PLAYER_RADIUS = 0.35;

/*
 * พื้นต้องออกแรงพยุง Player ขึ้นอย่างน้อยประมาณ 60 องศา
 * เพื่อไม่ให้นับการชนด้านข้างของกำแพงว่าเป็น Grounded
 */
export const MIN_GROUND_SUPPORT_NORMAL_Y = 0.5;
export const GROUND_SUPPORT_RAY_MARGIN = 0.03;

export const STANDING_HALF_HEIGHT =
    (0.55 + PLAYER_RADIUS) * PLAYER_COLLIDER_HEIGHT_SCALE - PLAYER_RADIUS;

/*
 * ขยาย Collider ขึ้นด้านบน โดยคงขอบล่างไว้ที่
 * PLAYER_FOOT_OFFSET เดิม เพื่อไม่ให้ตัวละครลอยจากพื้น
 */
export const STANDING_COLLIDER_OFFSET_Y =
    STANDING_HALF_HEIGHT + PLAYER_RADIUS - PLAYER_FOOT_OFFSET;

/*
 * ระยะจากจุดกลาง RigidBody ถึงก้น Standing Capsule/เท้า
 * ใช้กำหนดตำแหน่งจบ climb จาก geometry จริงแทนเลขชดเชย hardcode
 */
export const STANDING_BODY_TO_FOOT =
    STANDING_HALF_HEIGHT + PLAYER_RADIUS - STANDING_COLLIDER_OFFSET_Y;

// ==============================
// Crouching Collider
// ==============================

/*
 * ช่องย่อของ Map สูงประมาณ 1.35
 * จึงเผื่อระยะไว้ 0.05 เพื่อให้ลอดได้โดยไม่พึ่ง solver tolerance
 */
export const CROUCHING_MAX_TOTAL_HEIGHT = 1.3;

export const SCALED_CROUCHING_TOTAL_HEIGHT =
    (0.2 + PLAYER_RADIUS) * 2 * PLAYER_COLLIDER_HEIGHT_SCALE;

export const CROUCHING_TOTAL_HEIGHT = Math.min(
    SCALED_CROUCHING_TOTAL_HEIGHT,
    CROUCHING_MAX_TOTAL_HEIGHT,
);

export const CROUCHING_HALF_HEIGHT =
    CROUCHING_TOTAL_HEIGHT / 2 - PLAYER_RADIUS;

/*
 * ตอนย่อ เราไม่อยากให้ก้น Capsule ลอยขึ้น
 *
 * เลยขยับ Collider ลง
 *
 * คำนวณตำแหน่งแยกจาก Standing เพื่อให้ขอบล่าง
 * ของ Collider ทั้งสองตรงกันที่ -PLAYER_FOOT_OFFSET
 */
export const CROUCH_COLLIDER_OFFSET_Y =
    CROUCHING_HALF_HEIGHT + PLAYER_RADIUS - PLAYER_FOOT_OFFSET;

export const STANDING_COLLIDER_TOP_Y =
    STANDING_COLLIDER_OFFSET_Y + STANDING_HALF_HEIGHT + PLAYER_RADIUS;

/*
 * ถ้าขอบไม่สูงเกิน Standing Collider มากกว่า 0.25 หน่วย
 * ใช้ RunJumpUp ข้ามขึ้นไปโดยไม่เข้าสถานะ Hang
 */
export const RUN_JUMP_UP_MAX_LEDGE_HEIGHT =
    STANDING_COLLIDER_TOP_Y + PLAYER_FOOT_OFFSET + 0.25;

export const CROUCH_COLLIDER_TOP_Y =
    CROUCH_COLLIDER_OFFSET_Y + CROUCHING_HALF_HEIGHT + PLAYER_RADIUS;

export const CEILING_SENSOR_MARGIN = 0.05 * PLAYER_COLLIDER_HEIGHT_SCALE;

export const CEILING_SENSOR_BOTTOM_Y =
    CROUCH_COLLIDER_TOP_Y + CEILING_SENSOR_MARGIN;

export const CEILING_SENSOR_TOP_Y =
    STANDING_COLLIDER_TOP_Y - CEILING_SENSOR_MARGIN;

export const CEILING_SENSOR_HALF_HEIGHT =
    (CEILING_SENSOR_TOP_Y - CEILING_SENSOR_BOTTOM_Y) / 2;

export const CEILING_SENSOR_OFFSET_Y =
    (CEILING_SENSOR_TOP_Y + CEILING_SENSOR_BOTTOM_Y) / 2;

export const CEILING_SENSOR_HALF_WIDTH = PLAYER_RADIUS;

export const INACTIVE_COLLISION_GROUPS = 0;

// ==============================
// Keyboard
// ==============================

export type KeyboardState = {
    left: boolean;
    right: boolean;
    run: boolean;
    crouch: boolean;
};

export type GroundTransition =
    | "CrouchedSpinting"
    | "CrouchedStanding"
    | "RunStop";

export const GROUND_TRANSITION_DURATIONS: Record<GroundTransition, number> = {
    CrouchedSpinting: CROUCHED_SPINTING_DURATION,
    CrouchedStanding: CROUCHED_STANDING_DURATION,
    RunStop: RUN_STOP_DURATION,
};
