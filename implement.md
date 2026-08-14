# SCI Red Zone — Implementation Handoff

เอกสารนี้เป็น snapshot ของโค้ดใน worktree ปัจจุบัน สำหรับส่งต่อให้คนอื่นหรือ AI คนถัดไปทำงานต่อ

อัปเดตตามโค้ดปัจจุบัน ณ 2026-08-13

## กติกาสำคัญก่อนแก้

- โปรเจกต์จริงอยู่ที่:

  ```text
  /Users/kang.athiwat/educations/2569-term1/game-design/game-projects/sci-red-zone
  ```

- Worktree นี้มีการแก้ไขที่ยังไม่ commit ทั้ง source และ `.glb` หลายไฟล์
- ห้ามใช้ `git reset --hard`, `git checkout --`, หรือสร้างไฟล์ทับจาก `HEAD` เพราะจะทำให้การแก้ Player, Printer, Map และ asset ปัจจุบันหาย
- แก้เฉพาะระบบที่ได้รับมอบหมาย อย่า rewrite movement, camera, ledge, collider หรือ animation architecture โดยไม่จำเป็น
- `GameScene.tsx`, `Player.tsx`, `PlayerModel.tsx`, `ModelPrinter.tsx` เป็น Client Component อยู่แล้ว จึงใช้ browser input / R3F / Rapier state ได้

## คำสั่งตรวจสอบ

```bash
npx tsc --noEmit --incremental false
git diff --check
npm run build -- --webpack
```

คำสั่ง lint แบบเต็มอาจยังรายงาน `react-hooks/immutability` ที่มีอยู่เดิมจากการ mutate Three.js `camera` ใน `Player.tsx` และ `AnimationAction` ใน `PlayerModel.tsx` ซึ่งเป็น imperative R3F/Drei code ที่ใช้งานอยู่จริง ไม่ใช่ error ใหม่จากระบบ gameplay

## โครงสร้างไฟล์หลัก

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
└── components/game/
    ├── GameScene.tsx        # Canvas, Physics, Map, Player, Printer
    ├── Map.tsx              # visual/collision map GLB
    ├── Player.tsx           # input, physics, ledge, state resolver, camera
    ├── PlayerModel.tsx      # GLB animation, root-motion removal, crossfade
    ├── ModelPrinter.tsx     # E grab, push-only printer, placement target
    └── effects/
        ├── RunDustEffect.tsx
        ├── SpeedLinesEffect.tsx
        └── playerEffectTypes.ts

public/
├── player/student.glb
├── objects/printer.glb
├── map/map.glb
└── map/map-collision.glb
```

## สิ่งที่ทำเสร็จแล้วโดยรวม

- Player side-scroller ใช้ Rapier RigidBody + capsule collider แยกยืน/ย่อ
- Movement มี Jog, Spint, inertia ตอนกลับทิศ, jump, landing และ hard landing
- C / Ctrl เป็น **hold-to-crouch**: กดค้างย่อ ปล่อยแล้วยืนเมื่อมี headroom
- `CrouchedStanding` เล่นเฉพาะหลังปล่อย C/Ctrl จาก manual crouch จริงเท่านั้น
- RunningSlide ใช้ physical velocity จริง, crouch collider ตลอดท่า, และไม่เรียก `CrouchedStanding` ตอนจบ
- ระบบ ledge: JumpHang, HangingIdle, BracedHangDrop, Climb และ low-ledge JumpUp
- เปลี่ยน final Y ของ climb/jump-up ให้ derive จาก collider foot geometry
- Animation one-shot มี latch/timer ป้องกัน reset ทุกเฟรม
- `RunningTurn180` ถูกถอดออกจาก runtime state machine โดยตั้งใจ แม้ clip ยังอยู่ใน GLB
- Printer ดันได้จากทั้งซ้ายและขวาตามทิศที่ Player เดิน แต่ดึงกลับไม่ได้
- เพิ่ม pooled foot dust และ instanced speed lines โดยไม่กระทบ physics

---

# 1. Game Scene

ไฟล์: `src/components/game/GameScene.tsx`

## หน้าที่

- สร้าง R3F `<Canvas>` และ Rapier `<Physics>`
- mount `Map`, `ModelPrinter`, `Player`
- รับ state จาก Printer แล้วส่งต่อให้ Player เพื่อเลือก animation `Pushing` และลด speed ระหว่างดัน

## ค่า scene ปัจจุบัน

```ts
const MODEL_PRINTER_POSITION = [16, 1.65, -1.2];
```

Printer ถูกย้ายไปทางขวาจากตำแหน่งเก่า เพื่อให้อยู่ใกล้บริเวณปีนมากขึ้น แต่ยังเหลือระยะให้ดันไปเป้าหมาย `x = 19.89`

```tsx
const [isPlayerPushing, setIsPlayerPushing] = useState(false);

<ModelPrinter
  position={MODEL_PRINTER_POSITION}
  onPushingChange={setIsPlayerPushing}
/>

