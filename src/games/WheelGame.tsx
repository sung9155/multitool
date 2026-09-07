import { useEffect, useRef, useState } from "react";
import { useLang, type Lang } from "../components/i18n";
import { wheelWinner } from "./arcade";

const L10N: Record<Lang, Record<string, string>> = {
  ko: {
    players: "이름 (쉼표로 구분)",
    spin: "🎡 돌리기",
    spinning: "돌아가는 중…",
    winner: "당첨",
  },
  en: {
    players: "Names (comma-separated)",
    spin: "🎡 Spin",
    spinning: "Spinning…",
    winner: "Winner",
  },
  zh: {
    players: "名字（逗号分隔）",
    spin: "🎡 转动",
    spinning: "转动中…",
    winner: "中选",
  },
};

const COLORS = [
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#0ea5e9",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#eab308",
];

const SPIN_MS = 4000;

const R_SLICE = 90; // 조각 반경
const R_PEG = 84; // 페그(핀) 줄 반경 — 플리퍼가 여기 걸린다
const R_BAND = 97; // 금색 림 중심 반경

/** 조각 i (i*step ~ (i+1)*step, 12시부터 시계방향) 의 부채꼴 path */
function slicePath(i: number, n: number): string {
  const step = (2 * Math.PI) / n;
  const a0 = i * step - Math.PI / 2;
  const a1 = a0 + step;
  const x0 = R_SLICE * Math.cos(a0);
  const y0 = R_SLICE * Math.sin(a0);
  const x1 = R_SLICE * Math.cos(a1);
  const y1 = R_SLICE * Math.sin(a1);
  const large = step > Math.PI ? 1 : 0;
  return `M0,0 L${x0},${y0} A${R_SLICE},${R_SLICE} 0 ${large} 1 ${x1},${y1} Z`;
}

const deg2xy = (deg: number, r: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
};

