import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    category: "카테고리",
    value: "값",
    unit: "단위",
    length: "길이",
    weight: "무게",
    area: "넓이",
    volume: "부피",
    temp: "온도",
    pyeong: "평",
  },
  en: {
    category: "Category",
    value: "Value",
    unit: "Unit",
    length: "Length",
    weight: "Weight",
    area: "Area",
    volume: "Volume",
    temp: "Temperature",
    pyeong: "pyeong",
  },
  zh: {
    category: "类别",
    value: "数值",
    unit: "单位",
    length: "长度",
    weight: "重量",
    area: "面积",
    volume: "体积",
    temp: "温度",
    pyeong: "坪",
  },
} as const;

type Cat = "length" | "weight" | "area" | "volume" | "temp";

const CATS: Cat[] = ["length", "weight", "area", "volume", "temp"];

// 각 단위 → 기준단위 변환계수 (선형 카테고리)
const FACTORS: Record<Exclude<Cat, "temp">, Record<string, number>> = {
  length: {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    inch: 0.0254,
    ft: 0.3048,
    mile: 1609.344,
    yard: 0.9144,
  },
  weight: {
    mg: 0.001,
    g: 1,
    kg: 1000,
    t: 1e6,
    oz: 28.3495,
    lb: 453.592,
  },
  area: {
    "cm²": 0.0001,
    "m²": 1,
    "km²": 1e6,
    평: 3.305785,
    ha: 10000,
    "ft²": 0.092903,
  },
  volume: {
    mL: 0.001,
    L: 1,
    "m³": 1000,
    "gal(US)": 3.78541,
  },
};

const TEMP_UNITS = ["°C", "°F", "K"];

// 입력 단위에서 °C 로 변환
function toCelsius(value: number, unit: string): number {
  if (unit === "°C") return value;
  if (unit === "°F") return ((value - 32) * 5) / 9;
  return value - 273.15; // K
}
// °C 에서 대상 단위로 변환
function fromCelsius(c: number, unit: string): number {
  if (unit === "°C") return c;
  if (unit === "°F") return (c * 9) / 5 + 32;
  return c + 273.15; // K
}

export default function UnitConvertTool() {
  const t = TEXT[useLang()];
  const [cat, setCat] = useState<Cat>("length");

  // 단위 표시명 (키는 유지, "평"만 현지화)
  const unitLabel = (u: string) => (u === "평" ? t.pyeong : u);
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState("m");

  const units =
    cat === "temp" ? TEMP_UNITS : Object.keys(FACTORS[cat]);

  // 카테고리 전환 직후 unit 이 목록에 없으면 첫 단위로 폴백 (렌더 중 안전)
  const activeUnit = units.includes(unit) ? unit : units[0];

  const v = Number(value);

  const results: { u: string; out: number }[] = units.map((u) => {
    if (cat === "temp") {
      const c = toCelsius(v, activeUnit);
      return { u, out: fromCelsius(c, u) };
    }
    const f = FACTORS[cat as Exclude<Cat, "temp">];
    const base = v * f[activeUnit];
    return { u, out: base / f[u] };
  });

  return (
    <div className="space-y-4">
      <Field label={t.category}>
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCat(c);
                const next =
                  c === "temp" ? TEMP_UNITS : Object.keys(FACTORS[c]);
                setUnit(next[0]);
              }}
              className={`rounded-md px-3 py-1.5 text-sm ${
                c === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {t[c]}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.value}>
          <TextInput
            mono
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        <Field label={t.unit}>
          <div className="flex flex-wrap gap-2">
            {units.map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  u === activeUnit
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {unitLabel(u)}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {results.map((r) => (
          <Stat
            key={r.u}
            label={unitLabel(r.u)}
            value={fmtNum(r.out, 6)}
            accent={r.u === activeUnit}
          />
        ))}
      </div>
    </div>
  );
}