<Player isPushing={isPlayerPushing} />
```

อย่าส่ง `position={[...]}` inline ถ้าต้องการรักษา reference ให้ stable; ใช้ tuple constant เหมือนปัจจุบัน

## UI controls ปัจจุบัน

- `A / D` หรือ arrow left/right = เดิน
- `Shift + A / D` = วิ่ง (`Spint`)
- `Space` = กระโดด / ปีนเมื่อกำลัง Hang
- `W / ArrowUp` = ปีนจาก Hang
- `S / ArrowDown` = ปล่อยจาก Hang
- `C / Ctrl` = กดค้างเพื่อย่อ
- `E` = จับ/ปล่อย Printer

---

# 2. Map

ไฟล์: `src/components/game/Map.tsx`

- โหลด visual map จาก `/map/map.glb`
- โหลด collider map จาก `/map/map-collision.glb`
- Rapier ใช้ fixed rigid body + `colliders="trimesh"` + `includeInvisible`
- `includeInvisible` สำคัญมาก: ถ้าเอาออก collision GLB อาจไม่ถูกสร้าง collider

สถานะการ render ปัจจุบัน:

- `map.glb` ถูก mount แบบ `visible={false}`
- `map-collision.glb` ถูก mount แบบ `visible={true}` ภายใน physics body

หากเปลี่ยนการแสดงผล map ต้องแยกเรื่อง visual และ collision ออกจากกัน อย่าแก้ `includeInvisible` โดยไม่ทดสอบพื้น, ledge ray และ Hang ใหม่

---

# 3. Player (`Player.tsx`)

ไฟล์นี้เป็น controller หลัก: input, RigidBody velocity, collider, grounding, ledge raycast, traversal, animation-state resolver, camera และ effect snapshot

## 3.1 Movement tuning

อยู่บนสุดของ `Player.tsx`

```ts
const JOG_SPEED = 8.5;
const RUN_SPEED = 15.5;
const CROUCH_SPEED = 2.5;
const JUMP_SPEED = 8.5;
```

การกลับทิศใช้ momentum จริง:

```ts
const REVERSE_BRAKE_ACCELERATION = 45;
```

เมื่อ velocity ปัจจุบันสวนกับ input direction ระบบจะ `moveTowards(currentVelocity.x, 0, ...)` ก่อน แล้วค่อยเร่งไปทางใหม่ในเฟรมถัดไป จึงไม่กลับจาก full speed ไป full speed ทันที

## 3.2 Grounding และ collider

### Standing capsule

- `PLAYER_RADIUS = 0.35`
- `PLAYER_FOOT_OFFSET = 0.9`
- `PLAYER_MODEL_SCALE = 1.67` อยู่ใน `PlayerModel.tsx`
- `STANDING_BODY_TO_FOOT` derive จาก half-height, radius และ collider offset

สูตรสำคัญ:

```ts
const STANDING_BODY_TO_FOOT =
  STANDING_HALF_HEIGHT +
  PLAYER_RADIUS -
  STANDING_COLLIDER_OFFSET_Y;
