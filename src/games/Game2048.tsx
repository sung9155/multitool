import { useEffect, useRef, useState } from "react";
import { useT } from "../components/i18n";
import { getBest, saveBest } from "./registry";
import {
  addTile,
  canMove,
  emptyBoard,
  moveBoard,
  type Board,
  type Dir,
} from "./arcade";

const SLUG = "2048";

/** 타일 값별 색 */
const TILE: Record<number, string> = {
  2: "bg-amber-100 text-amber-900",
  4: "bg-amber-200 text-amber-900",
  8: "bg-orange-400 text-white",
  16: "bg-orange-500 text-white",
  32: "bg-red-400 text-white",
  64: "bg-red-500 text-white",
  128: "bg-yellow-400 text-yellow-950",
  256: "bg-yellow-500 text-yellow-950",
  512: "bg-lime-500 text-white",
  1024: "bg-emerald-500 text-white",
  2048: "bg-violet-500 text-white",
};

function freshBoard(): Board {
  return addTile(addTile(emptyBoard()));
}

export default function Game2048() {
  const t = useT();
  const [st, setSt] = useState(() => ({
    board: freshBoard(),
    score: 0,
    over: false,
  }));
  const { board, score, over } = st;
  const [best, setBest] = useState(() => getBest(SLUG));
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const move = (dir: Dir) => {
    if (over) return;
    const r = moveBoard(board, dir);
    if (!r.moved) return;
    const next = addTile(r.board);
    const ns = score + r.gained;
    setSt({ board: next, score: ns, over: !canMove(next) });
    setBest(saveBest(SLUG, ns));
  };

  // 키보드
  useEffect(() => {
    const map: Record<string, Dir> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      move(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st]);

  const restart = () => setSt({ board: freshBoard(), score: 0, over: false });

  return (
    <div className="mx-auto max-w-sm select-none">
      <div className="mb-3 flex items-center gap-4 text-sm">
        <span>
          {t("score")} <b className="text-base">{score}</b>
        </span>
        <span>
          {t("best")} <b className="text-base">{best}</b>
        </span>
        <button
          onClick={restart}
          className="ml-auto rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          {t("restart")}
        </button>
      </div>

      <div
        className="relative grid grid-cols-4 gap-2 rounded-xl bg-zinc-300/70 p-2 dark:bg-zinc-800"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          touchStart.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const s = touchStart.current;
          touchStart.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; // 탭 무시
          move(
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? "right"
                : "left"
              : dy > 0
                ? "down"
                : "up",
          );
        }}
      >
        {board.flat().map((v, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-lg font-bold ${
              v === 0
                ? "bg-zinc-200/70 dark:bg-zinc-700/50"
                : (TILE[v] ?? "bg-zinc-900 text-white")
            } ${v >= 1024 ? "text-xl" : v >= 128 ? "text-2xl" : "text-3xl"}`}
          >
            {v || ""}
          </div>
        ))}
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/60 text-white">
            <p className="text-2xl font-bold">{t("gameOver")}</p>
            <button
              onClick={restart}
              className="rounded-md bg-violet-600 px-4 py-2 font-medium hover:bg-violet-500"
            >
              {t("restart")}
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-sm text-zinc-500">{t("hint2048")}</p>
    </div>
  );
}
