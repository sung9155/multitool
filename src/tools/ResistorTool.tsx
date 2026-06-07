import { useState } from "react";
import { Field, Stat } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    bands: "밴드 수",
    b4: "4밴드",
    b5: "5밴드",
    digit: "숫자",
    mult: "배수",
    tol: "오차",
    result: "저항값",
    tolerance: "허용오차",
    range: "범위",
  },
  en: {
    bands: "Bands",
    b4: "4-band",
    b5: "5-band",
    digit: "Digit",
    mult: "Multiplier",
    tol: "Tolerance",
    result: "Resistance",
    tolerance: "Tolerance",
    range: "Range",
  },
  zh: {
    bands: "色环数",
    b4: "4环",
    b5: "5环",
    digit: "数字",
    mult: "倍率",
    tol: "误差",
    result: "电阻值",
    tolerance: "允许误差",
    range: "范围",
  },
} as const;

const COLORS = [
  { name: "black", hex: "#000", digit: 0, mult: 1 },
  { name: "brown", hex: "#7a3b10", digit: 1, mult: 10, tol: 1 },
  { name: "red", hex: "#d11", digit: 2, mult: 100, tol: 2 },
  { name: "orange", hex: "#f60", digit: 3, mult: 1e3 },
  { name: "yellow", hex: "#fc0", digit: 4, mult: 1e4 },
  { name: "green", hex: "#1a3", digit: 5, mult: 1e5, tol: 0.5 },
  { name: "blue", hex: "#15c", digit: 6, mult: 1e6, tol: 0.25 },
  { name: "violet", hex: "#73c", digit: 7, mult: 1e7, tol: 0.1 },
  { name: "grey", hex: "#888", digit: 8, mult: 1e8, tol: 0.05 },
  { name: "white", hex: "#eee", digit: 9, mult: 1e9 },
  { name: "gold", hex: "#c9a227", mult: 0.1, tol: 5 },
  { name: "silver", hex: "#bbb", mult: 0.01, tol: 10 },
] as const;

const digitColors = COLORS.filter((c) => "digit" in c);
const multColors = COLORS;
const tolColors = COLORS.filter((c) => "tol" in c);

function fmtOhm(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (v >= 1e6) return `${+(v / 1e6).toFixed(3)} MΩ`;
  if (v >= 1e3) return `${+(v / 1e3).toFixed(3)} kΩ`;
  return `${+v.toFixed(3)} Ω`;
}

function Swatch({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (i: number) => void;
  options: readonly { name: string; hex: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
    >
      {options.map((c, i) => (
        <option key={c.name} value={i}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export default function ResistorTool() {
  const t = TEXT[useLang()];
  const [bands, setBands] = useState<4 | 5>(4);
  const [d1, setD1] = useState(1); // brown
  const [d2, setD2] = useState(0);
  const [d3, setD3] = useState(0);
  const [mult, setMult] = useState(2); // red x100
  const [tol, setTol] = useState(0); // gold (index in tolColors)

  const digits =
    bands === 4
      ? digitColors[d1].digit * 10 + digitColors[d2].digit
      : digitColors[d1].digit * 100 + digitColors[d2].digit * 10 + digitColors[d3].digit;
  const value = digits * (multColors[mult].mult ?? 1);
  const tolVal = tolColors[tol].tol ?? 0;
  const lo = value * (1 - tolVal / 100);
  const hi = value * (1 + tolVal / 100);

  // 밴드 미리보기 색
  const previewBands = [
    digitColors[d1].hex,
    digitColors[d2].hex,
    ...(bands === 5 ? [digitColors[d3].hex] : []),
    multColors[mult].hex,
    tolColors[tol].hex,
  ];

  return (
    <div className="space-y-4">
      <Field label={t.bands}>
        <div className="flex gap-2">
          {([4, 5] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBands(b)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                b === bands
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {b === 4 ? t.b4 : t.b5}
            </button>
          ))}
        </div>
      </Field>

      {/* 저항 미리보기 */}
      <div className="flex items-center justify-center gap-1 rounded-md border border-zinc-200 bg-amber-50 px-6 py-6 dark:border-zinc-700 dark:bg-amber-100/10">
        <div className="h-1 w-8 bg-zinc-400" />
        <div className="relative flex h-12 items-center gap-2 rounded-md bg-amber-200/70 px-4 dark:bg-amber-700/40">
          {previewBands.map((hex, i) => (
            <div key={i} className="h-12 w-3 rounded-sm" style={{ background: hex }} />
          ))}
        </div>
        <div className="h-1 w-8 bg-zinc-400" />
      </div>

      <div className={`grid gap-3 ${bands === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
        <Field label={`${t.digit} 1`}>
          <Swatch value={d1} onChange={setD1} options={digitColors} />
        </Field>
        <Field label={`${t.digit} 2`}>
          <Swatch value={d2} onChange={setD2} options={digitColors} />
        </Field>
        {bands === 5 && (
          <Field label={`${t.digit} 3`}>
            <Swatch value={d3} onChange={setD3} options={digitColors} />
          </Field>
        )}
        <Field label={t.mult}>
          <Swatch value={mult} onChange={setMult} options={multColors} />
        </Field>
        <Field label={t.tol}>
          <Swatch value={tol} onChange={setTol} options={tolColors} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t.result} value={fmtOhm(value)} accent />
        <Stat label={t.tolerance} value={`±${tolVal}`} unit="%" />
        <Stat label={t.range} value={`${fmtOhm(lo)} ~ ${fmtOhm(hi)}`} />
      </div>
    </div>
  );
}
