import { useState } from "react";
import { useT } from "../components/i18n";
import { getBest, saveBestLow } from "./registry";
import { judge, secretDigits } from "./arcade";

const SLUG = "baseball";

interface Try {
  guess: number[];
  s: number;
  b: number;
}

export default function BaseballGame() {
  const t = useT();
  const [secret, setSecret] = useState<number[]>(() => secretDigits());
  const [input, setInput] = useState("");
  const [tries, setTries] = useState<Try[]>([]);
  const [best, setBest] = useState(() => getBest(SLUG));

  const won = tries.length > 0 && tries[tries.length - 1].s === 3;

  const valid = /^[1-9]{3}$/.test(input) && new Set(input).size === 3;

  const pitch = () => {
    if (!valid || won) return;
    const guess = [...input].map(Number);
    const r = judge(secret, guess);
    const next = [...tries, { guess, ...r }];
    setTries(next);
    setInput("");
    if (r.s === 3) setBest(saveBestLow(SLUG, next.length));
  };

  const restart = () => {
    setSecret(secretDigits());
    setTries([]);
    setInput("");
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-3 flex items-center gap-4 text-sm">
        <span>
          {t("bbTries")} <b className="text-base">{tries.length}</b>
        </span>
        <span>
          {t("best")} <b className="text-base">{best > 0 ? best : "—"}</b>
        </span>
        <button
          onClick={restart}
          className="ml-auto rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          {t("bbNew")}
        </button>
      </div>

      <p className="mb-3 text-sm text-zinc-500">{t("bbHint")}</p>

      {won ? (
        <div className="mb-4 rounded-xl bg-emerald-100 p-4 text-center text-lg font-bold text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-300">
          {t("bbWin")} {secret.join("")} — {tries.length} {t("bbTries")}
        </div>
      ) : (
        <div className="mb-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onKeyDown={(e) => e.key === "Enter" && pitch()}
            placeholder={t("bbPlaceholder")}
            inputMode="numeric"
            className="w-full rounded-md border border-zinc-300 bg-white/70 px-3 py-2 text-center text-lg tracking-[0.5em] outline-none focus:border-violet-500 dark:border-zinc-600 dark:bg-zinc-900/60"
          />
          <button
            onClick={pitch}
            disabled={!valid}
            className="shrink-0 rounded-md bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-500 disabled:opacity-40"
          >
            ⚾ {t("bbSubmit")}
          </button>
        </div>
      )}

      <ul className="space-y-1.5">
        {[...tries].reverse().map((tr, i) => (
          <li
            key={tries.length - i}
            className="flex items-center gap-3 rounded-lg bg-white/60 px-3 py-2 text-sm dark:bg-zinc-900/50"
          >
            <span className="w-6 text-xs text-zinc-400">
              #{tries.length - i}
            </span>
            <span className="font-mono text-lg font-bold tracking-widest">
              {tr.guess.join("")}
            </span>
            <span className="ml-auto font-semibold">
              {tr.s === 0 && tr.b === 0 ? (
                <span className="text-zinc-400">{t("bbOut")}</span>
              ) : (
                <>
                  {tr.s > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {tr.s}S
                    </span>
                  )}{" "}
                  {tr.b > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {tr.b}B
                    </span>
                  )}
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
