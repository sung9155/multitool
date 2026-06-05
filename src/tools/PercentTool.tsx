import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    calcMethod: "계산 방식",
    modeRatio: "A는 B의 몇 %",
    modeOf: "A의 B%는 얼마",
    modeChange: "증감율 (A→B)",
    labelRatio: "A는 B의",
    labelOf: "A의 B%",
    labelChange: "증감율",
    ratioA: "A (부분)",
    ratioB: "B (전체)",
    ofA: "A (기준 값)",
    ofB: "B (퍼센트 %)",
    changeA: "A (이전 값)",
    changeB: "B (이후 값)",
  },
  en: {
    calcMethod: "Calculation",
    modeRatio: "A is what % of B",
    modeOf: "B% of A",
    modeChange: "Change rate (A→B)",
    labelRatio: "A is of B",
    labelOf: "B% of A",
    labelChange: "Change rate",
    ratioA: "A (part)",
    ratioB: "B (whole)",
    ofA: "A (base value)",
    ofB: "B (percent %)",
    changeA: "A (before)",
    changeB: "B (after)",
  },
  zh: {
    calcMethod: "计算方式",
    modeRatio: "A 是 B 的百分之几",
    modeOf: "A 的 B% 是多少",
    modeChange: "变化率 (A→B)",
    labelRatio: "A 是 B 的",
    labelOf: "A 的 B%",
    labelChange: "变化率",
    ratioA: "A (部分)",
    ratioB: "B (整体)",
    ofA: "A (基准值)",
    ofB: "B (百分比 %)",
    changeA: "A (之前值)",
    changeB: "B (之后值)",
  },
} as const;

type Mode = "ratio" | "of" | "change";

export default function PercentTool() {
  const t = TEXT[useLang()];
  const [mode, setMode] = useState<Mode>("ratio");
  const [a, setA] = useState("30");
  const [b, setB] = useState("200");

  const MODES: [Mode, string][] = [
    ["ratio", t.modeRatio],
    ["of", t.modeOf],
    ["change", t.modeChange],
  ];

  const av = Number(a.replace(/,/g, ""));
  const bv = Number(b.replace(/,/g, ""));

  let resultLabel = "";
  let resultValue = "—";
  let resultUnit = "";

  if (mode === "ratio") {
    resultLabel = t.labelRatio;
    resultValue = fmtNum((av / bv) * 100, 4);
    resultUnit = "%";
  } else if (mode === "of") {
    resultLabel = t.labelOf;
    resultValue = fmtNum((av * bv) / 100, 4);
    resultUnit = "";
  } else {
    const change = ((bv - av) / av) * 100;
    resultLabel = t.labelChange;
    resultValue =
      Number.isFinite(change) && change > 0
        ? "+" + fmtNum(change, 4)
        : fmtNum(change, 4);
    resultUnit = "%";
  }

  const labels: Record<Mode, [string, string]> = {
    ratio: [t.ratioA, t.ratioB],
    of: [t.ofA, t.ofB],
    change: [t.changeA, t.changeB],
  };

  return (
    <div className="space-y-4">
      <Field label={t.calcMethod}>
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
