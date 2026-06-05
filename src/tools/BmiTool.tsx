import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { Gauge, PALETTE } from "../components/charts";

// 대한비만학회(아시아 기준) 분류
const CATS = [
  { max: 18.5, label: "저체중", color: PALETTE.sky },
  { max: 23, label: "정상", color: PALETTE.emerald },
  { max: 25, label: "과체중", color: PALETTE.amber },
  { max: 30, label: "비만 1단계", color: "#fb923c" },
  { max: Infinity, label: "비만 2단계 이상", color: PALETTE.rose },
];

function classify(bmi: number) {
  return CATS.find((c) => bmi < c.max) ?? CATS[CATS.length - 1];
}

export default function BmiTool() {
  const [height, setHeight] = useState("172"); // cm
  const [weight, setWeight] = useState("68"); // kg

  const h = Number(height) / 100;
  const w = Number(weight);
  const bmi = h > 0 ? w / (h * h) : 0;
  const cat = classify(bmi);

  // 정상 체중 범위 (BMI 18.5~23)
  const lo = 18.5 * h * h;
  const hi = 23 * h * h;

  // 게이지: BMI 15~35 구간을 0~100%로 매핑
  const gaugePct = Math.max(0, Math.min(100, ((bmi - 15) / (35 - 15)) * 100));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="키" hint="cm">
          <TextInput
            mono
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </Field>
        <Field label="몸무게" hint="kg">
          <TextInput
            mono
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Gauge value={gaugePct} label={`BMI ${fmtNum(bmi, 1)}`} color={cat.color} />
        <div className="space-y-3">
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: cat.color + "66" }}
          >
            <div className="text-xs text-zinc-500">분류 (아시아 기준)</div>
            <div className="text-2xl font-bold" style={{ color: cat.color }}>
              {cat.label}
            </div>
          </div>
          <Stat
            label="정상 체중 범위 (BMI 18.5~23)"
            value={`${fmtNum(lo, 1)} ~ ${fmtNum(hi, 1)} kg`}
          />
        </div>
      </div>

      {/* 분류 막대 */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex h-8 text-[11px] font-medium text-white">
          {[
            ["저체중", PALETTE.sky, "~18.5"],
            ["정상", PALETTE.emerald, "18.5~23"],
            ["과체중", PALETTE.amber, "23~25"],
            ["비만1", "#fb923c", "25~30"],
            ["비만2+", PALETTE.rose, "30~"],
          ].map(([l, c, range]) => (
            <div
              key={l as string}
              className="flex flex-1 flex-col items-center justify-center"
              style={{ background: c as string }}
            >
              <span>{l}</span>
              <span className="opacity-80">{range}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        BMI = 몸무게(kg) ÷ 키(m)². 대한비만학회 아시아-태평양 기준(정상
        18.5~23). 근육량·체지방 미반영이라 참고용.
      </p>
    </div>
  );
}
