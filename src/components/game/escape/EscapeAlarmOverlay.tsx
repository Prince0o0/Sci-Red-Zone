"use client";

type EscapeAlarmOverlayProps = {
  visible: boolean;
};

export default function EscapeAlarmOverlay({
  visible,
}: EscapeAlarmOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="
        pointer-events-none
        fixed
        inset-0
        z-[8500]
      "
    >
      {/* Red Flash */}

      <div
        className="
          absolute
          inset-0
          animate-pulse
          bg-red-600/15
        "
      />

      {/* Warning Border */}

      <div
        className="
          absolute
          inset-3
          animate-pulse
          border-4
          border-red-600/60
        "
      />

      {/* Warning */}

      <div
        className="
          absolute
          left-1/2
          top-20
          -translate-x-1/2
          rounded-xl
          border
          border-red-500/50
          bg-black/90
          px-10
          py-5
          text-center
          text-white
          shadow-2xl
        "
      >
        <div
          className="
            text-sm
            font-bold
            tracking-[0.4em]
            text-red-500
          "
        >
          WARNING
        </div>

        <div
          className="
            mt-2
            text-3xl
            font-black
          "
        >
          SYSTEM ALERT
        </div>

        <div
          className="
            mt-1
            text-sm
            text-red-200
          "
        >
          ตรวจพบสิ่งมีชีวิตผิดปกติ
        </div>
      </div>
    </div>
  );
}