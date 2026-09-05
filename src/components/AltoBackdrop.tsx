/** Alto's Adventure 풍 배경: 해/달 + 능선 실루엣 3겹 (고정, 비상호작용) */
export default function AltoBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 해 / 달 */}
      <div
        className="absolute right-[12%] top-[14%] h-28 w-28 rounded-full blur-[1px] opacity-80"
        style={{
          background:
            "radial-gradient(circle, var(--sun) 0%, var(--sun) 55%, transparent 70%)",
        }}
      />
      <svg
        className="absolute inset-x-0 bottom-0 w-full"
        viewBox="0 0 1440 420"
        preserveAspectRatio="none"
        style={{ height: "58vh" }}
      >
        <path
          fill="var(--ridge-far)"
          opacity="0.55"
          d="M0 300 L180 190 L300 250 L470 130 L640 240 L810 160 L980 245 L1150 165 L1300 235 L1440 180 L1440 420 L0 420 Z"
        />
        <path
          fill="var(--ridge-mid)"
          opacity="0.8"
          d="M0 340 L140 260 L280 320 L430 215 L580 305 L760 225 L900 315 L1080 240 L1240 320 L1440 255 L1440 420 L0 420 Z"
        />
        <path
          fill="var(--ridge-near)"
          d="M0 400 L160 335 L340 395 L520 300 L700 385 L880 315 L1060 395 L1250 330 L1440 390 L1440 420 L0 420 Z"
        />
      </svg>
    </div>
  );
}
