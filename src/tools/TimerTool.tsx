import { useEffect, useRef, useState } from "react";
import { Field } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "스톱워치 · 타이머 · 뽀모도로. 탭이 백그라운드여도 시간은 정확히 유지됩니다.",
    stopwatch: "스톱워치",
    timer: "타이머",
    pomodoro: "뽀모도로",
    start: "시작",
    pause: "일시정지",
    reset: "리셋",
    lap: "랩",
    min: "분",
    sec: "초",
    work: "집중",
    brk: "휴식",
    round: "라운드",
    done: "완료!",
  },
  en: {
    intro: "Stopwatch · timer · pomodoro. Time stays accurate even when the tab is backgrounded.",
    stopwatch: "Stopwatch",
    timer: "Timer",
    pomodoro: "Pomodoro",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    lap: "Lap",
    min: "min",
    sec: "sec",
    work: "Focus",
    brk: "Break",
    round: "Round",
    done: "Done!",
  },
  zh: {
    intro: "秒表 · 计时器 · 番茄钟。即使标签页在后台，时间也保持准确。",
    stopwatch: "秒表",
    timer: "计时器",
    pomodoro: "番茄钟",
    start: "开始",
    pause: "暂停",
    reset: "重置",
    lap: "计次",
    min: "分",
    sec: "秒",
    work: "专注",
    brk: "休息",
    round: "轮次",
    done: "完成！",
  },
} as const;

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const cs = Math.floor((Math.max(0, ms) % 1000) / 10);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(s)}`
    : `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

type Mode = "stopwatch" | "timer" | "pomodoro";

export default function TimerTool() {
  const t = TEXT[useLang()];
  const [mode, setMode] = useState<Mode>("stopwatch");

  // 공통 시간 상태
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms
  const startRef = useRef(0);
  const baseRef = useRef(0);

  // 타이머 설정
  const [tMin, setTMin] = useState("5");
  const [tSec, setTSec] = useState("0");
  const [laps, setLaps] = useState<number[]>([]);

  // 뽀모도로
  const [pomoPhase, setPomoPhase] = useState<"work" | "break">("work");
  const [pomoRound, setPomoRound] = useState(1);
  const workMs = 25 * 60000;
  const breakMs = 5 * 60000;

  const targetMs =
    mode === "timer"
      ? (Number(tMin) * 60 + Number(tSec)) * 1000
      : mode === "pomodoro"
      ? pomoPhase === "work"
        ? workMs
        : breakMs
      : 0;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const e = baseRef.current + (now - startRef.current);
      if (mode === "stopwatch") {
        setElapsed(e);
      } else {
        const remain = targetMs - e;
        if (remain <= 0) {
          if (mode === "pomodoro") {
            // 단계 전환
            setRunning(false);
            setElapsed(0);
            baseRef.current = 0;
            if (pomoPhase === "work") setPomoPhase("break");
            else {
              setPomoPhase("work");
              setPomoRound((r) => r + 1);
            }
            return;
          }
          setElapsed(targetMs);
          setRunning(false);
          return;
        }
        setElapsed(e);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, mode, targetMs, pomoPhase]);

  const display = mode === "stopwatch" ? elapsed : Math.max(0, targetMs - elapsed);

  const toggle = () => {
    if (running) {
      baseRef.current = baseRef.current + (performance.now() - startRef.current);
      setRunning(false);
    } else {
      startRef.current = performance.now();
      setRunning(true);
    }
  };
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    baseRef.current = 0;
    setLaps([]);
    if (mode === "pomodoro") {
      setPomoPhase("work");
      setPomoRound(1);
    }
  };
  const lap = () => setLaps((l) => [elapsed, ...l]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setRunning(false);
    setElapsed(0);
    baseRef.current = 0;
    setLaps([]);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="flex gap-2">
        {(
          [
            ["stopwatch", t.stopwatch],
            ["timer", t.timer],
            ["pomodoro", t.pomodoro],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              m === mode
                ? "bg-indigo-600 text-white"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "timer" && (
        <div className="grid max-w-xs grid-cols-2 gap-3">
          <Field label={t.min}>
            <input
              type="number"
              min={0}
              value={tMin}
              onChange={(e) => setTMin(e.target.value)}
              disabled={running}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </Field>
          <Field label={t.sec}>
            <input
              type="number"
              min={0}
              max={59}
              value={tSec}
              onChange={(e) => setTSec(e.target.value)}
              disabled={running}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </Field>
        </div>
      )}

      {mode === "pomodoro" && (
        <div className="flex items-center gap-3 text-sm">
          <span
            className={`rounded-md px-2 py-1 font-medium ${
              pomoPhase === "work"
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
            }`}
          >
            {pomoPhase === "work" ? t.work : t.brk}
          </span>
          <span className="text-zinc-500">
            {t.round} {pomoRound}
          </span>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <div className="font-mono text-5xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
          {fmt(display)}
        </div>
        {mode !== "stopwatch" && display <= 0 && !running && (
          <div className="mt-2 text-sm font-medium text-indigo-500">{t.done}</div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggle}
          className="flex-1 rounded-md bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {running ? t.pause : t.start}
        </button>
        {mode === "stopwatch" && (
          <button
            onClick={lap}
            disabled={!running}
            className="rounded-md bg-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-300 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {t.lap}
          </button>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {t.reset}
        </button>
      </div>

      {mode === "stopwatch" && laps.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {laps.map((l, i) => (
            <li key={i} className="flex justify-between px-3 py-2 font-mono text-sm">
              <span className="text-zinc-500">#{laps.length - i}</span>
              <span>{fmt(l)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
