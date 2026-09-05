import { useEffect, useRef, useState } from "react";
import { useT } from "../components/i18n";
import { getBest, saveBestLow } from "./registry";

const SLUG = "reaction";

type Phase =
  | { kind: "idle" }
  | { kind: "waiting" } // 빨간 화면, 초록 대기
  | { kind: "go"; at: number } // 초록 켜진 시각
  | { kind: "result"; ms: number }
  | { kind: "tooSoon" };

export default function ReactionGame() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [best, setBest] = useState(() => getBest(SLUG));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const arm = () => {
    setPhase({ kind: "waiting" });
    // 1.5~4초 뒤 초록불
    timer.current = setTimeout(
      () => setPhase({ kind: "go", at: performance.now() }),
      1500 + Math.random() * 2500,
    );
  };

  const tap = () => {
    switch (phase.kind) {
      case "idle":
      case "result":
      case "tooSoon":
        arm();
        break;
      case "waiting":
        if (timer.current) clearTimeout(timer.current);
        setPhase({ kind: "tooSoon" });
        break;
      case "go": {
        const ms = Math.round(performance.now() - phase.at);
        setBest(saveBestLow(SLUG, ms));
        setPhase({ kind: "result", ms });
        break;
      }
    }
  };

  const bg =
    phase.kind === "go"
      ? "bg-emerald-500"
      : phase.kind === "waiting"
        ? "bg-red-500"
        : phase.kind === "tooSoon"
          ? "bg-amber-500"
          : "bg-violet-600";

  return (
    <div className="mx-auto max-w-sm select-none">
      <div className="mb-3 text-sm">
        {t("best")}{" "}
        <b className="text-base">
          {best > 0 ? `${best} ${t("rxMs")}` : "—"}
        </b>
      </div>
      <button
        onPointerDown={tap}
        className={`flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl text-white transition-colors ${bg}`}
      >
        {phase.kind === "idle" && (
          <span className="text-xl font-bold">{t("rxReady")}</span>
        )}
        {phase.kind === "waiting" && (
          <span className="text-xl font-bold">{t("rxWait")}</span>
        )}
        {phase.kind === "go" && (
          <span className="text-3xl font-black">{t("rxGo")}</span>
        )}
        {phase.kind === "tooSoon" && (
          <>
            <span className="px-6 text-center text-lg font-bold">
              {t("rxTooSoon")}
            </span>
            <span className="text-sm opacity-80">{t("restart")} ↻</span>
          </>
        )}
        {phase.kind === "result" && (
          <>
            <span className="text-5xl font-black">
              {phase.ms}
              <span className="ml-1 text-2xl font-bold">{t("rxMs")}</span>
            </span>
            <span className="text-sm opacity-80">{t("restart")} ↻</span>
          </>
        )}
      </button>
    </div>
  );
}
