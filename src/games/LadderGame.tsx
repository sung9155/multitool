import { useEffect, useMemo, useRef, useState } from "react";
import { useLang, type Lang } from "../components/i18n";
import { makeLadder, traceLadder } from "./arcade";

const L10N: Record<Lang, Record<string, string>> = {
  ko: {
    players: "참가자 (쉼표로 구분)",
    prizes: "결과 (쉼표로 구분, 부족하면 '통과'로 채움)",
    shuffle: "🔀 다시 섞기",
    revealAll: "전체 공개",
    hint: "이름을 탭하면 사다리를 타고 내려갑니다",
    pass: "통과",
    coffee: "☕ 커피 쏘기",
  },
  en: {
    players: "Players (comma-separated)",
    prizes: "Outcomes (comma-separated, padded with 'pass')",
    shuffle: "🔀 Reshuffle",
    revealAll: "Reveal all",
    hint: "Tap a name to ride down the ladder",
    pass: "pass",
    coffee: "☕ Buys coffee",
  },
  zh: {
    players: "参与者（逗号分隔）",
    prizes: "结果（逗号分隔，不足补'过'）",
    shuffle: "🔀 重新洗牌",
    revealAll: "全部公开",
    hint: "点击名字沿梯子下行",
    pass: "过",
    coffee: "☕ 请咖啡",
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
];

const ROWS = 10;
const COL_W = 72;
const ROW_H = 30;
const PAD = 14;

function parseList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export default function LadderGame() {
  const lang = useLang();
  const s = (k: string) => L10N[lang][k] ?? L10N.ko[k] ?? k;

  const [namesRaw, setNamesRaw] = useState("A, B, C, D");
  const [prizesRaw, setPrizesRaw] = useState(() => L10N[lang].coffee);
  const [seed, setSeed] = useState(0); // 섞기 트리거
  const [revealed, setRevealed] = useState<number[]>([]); // 경로 애니메이션 시작된 기둥
  const [done, setDone] = useState<number[]>([]); // 애니메이션까지 끝나 결과 공개된 기둥
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const names = parseList(namesRaw);
  const cols = Math.max(names.length, 2);

  const prizes = useMemo(() => {
    const p = parseList(prizesRaw);
    while (p.length < cols) p.push(s("pass"));
    return p.slice(0, cols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prizesRaw, cols, lang]);

  const rungs = useMemo(
    () => makeLadder(cols, ROWS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cols, seed],
  );

  const traces = useMemo(
    () => Array.from({ length: cols }, (_, i) => traceLadder(rungs, i)),
    [rungs, cols],
  );

  const TRACE_MS = 1100;

  const reshuffle = () => {
    clearTimers();
    setSeed((x) => x + 1);
    setRevealed([]);
    setDone([]);
  };

  const reveal = (i: number) => {
    if (revealed.includes(i)) return;
    setRevealed((r) => (r.includes(i) ? r : [...r, i]));
    timers.current.push(
      setTimeout(
        () => setDone((d) => (d.includes(i) ? d : [...d, i])),
        TRACE_MS,
      ),
    );
  };

  const W = PAD * 2 + (cols - 1) * COL_W;
  const H = PAD * 2 + ROWS * ROW_H;
  const x = (c: number) => PAD + c * COL_W;
  const y = (r: number) => PAD + r * ROW_H;

  return (
    <div className="mx-auto max-w-xl">
      <style>{`@keyframes ladder-trace{to{stroke-dashoffset:0}}`}</style>

      <div className="mb-4 space-y-2">
        <label className="block text-sm">
          <span className="text-zinc-500">{s("players")}</span>
          <input
            value={namesRaw}
            onChange={(e) => {
              setNamesRaw(e.target.value);
              clearTimers();
              setRevealed([]);
              setDone([]);
            }}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white/70 px-3 py-2 outline-none focus:border-violet-500 dark:border-zinc-600 dark:bg-zinc-900/60"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">{s("prizes")}</span>
          <input
            value={prizesRaw}
            onChange={(e) => {
              setPrizesRaw(e.target.value);
              clearTimers();
              setRevealed([]);
              setDone([]);
            }}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white/70 px-3 py-2 outline-none focus:border-violet-500 dark:border-zinc-600 dark:bg-zinc-900/60"
          />
        </label>
        <div className="flex gap-2">
          <button
            onClick={reshuffle}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {s("shuffle")}
          </button>
          <button
            onClick={() => names.forEach((_, i) => reveal(i))}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {s("revealAll")}
          </button>
          <span className="ml-auto self-center text-xs text-zinc-500">
            {s("hint")}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/50 bg-white/60 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/50">
        {/* 이름 버튼 */}
        <div
          className="relative mx-auto"
          style={{ width: W }}
        >
          <div className="flex" style={{ width: W }}>
            {names.map((n, i) => (
              <button
                key={i}
                onClick={() => reveal(i)}
                className="absolute -translate-x-1/2 rounded-md px-2 py-1 text-sm font-semibold text-white"
                style={{ left: x(i), backgroundColor: COLORS[i % COLORS.length] }}
              >
                {n}
              </button>
            ))}
          </div>
          <svg width={W} height={H} className="mt-9 block">
            {/* 기둥 */}
            {Array.from({ length: cols }, (_, c) => (
              <line
                key={c}
                x1={x(c)}
                y1={y(0)}
                x2={x(c)}
                y2={y(ROWS)}
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
            {/* 가로대 */}
            {rungs.map((row, r) =>
              row.map((c) => (
                <line
                  key={`${r}-${c}`}
                  x1={x(c)}
                  y1={y(r) + ROW_H / 2}
                  x2={x(c + 1)}
                  y2={y(r) + ROW_H / 2}
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )),
            )}
            {/* 공개된 경로 */}
            {revealed.map((start) => {
              const pts: string[] = [];
              let prev = start;
              pts.push(`${x(start)},${y(0)}`);
              traces[start].path.forEach(([r, c]) => {
                if (r === 0) return;
                const midY = y(r - 1) + ROW_H / 2;
                if (c !== prev) {
                  // 가로대 높이까지 내려간 뒤 옆으로
                  pts.push(`${x(prev)},${midY}`);
                  pts.push(`${x(c)},${midY}`);
                }
                prev = c;
              });
              pts.push(`${x(prev)},${y(ROWS)}`);
              return (
                <polyline
                  key={`${start}-${seed}`}
                  points={pts.join(" ")}
                  fill="none"
                  stroke={COLORS[start % COLORS.length]}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1}
                  style={{ animation: "ladder-trace 1.1s ease-out forwards" }}
                />
              );
            })}
          </svg>
          {/* 결과 */}
          <div className="relative h-8" style={{ width: W }}>
            {prizes.map((p, i) => {
              const winner = done.find((st) => traces[st].end === i);
              return (
                <span
                  key={i}
                  className={`absolute -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${
                    winner !== undefined
                      ? "text-white"
                      : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                  }`}
                  style={
                    winner !== undefined
                      ? { left: x(i), backgroundColor: COLORS[winner % COLORS.length] }
                      : { left: x(i) }
                  }
                >
                  {p}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 공개된 매칭 요약 */}
      {done.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {done.map((st) => (
            <li
              key={st}
              className="rounded-full px-3 py-1 font-medium text-white"
              style={{ backgroundColor: COLORS[st % COLORS.length] }}
            >
              {names[st]} → {prizes[traces[st].end]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
