import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { Gauge, PALETTE } from "../components/charts";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    value: "값",
    unit: "단위",
    pneumatic: "공압 표준 (0~1 MPa 기준)",
    hydraulic: "유압 표준 (0~10 MPa 기준)",
    note: "게이지는 일반 공압(≤1 MPa) · 유압(≤10 MPa) 범위 대비 현재 압력 위치.",
  },
  en: {
    value: "Value",
    unit: "Unit",
    pneumatic: "Pneumatic standard (0–1 MPa)",
    hydraulic: "Hydraulic standard (0–10 MPa)",
    note: "Gauges show current pressure relative to typical pneumatic (≤1 MPa) · hydraulic (≤10 MPa) ranges.",
  },
  zh: {
    value: "数值",
    unit: "单位",
    pneumatic: "气压标准 (0~1 MPa 基准)",
    hydraulic: "液压标准 (0~10 MPa 基准)",
    note: "仪表显示当前压力相对于常见气压(≤1 MPa) · 液压(≤10 MPa)范围的位置。",
  },
} as const;

// 각 단위 → Pa 변환계수
const TO_PA: Record<string, number> = {
  MPa: 1_000_000,
  kPa: 1_000,
  bar: 100_000,
  psi: 6_894.757,
  "kgf/cm²": 98_066.5,
  mmHg: 133.322,
};

const UNITS = Object.keys(TO_PA);

export default function PressureTool() {
  const t = TEXT[useLang()];
  const [value, setValue] = useToolState("value", "0.5");
  const [unit, setUnit] = useToolState("unit", "MPa");

  const pa = Number(value) * TO_PA[unit];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.value}>
          <TextInput
            mono
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        <Field label={t.unit}>
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  u === unit
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {UNITS.map((u) => (
          <Stat
            key={u}
            label={u}
            value={fmtNum(pa / TO_PA[u], 4)}
            accent={u === unit}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Gauge
          value={(pa / 1_000_000 / 1) * 100}
          label={t.pneumatic}
          color={
            pa <= 1_000_000 ? PALETTE.emerald : pa <= 1_600_000 ? PALETTE.amber : PALETTE.rose
          }
        />
        <Gauge
          value={(pa / 1_000_000 / 10) * 100}
          label={t.hydraulic}
          color={PALETTE.sky}
        />
      </div>
      <p className="text-xs text-zinc-500">{t.note}</p>
    </div>
  );
}