```

ค่าจริงปัจจุบันได้ `0.9` หน่วย ซึ่งทำให้ body final Y ของ traversal เป็น:

```ts
bodyY = ledgeTopY + STANDING_BODY_TO_FOOT;
```

อย่ากลับไปใช้ค่า hardcode เช่น `CLIMB_BODY_ABOVE_LEDGE = 0.905` หรือเพิ่ม `+0.02` ที่ปลาย JumpUp เพราะจะทำให้ capsule/เท้าลอยเหนือ platform

### Crouch capsule และ headroom

- Standing/Crouch เป็น capsule คนละตัว แล้วสลับ enable state
- ขอบล่างของ collider ทั้งคู่ตั้งให้ตรงกันที่ `-PLAYER_FOOT_OFFSET` จึงไม่ควรเลื่อน body Y ตอนสลับ posture
- `CEILING_SENSOR` วางระหว่าง top ของ crouch และ standing capsule เพื่อตรวจว่าลุกได้หรือไม่
- `CEILING_SENSOR_HALF_WIDTH = PLAYER_RADIUS` เพื่อครอบ footprint ของ capsule ยืน ไม่พลาดมุม overhang ง่าย ๆ

### Grounded

มีสองระบบที่ไม่ควรรวมกันโดยไม่ทดสอบใหม่:

1. `stableGrounded` สำหรับ jump / velocity / animation
   - คำนวณจาก active capsule contact manifold
   - ตรวจ support normal และมี support ray margin
   - ใช้ตัด contact ค้างช่วง takeoff
2. `groundContacts` จาก ground sensor
   - ใช้กับ logic Hang/ledge เดิม

## 3.3 Input และ crouch แบบกดค้าง

### Keyboard state

```ts
type KeyboardState = {
  left: boolean;
  right: boolean;
  run: boolean;
  crouch: boolean;
};
```

### Manual crouch provenance

ระบบไม่ใช้ toggle แล้ว และแยก origin ของ crouch ออกจาก posture ชั่วคราวด้วย ref เหล่านี้:

```ts
const crouchKeysDown = useRef(new Set<string>());
const manualCrouchActive = useRef(false);
const standFromManualCrouchQueued = useRef(false);
const crouchSprintOverride = useRef(false);
```

ลำดับสำคัญ:

1. `KeyC`, `ControlLeft`, `ControlRight` ถูกเก็บใน `crouchKeysDown`
2. Player ยังคง crouch จนปล่อยปุ่ม crouch ตัวสุดท้าย
3. เฉพาะ `keyup` ตัวสุดท้ายที่เกิดขณะ `manualCrouchActive` เท่านั้นที่จะตั้ง `standFromManualCrouchQueued`
4. เมื่อ headroom ว่าง ระบบสลับ standing collider
5. `CrouchedStanding` จะเริ่มเฉพาะเมื่อ queue นี้มีอยู่และ Player ยัง grounded/ไม่อยู่ special state

ดังนั้น **ห้าม** trigger `CrouchedStanding` ด้วยเงื่อนไขแค่ `!keys.crouch && isCrouching` หรือจาก `setCrouching(false)` โดยตรง

### กรณีที่ต้องไม่เล่น CrouchedStanding

flag manual stand ถูกล้างเมื่อ posture เปลี่ยนด้วย:

- `RunningSlide`
- `CrouchedSpinting`
- Jump ที่บังคับลุก
- Hang / Climb / RunJumpUp traversal
- map reset / window blur
- landing หรือ posture ชั่วคราวอื่น

Slide จบแล้ว:

- ถ้าปล่อย C/Ctrl แล้วและ headroom ว่าง → สลับ standing collider เงียบ ๆ แล้ว resolver ไป Idle/Jog/Spint
- ถ้าถือ C/Ctrl อยู่ → คง crouch collider
- ไม่มี `CrouchedStanding` จาก slide exit

### Crouch + Sprint

เมื่อ crouch + run + direction ในกรณีที่ไม่ใช่ slide และมี headroom ระบบสามารถเริ่ม one-shot `CrouchedSpinting` เพื่อเปลี่ยนจาก crouch ไป Spint

`crouchSprintOverride` ใช้กันการวนกลับไป crouch/transition ซ้ำ และใช้รักษา crouch หลัง Slide ถ้ายังถือ C/Ctrl อยู่

## 3.4 Jump, landing และ high fall

### Jump

- `Space` queue jump แต่ ignore ระหว่าง `Climb` และ `JumpUp`
- Jump จาก `Jog` หรือ `Spint` เลือก `RunningJump` ทันที
- Jump จาก standstill เลือก `Jump`
- กระโดดขณะ crouch จะพยายามสลับ standing collider หาก headroom ว่าง โดยไม่เล่น `CrouchedStanding`

### Landing

```ts
const LAND_DURATION = 1.0833333 - 0.5;
const HARD_LANDING_DURATION = 2.0166667;
```

- `Landing` เริ่ม action ที่ raw clip time `0.5` ใน PlayerModel
- ถ้าลงจาก Jump ปกติและยังถือทิศอยู่ ระบบยกเลิก Landing timer เพื่อเข้า Jog/Spint ทันที ไม่ทำให้ player สะดุด
- `HardLanding` จาก high fall เป็น one-shot เต็มและล็อก X velocity ระหว่าง grounded landing

### High fall

```ts
const HIGH_FALL_MIN_CLEARANCE = 2.25;
const HIGH_FALL_START_VELOCITY = -1.5;
```

เงื่อนไข high fall คือไม่ใช่ jump ปกติ, กำลังตก และพื้นห่าง/ไม่มีพื้นตาม threshold แล้ว latch `highFallActive`

ใน worktree ปัจจุบัน high-fall airborne ยังคง resolver เป็น `Jump`; ความต่างสำคัญของ high fall คือใช้ `HardLanding` เมื่อแตะพื้น

## 3.5 RunningSlide

### ค่า tuning หลัก

อยู่บนสุดของ `Player.tsx`:

```ts
const SLIDE_MIN_ENTRY_SPEED = 7;
const SLIDE_MIN_INITIAL_SPEED = 10.5;
const SLIDE_DRAG = 1.7;
const SLIDE_DURATION = 0.95;
const SLIDE_BLOCKED_SPEED = 0.2;
```

ความหมาย:

| ค่า | หน้าที่ | ถ้าต้องการให้ slide ไกลขึ้น |
| --- | --- | --- |
| `SLIDE_DURATION` | เวลาสูงสุดของ state | เพิ่ม เช่น `1.1` |
| `SLIDE_DRAG` | แรงหน่วงแบบ exponential | ลด เช่น `1.4` |
| `SLIDE_MIN_INITIAL_SPEED` | แรงส่งขั้นต่ำเฟรมเริ่ม slide | เพิ่มเล็กน้อย เช่น `11.5` |
| `SLIDE_BLOCKED_SPEED` | ความเร็วที่ถือว่าหยุด/ติดสิ่งกีดขวาง | ปกติไม่ต้องแก้ |
| `SLIDE_MIN_ENTRY_SPEED` | ความเร็วต่ำสุดที่อนุญาต slide | ลดเพื่อเข้า slide ง่ายขึ้น, ไม่ได้ทำให้ไกลขึ้นเอง |

ถ้าปรับ `SLIDE_DURATION` ต้องปรับ `SLIDE_ANIMATION_DURATION` ใน `PlayerModel.tsx` ให้เท่ากันเสมอ

### เงื่อนไขเริ่ม slide

ต้องครบทั้งหมด:

- เพิ่งกด C/Ctrl (`crouchPressed`) ไม่ใช่ hold ซ้ำ
- กด Shift และมี input direction
- animation ปัจจุบันเป็น `Spint` แล้ว จึงกัน Jog ไม่ให้ slide
- grounded, ไม่ใช่ touchdown frame, ไม่อยู่ Hang/Climb/JumpUp/Pushing/ground transition
- ยังไม่ได้ slide
- ความเร็วจริง `>= SLIDE_MIN_ENTRY_SPEED`

ระบบล็อกทิศจาก sign ของ physical X velocity ตอนเข้า slide และสลับไป crouch collider ตลอด duration

### Physics ของ slide

เฟรมเริ่ม:

```ts
entrySpeed = Math.max(
  Math.abs(currentVelocity.x),
  SLIDE_MIN_INITIAL_SPEED,
);
```

หลังจากนั้น:

```ts
nextSpeed = speedAlongSlide * Math.exp(-SLIDE_DRAG * safeDelta);
```

จึงยังคง momentum สูงจาก Spint ไว้ แต่มีแรงส่งขั้นต่ำสำหรับกรณีเริ่ม slide หลังเข้าสู่ Sprint ไม่นาน

state จบเมื่อ:

- ไม่ grounded
- ชน/ชะลอจนต่ำกว่า `SLIDE_BLOCKED_SPEED`
- ครบ `SLIDE_DURATION`

`slideTimer` ไม่เริ่มนับใน trigger frame เพื่อให้ animation action และ physics เริ่มใกล้กันมากขึ้น; timer ใช้ raw `delta` เพื่อให้ตรงกับ mixer ส่วน drag ยังคงใช้ `safeDelta` ป้องกัน physics ก้าวไกลเกินหลัง frame hitch

### Animation sync

ใน `PlayerModel.tsx`:

```ts
const SLIDE_ANIMATION_DURATION = 0.95;
```

raw clip `RunningSlide` ยาวประมาณ `1.55s` จึงถูกเล่นเร็วให้จบพร้อม physical state ที่ `0.95s` ไม่ได้ยืด root motion หรือใช้ animation ขยับ body

### Priority

`RunningSlide` อยู่เหนือ airborne locomotion, grounded transition และ Jog/Spint/Idle ใน resolver

Jump, Hang, Climb, RunJumpUp และ Landing/HardLanding ที่เป็น higher-priority ยังสามารถยกเลิก/แทน slide ได้ตาม gameplay

## 3.6 Ledge, Hang, Climb และ JumpUp

### Ray setup

Player ตรวจ ledge ด้วย:

1. lower horizontal ray ต้องชนผนัง
2. upper horizontal ray ต้องว่าง
3. downward top ray ต้องเจอผิวด้านบน

ใช้ `EXCLUDE_SENSORS` และ exclude player body เพื่อไม่ให้ ray ชน sensor/ตัวเอง

### Low ledge: `JumpUp`

ชื่อ internal flag ยังเป็น `isRunJumpingUp` แต่ resolver เลือก logical animation `JumpUp`

เงื่อนไขคือ player เพิ่ง jump และความสูงขอบไม่เกิน:

```ts
const RUN_JUMP_UP_MAX_LEDGE_HEIGHT =
  STANDING_COLLIDER_TOP_Y +
  PLAYER_FOOT_OFFSET +
  0.25;
