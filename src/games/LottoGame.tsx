import { useEffect, useMemo, useRef, useState } from "react";
import { useLang, type Lang } from "../components/i18n";
import {
  PRIZES,
  TICKET_PRICE,
  draw,
  pickUnique,
  rankOf,
  simulate,
  type Draw,
  type SimResult,
} from "./lotto";

const MAX_TICKETS = 5;

const L10N: Record<
  Lang,
  Record<string, string>
> = {
  ko: {
    myTickets: "내 티켓",
    auto: "+ 자동 1장",
    manual: "직접 고르기",
    manualHint: "번호 6개를 고르세요",
    add: "담기",
    cancel: "취소",
    clear: "전부 비우기",
    drawBtn: "🎉 추첨 시작",
    drawing: "추첨 중",
    bonus: "보너스",
    again: "한 번 더",
    lose: "낙첨",
    rank: "등",
    total: "합계",
    spent: "지출",
    winTitle: "축하합니다!",
    loseTitle: "다음 기회에…",
    simTitle: "현실 체험: 오래 사면 얼마나 딸까?",
    simSub: "매주 자동 5장씩 샀을 때를 즉시 시뮬레이션 (1~3등 당첨금은 평균 추정치)",
    years: "년",
    simSpent: "총 지출",
    simWon: "총 당첨금",
    simNet: "손익",
    simRounds: "회차",
    simTickets: "티켓",
    empty: "티켓이 없어요 — 자동 1장부터 시작!",
  },
  en: {
    myTickets: "My tickets",
    auto: "+ Quick pick",
    manual: "Pick numbers",
    manualHint: "Choose 6 numbers",
    add: "Add",
    cancel: "Cancel",
    clear: "Clear all",
    drawBtn: "🎉 Draw!",
    drawing: "Drawing",
    bonus: "Bonus",
    again: "Again",
    lose: "No win",
    rank: "Rank ",
    total: "Total",
    spent: "Spent",
    winTitle: "Congratulations!",
    loseTitle: "Better luck next time…",
    simTitle: "Reality check: play for years, win how much?",
    simSub: "Instantly simulates 5 quick picks every week (top prizes are average estimates)",
    years: "yr",
    simSpent: "Spent",
    simWon: "Won",
    simNet: "Net",
    simRounds: "draws",
    simTickets: "tickets",
    empty: "No tickets yet — start with a quick pick!",
  },
  zh: {
    myTickets: "我的彩票",
    auto: "+ 机选一注",
    manual: "自选号码",
    manualHint: "选择 6 个号码",
    add: "加入",
    cancel: "取消",
    clear: "清空",
    drawBtn: "🎉 开奖",
    drawing: "开奖中",
    bonus: "特别号",
    again: "再来一次",
    lose: "未中奖",
    rank: "等奖 ",
    total: "合计",
    spent: "支出",
    winTitle: "恭喜！",
    loseTitle: "下次好运…",
    simTitle: "现实体验：买很多年能赚多少？",
    simSub: "模拟每周机选 5 注（高等奖金为平均估算值）",
    years: "年",
    simSpent: "总支出",
    simWon: "总奖金",
    simNet: "盈亏",
    simRounds: "期",
    simTickets: "注",
    empty: "还没有彩票 — 先机选一注吧！",
  },
};

/** 실제 로또 공 색: 1-10 노랑, 11-20 파랑, 21-30 빨강, 31-40 회색, 41-45 초록 */
function ballClass(n: number): string {
  if (n <= 10) return "bg-amber-400 text-amber-950";
  if (n <= 20) return "bg-sky-500 text-white";
  if (n <= 30) return "bg-red-500 text-white";
  if (n <= 40) return "bg-zinc-500 text-white";
  return "bg-emerald-500 text-white";
}

