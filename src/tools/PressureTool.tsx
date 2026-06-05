import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { Gauge, PALETTE } from "../components/charts";

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
  const [value, setValue] = useState("0.5");
  const [unit, setUnit] = useState("MPa");

  const pa = Number(value) * TO_PA[unit];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="값">
          <TextInput
            mono
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        <Field label="단위">
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
          label="공압 표준 (0~1 MPa 기준)"
          color={
            pa <= 1_000_000 ? PALETTE.emerald : pa <= 1_600_000 ? PALETTE.amber : PALETTE.rose
          }
        />
        <Gauge
          value={(pa / 1_000_000 / 10) * 100}
          label="유압 표준 (0~10 MPa 기준)"
          color={PALETTE.sky}
        />
      </div>
      <p className="text-xs text-zinc-500">
        게이지는 일반 공압(≤1 MPa) · 유압(≤10 MPa) 범위 대비 현재 압력 위치.
      </p>
    </div>
  );
}
