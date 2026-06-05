import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";

type Mode = "ratio" | "of" | "change";

const MODES: [Mode, string][] = [
  ["ratio", "A는 B의 몇 %"],
  ["of", "A의 B%는 얼마"],
  ["change", "증감율 (A→B)"],
];

export default function PercentTool() {
  const [mode, setMode] = useState<Mode>("ratio");
  const [a, setA] = useState("30");
  const [b, setB] = useState("200");

  const av = Number(a.replace(/,/g, ""));
  const bv = Number(b.replace(/,/g, ""));

  let resultLabel = "";
  let resultValue = "—";
  let resultUnit = "";

  if (mode === "ratio") {
    resultLabel = "A는 B의";
    resultValue = fmtNum((av / bv) * 100, 4);
    resultUnit = "%";
  } else if (mode === "of") {
    resultLabel = "A의 B%";
    resultValue = fmtNum((av * bv) / 100, 4);
    resultUnit = "";
  } else {
    const change = ((bv - av) / av) * 100;
    resultLabel = "증감율";
    resultValue =
      Number.isFinite(change) && change > 0
        ? "+" + fmtNum(change, 4)
        : fmtNum(change, 4);
    resultUnit = "%";
  }

  const labels: Record<Mode, [string, string]> = {
    ratio: ["A (부분)", "B (전체)"],
    of: ["A (기준 값)", "B (퍼센트 %)"],
    change: ["A (이전 값)", "B (이후 값)"],
  };

  return (
    <div className="space-y-4">
      <Field label="계산 방식">
        <div className="flex flex-wrap gap-2">
          {MODES.map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                m === mode
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={labels[mode][0]}>
          <TextInput
            mono
            inputMode="decimal"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
        </Field>
        <Field label={labels[mode][1]}>
          <TextInput
            mono
            inputMode="decimal"
            value={b}
            onChange={(e) => setB(e.target.value)}
          />
        </Field>
      </div>

      <Stat label={resultLabel} value={resultValue} unit={resultUnit} accent />
    </div>
  );
}