function Ball({
  n,
  dim,
  ring,
  pop,
  size = "h-9 w-9 text-sm",
}: {
  n: number;
  dim?: boolean;
  ring?: boolean;
  pop?: boolean;
  size?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-white/50 via-transparent to-black/20 font-bold shadow-lg ${size} ${ballClass(n)} ${
        dim ? "opacity-30" : ""
      } ${ring ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900" : ""}`}
      style={pop ? { animation: "ball-pop .5s cubic-bezier(.34,1.56,.64,1) both" } : undefined}
    >
      {n}
    </span>
  );
}

/** 당첨 시 흩날리는 콘페티 */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        dur: 2.2 + Math.random() * 2,
        char: ["🎉", "✨", "💸", "🎊", "⭐"][i % 5],
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute -top-8 text-xl"
          style={{
            left: `${p.left}%`,
            animation: `confetti-fall ${p.dur}s linear ${p.delay}s both`,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}

const CARD =
  "rounded-xl border border-white/50 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/50";

const BTN =
  "rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40";
const BTN2 =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800";

const RANK_LABEL = ["", "🥇 1", "🥈 2", "🥉 3", "4", "5"];

export default function LottoGame() {
  const lang = useLang();
  const s = (k: string) => L10N[lang][k] ?? L10N.ko[k] ?? k;
  const fmt = (n: number) => n.toLocaleString();

  const [tickets, setTickets] = useState<number[][]>(() => [pickUnique(6)]);
  const [picking, setPicking] = useState(false);
  const [sel, setSel] = useState<number[]>([]);
  const [result, setResult] = useState<Draw | null>(null);
  const [revealed, setRevealed] = useState(0); // 0~7 (7 = 보너스까지)
  const [sim, setSim] = useState<{
    years: number;
    r: SimResult;
    running: boolean;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      if (simTimer.current) clearInterval(simTimer.current);
    },
    [],
  );

  /** 현실 체험: 회차를 잘게 쪼개 실제로 돌리면서 숫자가 실시간으로 차오르게 */
  const runSim = (years: number) => {
    if (simTimer.current) clearInterval(simTimer.current);
    const totalRounds = 52 * years;
    const chunk = Math.max(1, Math.ceil(totalRounds / 90)); // 약 2.7초 분량
    const acc: SimResult = {
      rounds: 0,
      tickets: 0,
      spent: 0,
      won: 0,
      ranks: [0, 0, 0, 0, 0, 0],
    };
    setSim({ years, r: { ...acc, ranks: [...acc.ranks] }, running: true });
    simTimer.current = setInterval(() => {
      const step = Math.min(chunk, totalRounds - acc.rounds);
      const part = simulate(step, 5);
      acc.rounds += part.rounds;
      acc.tickets += part.tickets;
      acc.spent += part.spent;
      acc.won += part.won;
      for (let k = 1; k <= 5; k++) acc.ranks[k] += part.ranks[k];
      const finished = acc.rounds >= totalRounds;
      if (finished && simTimer.current) clearInterval(simTimer.current);
      setSim({
        years,
        r: { ...acc, ranks: [...acc.ranks] },
        running: !finished,
      });
    }, 30);
  };

  const drawing = result !== null && revealed < 7;
  const done = result !== null && revealed >= 7;

  const startDraw = () => {
    if (tickets.length === 0 || drawing) return;
    if (timer.current) clearInterval(timer.current);
    setResult(draw());
    setRevealed(0);
    timer.current = setInterval(() => {
      setRevealed((r) => {
        if (r + 1 >= 7 && timer.current) clearInterval(timer.current);
        return r + 1;
      });
    }, 600);
  };

  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    setResult(null);
    setRevealed(0);
  };

  const toggleNum = (n: number) =>
    setSel((prev) =>
      prev.includes(n)
        ? prev.filter((x) => x !== n)
        : prev.length < 6
          ? [...prev, n].sort((a, b) => a - b)
          : prev,
    );

  const winSet = done ? new Set(result!.nums) : null;
  const totalWon = done
    ? tickets.reduce((acc, tk) => acc + (PRIZES[rankOf(tk, result!)] ?? 0), 0)
    : 0;
  const spent = tickets.length * TICKET_PRICE;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <style>{`
        @keyframes ball-pop { 0% { transform: scale(0) rotate(-180deg); } 100% { transform: scale(1) rotate(0deg); } }
        @keyframes confetti-fall { to { transform: translateY(560px) rotate(540deg); opacity: 0; } }
        @keyframes draw-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
      `}</style>

      {/* 내 티켓 */}
      <div className={CARD}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto font-semibold">
            {s("myTickets")}{" "}
            <span className="text-sm font-normal text-zinc-500">
              {tickets.length}/{MAX_TICKETS} · ₩{fmt(spent)}
            </span>
          </h3>
          <button
            className={BTN2}
            disabled={tickets.length >= MAX_TICKETS || drawing}
            onClick={() => {
              setTickets((t) => [...t, pickUnique(6)]);
              reset();
            }}
          >
            {s("auto")}
          </button>
          <button
            className={BTN2}
            disabled={tickets.length >= MAX_TICKETS || drawing}
            onClick={() => {
              setPicking((p) => !p);
              setSel([]);
            }}
          >
            {picking ? s("cancel") : s("manual")}
          </button>
          <button
            className={BTN2}
            disabled={tickets.length === 0 || drawing}
            onClick={() => {
              setTickets([]);
              reset();
            }}
          >
            {s("clear")}
          </button>
        </div>

        {/* 수동 선택 그리드 */}
        {picking && (
          <div className="mb-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="mb-2 text-sm text-zinc-500">
              {s("manualHint")} ({sel.length}/6)
            </p>
            <div className="grid grid-cols-9 gap-1.5">
              {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => toggleNum(n)}
                  className={`h-8 rounded-full text-xs font-semibold ${
                    sel.includes(n)
                      ? ballClass(n)
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              className={`${BTN} mt-3`}
              disabled={sel.length !== 6}
              onClick={() => {
                setTickets((t) => [...t, sel]);
                setPicking(false);
                setSel([]);
                reset();
              }}
            >
              {s("add")}
            </button>
          </div>
        )}

        {tickets.length === 0 && (
          <p className="text-sm text-zinc-500">{s("empty")}</p>
        )}
        <div className="space-y-2">
          {tickets.map((tk, i) => {
            const rank = done ? rankOf(tk, result!) : 0;
            return (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <span className="w-5 text-xs text-zinc-400">{String.fromCharCode(65 + i)}</span>
                {tk.map((n) => (
                  <Ball
                    key={n}
                    n={n}
                    size="h-8 w-8 text-xs"
                    dim={done ? !winSet!.has(n) && n !== result!.bonus : false}
                    ring={done && (winSet!.has(n) || (rank === 2 && n === result!.bonus))}
                  />
                ))}
                {done && (
                  <span
                    className={`ml-1 text-sm font-semibold ${
                      rank > 0 ? "text-violet-600 dark:text-violet-300" : "text-zinc-400"
                    }`}
                  >
                    {rank > 0
                      ? `${RANK_LABEL[rank]}${s("rank")} +₩${fmt(PRIZES[rank])}`
                      : s("lose")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 추첨 스테이지 */}
      <div className="relative flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-700 via-fuchsia-700 to-indigo-800 p-6 text-center text-white shadow-xl">
        {/* 은은한 빛 번짐 */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
        {done && totalWon > 0 && <Confetti />}

        {result === null ? (
          <>
            <div className="text-6xl">🎰</div>
            <button
              className="mt-5 rounded-full bg-white px-8 py-3 text-lg font-bold text-violet-700 shadow-lg transition-transform hover:scale-105 disabled:opacity-40"
              disabled={tickets.length === 0}
              onClick={startDraw}
            >
              {s("drawBtn")}
            </button>
          </>
        ) : (
          <>
            <div className="flex min-h-14 flex-wrap items-center justify-center gap-2">
              {result.nums.slice(0, Math.min(revealed, 6)).map((n) => (
                <Ball key={n} n={n} pop size="h-12 w-12 text-lg" />
              ))}
              {revealed >= 7 && (
                <>
                  <span className="mx-1 text-2xl text-white/60">+</span>
                  <Ball n={result.bonus} pop size="h-12 w-12 text-lg" />
                </>
              )}
            </div>

            {drawing ? (
              <p
                className="mt-5 text-lg font-semibold tracking-widest"
                style={{ animation: "draw-pulse 1s ease-in-out infinite" }}
              >
                🎰 {s("drawing")}…
              </p>
            ) : (
              <>
                <p className="mt-5 text-2xl font-black">
                  {totalWon > 0 ? `🎉 ${s("winTitle")}` : s("loseTitle")}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {s("spent")} ₩{fmt(spent)} →{" "}
                  <b
                    className={`text-lg ${totalWon >= spent ? "text-emerald-300" : "text-red-300"}`}
                  >
                    ₩{fmt(totalWon)}
                  </b>
                </p>
                <button
                  className="mt-4 rounded-full bg-white/20 px-6 py-2 font-semibold backdrop-blur hover:bg-white/30"
                  onClick={reset}
                >
                  ↻ {s("again")}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* 대량 시뮬레이션 */}
      <div className={`${CARD} lg:col-span-2`}>
        <h3 className="font-semibold">{s("simTitle")}</h3>
        <p className="mt-1 text-sm text-zinc-500">{s("simSub")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 10, 40].map((y) => (
            <button
              key={y}
              className={`${BTN2} ${sim?.years === y ? "border-violet-500 text-violet-600 dark:text-violet-300" : ""}`}
              disabled={sim?.running}
              onClick={() => runSim(y)}
            >
              {y}
              {s("years")}
            </button>
          ))}
          {sim && (
            <span className="self-center text-sm tabular-nums text-zinc-500">
              {sim.running && <span className="mr-1 animate-pulse">⏳</span>}
              {fmt(sim.r.rounds)}
              {s("simRounds")} · {fmt(sim.r.tickets)}
              {s("simTickets")}
            </span>
          )}
        </div>
        {sim && (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800/60">
                <div className="text-xs text-zinc-500">{s("simSpent")}</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  ₩{fmt(sim.r.spent)}
                </div>
              </div>
              <div className="rounded-lg bg-violet-100 p-4 dark:bg-violet-600/20">
                <div className="text-xs text-violet-600 dark:text-violet-300">
                  {s("simWon")}
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-violet-700 dark:text-violet-300">
                  ₩{fmt(sim.r.won)}
                </div>
              </div>
              <div
                className={`rounded-lg p-4 ${
                  sim.r.won - sim.r.spent >= 0
                    ? "bg-emerald-100 dark:bg-emerald-600/20"
                    : "bg-red-100 dark:bg-red-600/15"
                }`}
              >
                <div
                  className={`text-xs ${
                    sim.r.won - sim.r.spent >= 0
                      ? "text-emerald-600 dark:text-emerald-300"
                      : "text-red-500 dark:text-red-300"
                  }`}
                >
                  {s("simNet")}
                </div>
                <div
                  className={`mt-1 text-2xl font-bold tabular-nums ${
                    sim.r.won - sim.r.spent >= 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-red-600 dark:text-red-300"
                  }`}
                >
                  {sim.r.won - sim.r.spent >= 0 ? "+" : ""}
                  ₩{fmt(sim.r.won - sim.r.spent)}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {[1, 2, 3, 4, 5].map((rk) => (
                <span
                  key={rk}
                  className={`rounded-full px-3 py-1 ${
                    sim.r.ranks[rk] > 0
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-300"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                  }`}
                >
                  {RANK_LABEL[rk]}
                  {s("rank")} × {fmt(sim.r.ranks[rk])}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
