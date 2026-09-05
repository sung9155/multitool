import type { ReactNode } from "react";
import { useT } from "../components/i18n";

/** 인게임 하늘 — 페이지 배경(보라 황혼)과 확실히 구분되는 새벽 하늘 */
export const GAME_SKY =
  "linear-gradient(180deg,#0b1b3a 0%,#223a68 34%,#6c4a7e 62%,#d97a5c 84%,#f3c088 100%)";

/** 두 게임 공통 껍데기: 점수 바 + 캔버스 프레임 + 게임오버 오버레이 */
export default function GameFrame({
  score,
  best,
  hint,
  over,
  onRestart,
  children,
}: {
  score: number;
  best: number;
  hint: string;
  over: boolean;
  onRestart: () => void;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-sm select-none">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            {t("score")}
          </div>
          <div className="font-mono text-4xl font-bold leading-none tabular-nums">
            {score}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            {t("best")}
          </div>
          <div className="font-mono text-xl leading-none tabular-nums text-zinc-600 dark:text-zinc-300">
            {best}
          </div>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-white/25 shadow-xl shadow-black/30 ring-1 ring-black/20"
        style={{ background: GAME_SKY }}
      >
        {children}
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/45 text-white backdrop-blur-sm">
            <div className="text-2xl font-bold tracking-wide">
              {t("gameOver")}
            </div>
            <div className="font-mono text-5xl font-bold tabular-nums">
              {score}
            </div>
            <button
              onClick={onRestart}
              className="rounded-full bg-white/90 px-6 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
            >
              {t("restart")}
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-zinc-600 dark:text-zinc-400">
        {hint}
      </p>
    </div>
  );
}