```

ลำดับ:

- ล็อก flag ก่อน resolver ใน frame เดียวกัน จึงไม่ flash กลับ Jog/Spint
- ปิด gravity
- 60% แรก body ขึ้นแนวตั้ง
- 40% หลัง body เลื่อนเข้า platform
- duration `RUN_JUMP_UP_DURATION = 0.8`
- ปลายทางใช้ `topY + STANDING_BODY_TO_FOOT`
- เปิด gravity และตั้ง transient grounded state เพื่อกัน Jump/Landing ปลอมก่อน physics step ถัดไป

### High ledge: Hang และ Climb

ขอบสูงเข้าสู่:

```text
JumpHang → HangingIdle → Climb
```

- `JumpHang` state ใช้ `0.45s`
- `HangingIdle` ค้าง body ที่ `hangPosition`
- Space/W/ArrowUp queue climb
- S/ArrowDown queue `BracedHangDrop` (`0.65s`) และปล่อยกลับ airborne

### Climb

logical `Climb` map ไป raw clip `BracedHangCrouch`

```ts
const CLIMB_DURATION = 1.15;
const CLIMB_FORWARD_DISTANCE = 0.65;
```

การเคลื่อน body มีสอง phase:

1. 65% แรก: ขึ้นตรง ๆ ไป `climbUpPosition`
2. 35% หลัง: ขยับเข้า platform ไป `climbEndPosition`

ทั้งสองปลาย Y ใช้:

```ts
ledgeTopY + STANDING_BODY_TO_FOOT
```

ห้ามเพิ่ม root motion เพื่อแก้ตำแหน่ง Player เพราะ body/collider เป็น source of truth ของ traversal

## 3.7 Animation resolver และ one-shot

### Ground transition latch

```ts
type GroundTransition =
  | "CrouchedSpinting"
  | "CrouchedStanding"
  | "RunStop";