export default function WheelGame() {
  const lang = useLang();
  const s = (k: string) => L10N[lang][k] ?? L10N.ko[k] ?? k;

  const [raw, setRaw] = useState("🐶 강아지, 🐱 고양이, 🐰 토끼, 🦊 여우, 🐻 곰, 🐼 판다");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const wheelRef = useRef<SVGSVGElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const names = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);
  const n = names.length;
  const step = 360 / Math.max(n, 1);
  // 실물 카니발 휠처럼 페그는 조각 경계보다 촘촘하게 (조각당 3개, 최소 24개)
  const pegCount = Math.max(24, n * 3);
  const pegStep = 360 / pegCount;

  /** 조각 경계를 지날 때마다 화살표가 턱 걸렸다 튕겨 돌아온다 */
  const kickPointer = () => {
    const el = pointerRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = "rotate(20deg)";
    requestAnimationFrame(() => {
      el.style.transition = "transform 100ms cubic-bezier(.2, 2.2, .4, 1)";
      el.style.transform = "rotate(0deg)";
    });
  };

  const spin = () => {
    if (spinning || n < 2) return;
    setWinner(null);
    setSpinning(true);
    cancelAnimationFrame(raf.current);

    const start = rotation;
    const target = start + 5 * 360 + Math.random() * 360;
    const t0 = performance.now();
    let lastNotch = Math.floor(start / pegStep);

    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / SPIN_MS);
      const rot = start + (target - start) * (1 - Math.pow(1 - p, 3)); // ease-out
      if (wheelRef.current)
        wheelRef.current.style.transform = `rotate(${rot}deg)`;
      const notch = Math.floor(rot / pegStep);
      if (notch !== lastNotch) {
        lastNotch = notch;
        kickPointer();
      }
      if (p < 1) {
        raf.current = requestAnimationFrame(frame);
      } else {
        setRotation(target);
        setSpinning(false);
        setWinner(wheelWinner(target % 360, n));
      }
    };
    raf.current = requestAnimationFrame(frame);
  };

  return (
    <div className="mx-auto max-w-xl text-center">
      <style>{`@keyframes wheel-twinkle { 50% { opacity: .25; } }`}</style>
      <label className="mb-4 block text-left text-sm">
        <span className="text-zinc-500">{s("players")}</span>
        <input
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setWinner(null);
          }}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white/70 px-3 py-2 outline-none focus:border-violet-500 dark:border-zinc-600 dark:bg-zinc-900/60"
        />
      </label>

      <div className="relative mx-auto w-fit">
        {/* 12시 플리퍼 — 페그에 걸렸다 튕겨 돌아온다 */}
        <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
          <div ref={pointerRef} style={{ transformOrigin: "50% 20%" }}>
            <svg width="30" height="56" viewBox="0 0 30 56">
              <path
                d="M15 55 L4 13 A11.5 11.5 0 1 1 26 13 Z"
                fill="#ef4444"
                stroke="#991b1b"
                strokeWidth="2"
              />
              <circle cx="15" cy="11.5" r="4" fill="#fecaca" />
            </svg>
          </div>
        </div>
        <svg
          ref={wheelRef}
          viewBox="-112 -112 224 224"
          className="h-80 w-80 drop-shadow-xl sm:h-[26rem] sm:w-[26rem]"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* 바깥 테두리 + 금색 림 */}
          <circle r="108" fill="#78350f" />
          <circle r={R_BAND} fill="none" stroke="#d97706" strokeWidth="15" />
          {/* 조각 */}
          {names.map((name, i) => {
            const mid = i * step + step / 2 - 90;
            return (
              <g key={i}>
                {n === 1 ? (
                  <circle r={R_SLICE} fill={COLORS[0]} />
                ) : (
                  <path d={slicePath(i, n)} fill={COLORS[i % COLORS.length]} />
                )}
                <text
                  x="0"
                  y="0"
                  transform={`rotate(${mid}) translate(56 0) rotate(90)`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize={n > 6 ? 10 : 13}
                  fontWeight="700"
                >
                  {name.slice(0, 6)}
                </text>
              </g>
            );
          })}
          {/* 조각 구분선 */}
          {n >= 2 &&
            names.map((_, i) => {
              const [x2, y2] = deg2xy(i * step, R_SLICE);
              return (
                <line
                  key={`sep-${i}`}
                  x1="0"
                  y1="0"
                  x2={x2}
                  y2={y2}
                  stroke="#fff"
                  strokeOpacity="0.7"
                  strokeWidth="1.5"
                />
              );
            })}
          {/* 림 위 전구 장식 (반짝임) */}
          {n >= 2 &&
            Array.from({ length: n * 2 }, (_, i) => {
              const [cx, cy] = deg2xy((i * step) / 2, R_BAND);
              return (
                <circle
                  key={`bulb-${i}`}
                  cx={cx}
                  cy={cy}
                  r="3"
                  fill="#fef3c7"
                  stroke="#b45309"
                  strokeWidth="1"
                  style={{
                    animation: `wheel-twinkle 1.2s ease-in-out ${i % 2 ? 0.6 : 0}s infinite`,
                  }}
                />
              );
            })}
          {/* 페그 — 촘촘한 핀 줄, 플리퍼가 여기 걸린다 */}
          {Array.from({ length: pegCount }, (_, i) => {
            const [cx, cy] = deg2xy(i * pegStep, R_PEG);
            return (
              <g key={`peg-${i}`}>
                <circle cx={cx} cy={cy} r="3.2" fill="#e4e4e7" stroke="#52525b" strokeWidth="1.2" />
                <circle cx={cx - 0.8} cy={cy - 0.8} r="1" fill="#fff" />
              </g>
            );
          })}
          {/* 중심 허브 */}
          <circle r="17" fill="#f59e0b" stroke="#b45309" strokeWidth="3" />
          <circle r="6" fill="#7c2d12" />
        </svg>
      </div>

      <button
        onClick={spin}
        disabled={spinning || n < 2}
        className="mt-4 rounded-md bg-violet-600 px-6 py-3 text-base font-medium text-white hover:bg-violet-500 disabled:opacity-40"
      >
        {spinning ? s("spinning") : s("spin")}
      </button>

      {winner !== null && names[winner] && (
        <div className="mt-4 rounded-xl bg-violet-100 px-4 py-3 text-lg font-bold text-violet-700 dark:bg-violet-600/20 dark:text-violet-300">
          🎉 {s("winner")}: {names[winner]}
        </div>
      )}
    </div>
  );
}
