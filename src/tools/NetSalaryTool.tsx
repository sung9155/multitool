import { useState } from "react";
import { Field, Stat, TextInput } from "../components/ui";
import { Bars, PALETTE } from "../components/charts";

const won = (n: number) => Math.round(n).toLocaleString("ko-KR") + " 원";

// 2025 기준 4대보험 근로자 부담률
const RATE = {
  pension: 0.045, // 국민연금 4.5%
  health: 0.03545, // 건강보험 3.545%
  care: 0.1295, // 장기요양 = 건강보험료 × 12.95%
  employ: 0.009, // 고용보험 0.9%
};
const PENSION_CAP = 6_170_000; // 국민연금 기준소득월액 상한(근사)

// 근로소득 간이세액 근사 (월) — 실제는 간이세액표/연말정산 기준
function estIncomeTax(monthly: number, dependents: number): number {
  // 비과세 제외 단순화. 부양가족 1명당 과세표준 경감 근사.
  const taxable = Math.max(0, monthly - dependents * 150_000);
  const annual = taxable * 12;
  // 종합소득 누진세율(근사) 적용 후 월 환산
  let tax = 0;
  const b = [
    [14_000_000, 0.06],
    [50_000_000, 0.15],
    [88_000_000, 0.24],
    [150_000_000, 0.35],
    [Infinity, 0.38],
  ] as const;
  let prev = 0;
  for (const [cap, rate] of b) {
    if (annual > prev) {
      tax += (Math.min(annual, cap) - prev) * rate;
      prev = cap;
    } else break;
  }
  // 근로소득세액공제 등 대략 반영(45% 경감 근사) → 보수적
  return (tax / 12) * 0.55;
}

export default function NetSalaryTool() {
  const [annual, setAnnual] = useState("48000000"); // 연봉
  const [dependents, setDependents] = useState("1"); // 부양가족(본인 포함)

  const yearly = Number(annual);
  const monthly = yearly / 12;
  const dep = Math.max(1, Number(dependents));

  const pensionBase = Math.min(monthly, PENSION_CAP);
  const pension = pensionBase * RATE.pension;
  const health = monthly * RATE.health;
  const care = health * RATE.care;
  const employ = monthly * RATE.employ;
  const incomeTax = estIncomeTax(monthly, dep);
  const localTax = incomeTax * 0.1; // 지방소득세 10%

  const deductions = pension + health + care + employ + incomeTax + localTax;
  const net = monthly - deductions;

  const rows: { label: string; value: number; color?: string }[] = [
    { label: "국민연금", value: pension },
    { label: "건강보험", value: health },
    { label: "장기요양", value: care },
    { label: "고용보험", value: employ },
    { label: "소득세", value: incomeTax },
    { label: "지방소득세", value: localTax },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="연봉 (세전)" hint="원">
          <TextInput
            mono
            inputMode="numeric"
            value={annual}
            onChange={(e) => setAnnual(e.target.value)}
          />
        </Field>
        <Field label="부양가족 수" hint="본인 포함, 명">
          <TextInput
            mono
            inputMode="numeric"
            value={dependents}
            onChange={(e) => setDependents(e.target.value)}
            className="w-32"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="월 세전" value={won(monthly)} />
        <Stat label="월 공제 합계" value={won(deductions)} />
        <Stat label="월 실수령액" value={won(net)} accent />
      </div>

      {/* 공제 내역 표 */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <tr>
              <th className="px-3 py-2 text-left font-medium">공제 항목</th>
              <th className="px-3 py-2 text-right font-medium">월</th>
              <th className="px-3 py-2 text-right font-medium">연</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.label} className="text-zinc-700 dark:text-zinc-300">
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right font-mono">{won(r.value)}</td>
                <td className="px-3 py-2 text-right font-mono text-zinc-500">
                  {won(r.value * 12)}
                </td>
              </tr>
            ))}
            <tr className="bg-zinc-50 font-semibold text-zinc-900 dark:bg-zinc-900/60 dark:text-zinc-100">
              <td className="px-3 py-2">실수령액</td>
              <td className="px-3 py-2 text-right font-mono">{won(net)}</td>
              <td className="px-3 py-2 text-right font-mono">{won(net * 12)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          월 급여 구성
        </div>
        <Bars
          items={[
            { label: "실수령", value: net, display: won(net), color: PALETTE.emerald },
            ...rows.map((r) => ({
              label: r.label,
              value: r.value,
              display: won(r.value),
            })),
          ]}
        />
      </div>

      <p className="text-xs text-zinc-500">
        2025년 4대보험 요율 기준(국민연금 4.5%·건강 3.545%·장기요양 12.95%·고용
        0.9%). 소득세는 간이세액 <strong>근사치</strong> — 비과세·각종 공제
        제외라 실제 명세서와 차이날 수 있음. 참고용.
      </p>
    </div>
  );
}