```

ใช้ `groundTransition`, timer และ `groundTransitionStartedThisFrame` เพื่อ:

- เริ่ม one-shot แค่ครั้งเดียว
- รอให้ resolver เลือก animation ก่อนเริ่มนับ timer
- ป้องกัน locomotion ปกติ reset action ทุกเฟรม
- clear transition เมื่อ jump/traversal/airborne/slide มี priority สูงกว่า

### RunStop

- เล่นเฉพาะเมื่อหยุดจาก `Spint`
- มี input grace `RUN_STOP_INPUT_GRACE = 0.12`
- Jog หยุดแล้วไป Idle ตรง เพื่อไม่ให้ขยับนิดเดียวแล้วสะดุด
- `RunStop` ใช้ duration `0.9166667s`

### RunningTurn180

clip `RunningTurn180` ยังอยู่ใน GLB แต่ **ไม่อยู่ใน `PlayerAnimation`, CLIP mapping หรือ Player state machine** ตามความต้องการล่าสุด

อย่า re-add state นี้โดยไม่มีแผนแก้ parent facing / Hips rotation พร้อมกัน เพราะ clip มี turn root pose ที่เคยทำให้เกิด double rotation ได้

### Resolver priority โดยสรุป

1. RunJumpUp / Climb / Hang / HangDrop
2. Landing / HardLanding
3. RunningSlide
4. Airborne Jump / RunningJump
5. Grounded one-shot (`CrouchedSpinting`, `CrouchedStanding`, `RunStop`)
6. Pushing
7. CrouchingIdle / CrouchWalking
8. Spint / Jog / Idle

normal locomotion ต้องไม่ตัด active one-shot เอง

## 3.8 Camera

กล้องอยู่ใน `Player.tsx` และตาม RigidBody โดยตรง

```ts
const CAMERA_DISTANCE = 13;
const CAMERA_HEIGHT = 3.5;
const CAMERA_TARGET_HEIGHT = 3;
const WALK_LOOK_AHEAD = 1.2;
const RUN_LOOK_AHEAD = 2;
```

- X/Z follow เร็วกว่า Y
- Y ตามช้าลดการเด้งช่วง Jump
- run มี look-ahead มากกว่า jog
- อย่าแก้กล้องเพียงเพราะ animation/visual offset ไม่ตรง: collision/body position คือ source of truth

---

# 4. Player animation (`PlayerModel.tsx`)

## หน้าที่

- โหลด `/player/student.glb`
- map logical state ไป raw GLB clip name
- clone/process animation tracks ให้ in-place
- rebind track ที่ผูก duplicate rig
- ตั้ง LoopOnce/LoopRepeat, clamp, crossfade และ playback speed
- synchronize `Climb` และ `JumpUp` clock กับ traversal physics

## Logical state mapping ปัจจุบัน

| Logical state | Raw GLB clip |
| --- | --- |
| `Idle` | `Idle` |
| `Jog` | `Jog` |
| `Spint` | `Spint` |
| `Jump` | `Jump` |
| `RunningJump` | `RunningJump` |
| `Landing` | `Landing` |
| `HardLanding` | `HardLanding` |
| `CrouchingIdle` | `CrouchingIdle` |
| `CrouchWalking` | `CrouchWalking` |
| `CrouchedSpinting` | `CrouchedSpinting` |
| `CrouchedStanding` | `CrouchedStanding` |
| `RunningSlide` | `RunningSlide` |
| `RunStop` | `RunStop` |
| `Pushing` | `Pushing` |
| `JumpHang` | `JumpHang` |
| `HangingIdle` | `HangingIdle` |
| `BracedHangDrop` | `BracedHangDrop` |
| `JumpUp` | `JumpUp` |
| `Climb` | `BracedHangCrouch` |

`RunJumpUp`, `Vault`, `SpintingRoll`, `WallClimp` และ raw `BracedHangCrouch` ยังมี type/mapping เพื่อรองรับงานอนาคต แต่ Player resolver ปัจจุบันไม่ได้ emit ทุก state เหล่านี้

## Animation clip ที่มีใน GLB

ใช้ spelling ตาม asset เท่านั้น:

| Clip | Raw duration (ประมาณ) | Runtime ใช้หรือไม่ |
| --- | ---: | --- |
| `BracedHangDrop` | 1.683s | ใช้, clock 0.65s |
| `CrouchedSpinting` | 0.517s | ใช้เป็น transition one-shot |
| `CrouchedStanding` | 0.650s | ใช้เฉพาะ manual crouch release |
| `CrouchingIdle` | 2.517s | ใช้ loop |
| `CrouchWalking` | 1.050s | ใช้ loop |
| `HangingIdle` | 2.350s | ใช้ loop |
| `HardLanding` | 2.017s | ใช้ one-shot |
| `Idle` | 1.967s | ใช้ loop |
| `Jog` | 0.733s | ใช้ loop |
| `Jump` | 1.383s | ใช้ one-shot |
| `JumpHang` | 1.267s | ใช้, clock 0.45s |
| `JumpUp` | 0.650s | ใช้, clock 0.8s |
| `Landing` | 1.083s | ใช้ one-shot; start time 0.5s |
| `Pushing` | 2.683s | ใช้ loop |
| `RunningJump` | 1.017s | ใช้ one-shot |
| `RunningSlide` | 1.550s | ใช้, clock 0.95s |
| `RunningTurn180` | 0.667s | มีใน asset แต่ถอดจาก runtime |
| `RunStop` | 0.917s | ใช้ one-shot |
| `Spint` | 0.550s | ใช้ loop |
| `SpintingRoll` | 1.183s | มี mapping แต่ยังไม่มี gameplay trigger |
| `Vault` | 3.550s | มี mapping แต่ยังไม่มี gameplay trigger |
| `WallClimp` | 1.800s | มี mapping แต่ยังไม่มี gameplay trigger |
| `BracedHangCrouch` | 1.150s | ใช้ผ่าน logical `Climb` |
| `RunJumpUp` | 2.183s | raw mapping/rebind มีอยู่ แต่ low ledge ปัจจุบันใช้ `JumpUp` |

Typo ใน asset เป็น source of truth:

- `Spint` ไม่ใช่ `Sprint` หรือ `Run`
- `CrouchedSpinting` ไม่ใช่ `CrouchedSprinting`
- `SpintingRoll` ไม่ใช่ `SpinningRoll`
- `WallClimp` ไม่ใช่ `WallClimb`

## One-shot และ playback

`PlayerModel` ตั้ง `LoopOnce`, `clampWhenFinished = true` ให้ state one-shot เช่น:

- Jump / RunningJump
- Landing / HardLanding
- RunningSlide
- CrouchedSpinting / CrouchedStanding / RunStop
- JumpHang / BracedHangDrop / JumpUp / Climb
- Vault / WallClimp / SpintingRoll

loop state หลัก:

- Idle, Jog, Spint
- CrouchingIdle, CrouchWalking
- HangingIdle, Pushing

`previousAction` guard สำคัญมาก: ถ้า action ใหม่เป็น action เดิม จะไม่ `reset()` ซ้ำทุก frame

Crossfade ปัจจุบัน:

```ts
const ANIMATION_FADE_DURATION = 0.15;
```

## Root motion / duplicate rig

Animation ถูก clone ก่อน process; ไฟล์ GLB ต้นฉบับไม่ถูกแก้ runtime

`IN_PLACE_CLIPS` ป้องกัน clip พา model เดินออกจาก Rapier body:

- Hips horizontal/depth movement ถูกล็อก
- Root/Armature translation ถูกล็อก
- clip ที่ต้องคง vertical pose detail เช่น Landing, RunningSlide, CrouchedStanding, RunStop จะเก็บ curve ที่จำเป็นไว้

Rig มีแกน local หมุน 90°:

```text
Hips local X = world horizontal
Hips local Y = world depth
Hips local Z = world vertical
```

### Track rebind ที่ห้ามลบ

บาง raw clip track ไปอยู่ duplicate skeleton ที่ไม่มี mesh แสดงผล:

- `BracedHangCrouch` → suffix `_2`
- `RunJumpUp` → suffix `_13`

`rebindTracksToVisibleRig()` จะ clone track ของ suffix เหล่านี้กลับไป skeleton หลัก

ห้ามลบ function นี้จนกว่าจะ re-export GLB ที่ bind rig ถูกต้อง

## Climb / JumpUp visual alignment

### Climb

`Climb` ใช้ raw `BracedHangCrouch` และถูก manual-drive ด้วย clock 1.15s เดียวกับ `Player.tsx` เพื่อกัน animation เร็ว/ช้ากว่า body

ค่าภาพเฉพาะ Hang/Climb:

```ts
const HANG_VISUAL_OFFSET_Y = -1.52;
const CLIMB_VISUAL_START_OFFSET_Y = -1.4;
const CLIMB_VISUAL_END_OFFSET_Y = -0.85;
```

### JumpUp

raw `JumpUp` เป็น in-place แต่ pose ปลายยังพับขา ทำให้ visual feet สูงกว่า Idle แม้ collider วางถูกแล้ว

จึงมี visual-only correction:

```ts
const JUMP_UP_VISUAL_SETTLE_START = 0.6;
const JUMP_UP_FINAL_FOOT_CORRECTION_Y = -0.583;
```

correction นี้:

- ใช้กับ `JumpUp` เท่านั้น
- ไม่มี root motion
- ไม่เปลี่ยน body/collider
- fade กลับศูนย์ใน 0.15s crossfade เพื่อลด snap

---

# 5. Printer (`ModelPrinter.tsx`)

## หน้าที่

- โหลด `/objects/printer.glb`
- recenter model จาก actual bounding box
- สร้าง CuboidCollider จาก actual scaled model size
- ให้ E จับ/ปล่อย Printer
- ดันจากทั้งสองด้านตาม physical player velocity
- ห้าม pull: ถ้า Player อยู่ด้านหน้าหรือเดินถอย Printer velocity X เป็นศูนย์
- ค่อย ๆ เลื่อน Printer จาก storage lane `z = -1.2` เข้า Player lane `z = 0`
- lock Printer เมื่อดันถึง target

## ค่า tuning

```ts
const PUSH_HAND_CONTACT_DISTANCE = 1.4;
const GRAB_DISTANCE_RANGE = 0.3;
const PRINTER_MODEL_SCALE = 0.8;
const FOLLOW_STRENGTH = 12;
const MAX_FOLLOW_SPEED = 12;
const PUSH_VELOCITY_THRESHOLD = 0.05;

