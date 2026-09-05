import { useRef, useState } from "react";
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

/** 조각 i (i*step ~ (i+1)*step, 12시부터 시계방향) 의 부채꼴 path */
function slicePath(i: number, n: number): string {
  const step = (2 * Math.PI) / n;
  const a0 = i * step - Math.PI / 2;
  const a1 = a0 + step;
  const R = 96;
  const x0 = R * Math.cos(a0);
  const y0 = R * Math.sin(a0);
  const x1 = R * Math.cos(a1);
  const y1 = R * Math.sin(a1);
  const large = step > Math.PI ? 1 : 0;
  return `M0,0 L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`;
}

export default function WheelGame() {
  const lang = useLang();
  const s = (k: string) => L10N[lang][k] ?? L10N.ko[k] ?? k;

  const [raw, setRaw] = useState("철수, 영희, 민수, 지영");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const names = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);
  const n = names.length;

  const spin = () => {
    if (spinning || n < 2) return;
    setWinner(null);
    setSpinning(true);
    const target = rotation + 5 * 360 + Math.random() * 360;
    setRotation(target);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSpinning(false);
      setWinner(wheelWinner(target % 360, n));
    }, SPIN_MS + 100);
  };

  const step = 360 / Math.max(n, 1);

  return (
    <div className="mx-auto max-w-sm text-center">
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
        {/* 12시 포인터 */}
        <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 text-2xl">
          🔻
        </div>
        <svg
          viewBox="-100 -100 200 200"
          className="h-72 w-72"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? `transform ${SPIN_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
              : "none",
          }}
        >
          {names.map((name, i) => {
            const mid = i * step + step / 2 - 90;
            return (
              <g key={i}>
                {n === 1 ? (
                  <circle r="96" fill={COLORS[0]} />
                ) : (
                  <path d={slicePath(i, n)} fill={COLORS[i % COLORS.length]} />
                )}
                <text
                  x="0"
                  y="0"
                  transform={`rotate(${mid}) translate(60 0) rotate(90)`}
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
          <circle r="14" fill="white" className="dark:opacity-90" />
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