const PRINTER_STORAGE_Z = -1.2;
const PLAYER_LANE_Z = 0;
const PRINTER_TARGET_X = 19.89;
const PRINTER_TARGET_TOLERANCE = 0.25;
```

`PUSH_HAND_CONTACT_DISTANCE` ถูกเพิ่มเพื่อให้มือของ clip `Pushing` แตะเครื่องโดย torso/head ไม่จมเข้าโมเดล อย่าแก้ `MODEL_OFFSET_Y` หรือ player collider เพื่อแก้ปัญหานี้

## Push-only behavior

เมื่อ E grab แล้ว:

- Player อยู่ซ้ายเครื่องและเคลื่อนขวา → ดันขวา
- Player อยู่ขวาเครื่องและเคลื่อนซ้าย → ดันซ้าย
- Player เดินห่าง, หยุด, หรืออยู่ด้านหน้าเครื่อง → Printer ไม่เคลื่อน
- จึงดันได้สองทิศ แต่ไม่เกิด pull

เป้าหมาย placement ยังคงอยู่ทางขวา (`x = 19.89`): การดันซ้ายทำให้ Printer ออกห่างเป้าหมาย ไม่สามารถ place สำเร็จจากการดันซ้าย

เมื่อถึง tolerance:

- ปิด sensor interaction
- clear grabbed/pushing state
- เปลี่ยน RigidBody เป็น `KinematicPositionBased`
- move final X/Z แบบ `setNextKinematicTranslation`

อย่าเปลี่ยน final placement เป็นการ `setTranslation()` วาร์ป เพราะจะทำให้ Rapier collision/velocity ไม่ต่อเนื่อง

---

# 6. Visual effects

effects เป็น sibling ของ Player RigidBody ใน world space จึงไม่ติดตาม body หลัง spawn และไม่เขียน physics / collider / animation state / camera

Player ส่ง mutable ref `PlayerEffectSnapshot` ให้ effects ทุก frame ไม่มี React state update ต่อ particle/frame

## 6.1 RunDustEffect

ไฟล์: `src/components/game/effects/RunDustEffect.tsx`

- pool mesh 14 ชิ้น
- particle ขยาย, ลอยเล็กน้อย, rotate และ fade out
- ยิ่งเร็ว dust ยิ่งถี่/ใหญ่/ทึบเล็กน้อย
- reset/hide ทันทีเมื่อไม่ grounded หรือ effect disabled

ค่าปรับหลัก:

```ts
export const DUST_POOL_SIZE = 14;
export const DUST_MIN_SPEED = 1.8;
export const DUST_RUN_SPEED = 11.5;
export const DUST_FULL_SPEED = 18;
export const DUST_JOG_SPAWN_INTERVAL = 0.17;
export const DUST_RUN_SPAWN_INTERVAL = 0.075;
export const DUST_MIN_LIFETIME = 0.38;
export const DUST_MAX_LIFETIME = 0.55;
```

## 6.2 SpeedLinesEffect

ไฟล์: `src/components/game/effects/SpeedLinesEffect.tsx`

- ใช้ `InstancedMesh` 10 เส้น ไม่สร้าง mesh ใหม่ทุก frame
- intensity fade in/out ด้วย ref
- ทิศเส้นอิง actual X velocity
- แสดงเมื่อ grounded, effect enabled, locomotion active และ speed เกิน threshold

ค่าปรับหลัก:

```ts
export const SPEED_LINE_COUNT = 10;
export const SPEED_LINE_MIN_SPEED = 13;
export const SPEED_LINE_FULL_SPEED = 18;
export const SPEED_LINE_MIN_LENGTH = 0.65;
export const SPEED_LINE_MAX_LENGTH = 1.35;
export const SPEED_LINE_THICKNESS = 0.018;
export const SPEED_LINE_MAX_OPACITY = 0.11;
```

effects ถูกปิดระหว่าง crouch, slide, Hang, Climb, JumpUp และ Pushing เพื่อไม่รบกวน visual ของ special state

---

# 7. สถานะที่ยังไม่เชื่อม หรือถูกถอดออกโดยตั้งใจ

## มีใน GLB แต่ Player resolver ยังไม่มี gameplay trigger

- `Vault`
- `SpintingRoll`
- `WallClimp`
- raw `RunJumpUp` (low ledge ปัจจุบันใช้ `JumpUp`)

ก่อนเชื่อมต้องตรวจ clip pose, collider, target body path และ one-shot exit state ไม่ควรเสียบชื่อ clip ลง resolver อย่างเดียว

## ถอดออกโดยตั้งใจ

- `RunningTurn180`

asset ยังมี clip แต่ runtime state ไม่มี turn one-shot นี้แล้ว; physical reverse inertia ใน `Player.tsx` ยังคงอยู่โดยไม่ใช้ animation turn

---

# 8. ลำดับทดสอบ manual ก่อนส่งงาน

## Movement / animation

1. Jog + Space → `RunningJump`
2. Spint + Space → `RunningJump`
3. ปล่อย movement จาก Jog → Idle ตรง ไม่มี `RunStop`
4. ปล่อย movement จาก Spint → `RunStop` ครั้งเดียว แล้ว Idle
5. กลับทิศจาก Jog/Spint → X velocity เบรกถึงศูนย์ก่อนเร่งอีกทาง

## Crouch

1. Hold C/Ctrl → `CrouchingIdle` หรือ `CrouchWalking`
2. ปล่อย C/Ctrl ขณะมี headroom → `CrouchedStanding` หนึ่งครั้ง แล้ว Idle/Jog/Spint
3. ถือ C+Ctrl พร้อมกัน → ปล่อยหนึ่งปุ่มต้องยังย่อ; ปล่อยปุ่มสุดท้ายจึงยืน
4. ปล่อยใต้เพดาน → อยู่ย่อจนพ้นเพดาน แล้วค่อยเล่น `CrouchedStanding`
5. Slide จบหลังปล่อย C/Ctrl → ไป locomotion โดยตรง ไม่มี `CrouchedStanding`
6. Jump/Climb/Reset จาก crouch → ไม่มี `CrouchedStanding` แทรก

## Slide

1. ต้องเข้า `Spint` ก่อน แล้วกด C/Ctrl → `RunningSlide`
2. Jog ปกติ หรือกด Shift+C จาก Jog frame เดียว → ไม่ควร slide
3. ตรวจว่าตัวใช้ crouch collider ระหว่าง slide ทั้งหมด
4. Spint ที่เร็วกว่าควรไถลไกลกว่า speed ต่ำ
5. ปล่อย C ระหว่าง slide → slide จบแล้วยืนตรงถ้า headroom ว่าง
6. ถือ C ระหว่าง slide → slide จบแล้วยังย่อ
7. กระโดด, ตกขอบ, ชนสิ่งกีดขวาง → slide ต้องจบอย่างปลอดภัย

## Traversal

1. Low ledge ขณะ jump → `JumpUp` ทันที ไม่มี Jog/Spint flash
2. High ledge → `JumpHang` → `HangingIdle`
3. Hang + Space/W → `Climb`
4. Hang + S → `BracedHangDrop`
5. ปลาย Climb/JumpUp: capsule bottom และ visual feet วางบน platform, ไม่ลอย/ไม่ตก/ไม่เล่น Landing ปลอม

## Printer / effects

1. E ใกล้ Printer → grab/release UI ถูกต้อง
2. ดันจากทั้งสองด้านได้ แต่เดินห่างแล้วไม่ดึง Printer
3. Player model ไม่จมเข้า Printer ขณะ Pushing
4. ดันขวาจนถึง x≈19.89 → lock placement
5. Jog มี dust เบา, Spint มี dust หนาและ speed lines
6. Jump/crouch/slide/hang/climb/push → effects หายตาม intended state

---

# 9. Known caveats / งานที่ควรระวังต่อ

- อย่าเพิ่ม dependency หรือ particle library สำหรับ effects; ของปัจจุบันใช้ Three/R3F ที่ติดตั้งแล้วและทำ pooling/instancing เรียบร้อย
- การเพิ่ม Slide duration ต้อง sync `Player.tsx::SLIDE_DURATION` กับ `PlayerModel.tsx::SLIDE_ANIMATION_DURATION`
- `SLIDE_MIN_INITIAL_SPEED` เป็น intentional launch assist: entry speed 7–10.5 ถูกยกเป็น 10.5; ถ้าต้องการ preserve exact momentum ให้เอา floor นี้ออกหรือปรับลด
- `RunningTurn180` ไม่ควรคืนกลับมาแบบ mapping ตรง ๆ เพราะ rig turn 180° ต้อง coordinate กับ parent facing rotation
- `RunJumpUp` raw clip มี duplicate rig `_13`; ถ้านำกลับมาใช้ต้องคง rebind code
- `BracedHangCrouch` raw clip มี duplicate rig `_2`; ห้ามลบ rebind code
- การเพิ่ม object pushable หลายชิ้นควรเปลี่ยน boolean `isPlayerPushing` ใน GameScene เป็น interaction manager/shared store ที่รู้ว่า object ใด active
- Map visual/collision setup ปัจจุบันไม่ใช่มาตรฐานทั่วไป (`map.glb` hidden, collision GLB visible) จึงตรวจ visual กับ physics พร้อมกันหลังแก้ asset

## ไฟล์ที่ควรอ่านตามลำดับสำหรับคนรับงานต่อ

1. `src/components/game/Player.tsx`
2. `src/components/game/PlayerModel.tsx`
3. `src/components/game/ModelPrinter.tsx`
4. `src/components/game/GameScene.tsx`
5. `src/components/game/Map.tsx`
6. `src/components/game/effects/RunDustEffect.tsx`
7. `src/components/game/effects/SpeedLinesEffect.tsx`
