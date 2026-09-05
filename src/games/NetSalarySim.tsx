import { Field, Stat, TextInput } from "../components/ui";
import { Bars, PALETTE } from "../components/charts";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    won: "원",
    annualSalary: "연봉 (세전)",
    annualHint: "원",
    dependents: "부양가족 수",
    dependentsHint: "본인 포함, 명",
    monthlyGross: "월 세전",
    monthlyDeduction: "월 공제 합계",
    monthlyNet: "월 실수령액",
    deductionItem: "공제 항목",
    month: "월",
    year: "연",
    takeHome: "실수령액",
    composition: "월 급여 구성",
    takeHomeShort: "실수령",
    pension: "국민연금",
    health: "건강보험",
    care: "장기요양",
    employ: "고용보험",
    incomeTax: "소득세",
    localTax: "지방소득세",
    note: "2025년 4대보험 요율 기준(국민연금 4.5%·건강 3.545%·장기요양 12.95%·고용 0.9%). 소득세는 간이세액 ",
    noteApprox: "근사치",
    noteTail: " — 비과세·각종 공제 제외라 실제 명세서와 차이날 수 있음. 참고용.",
  },
  en: {
    won: "KRW",
    annualSalary: "Annual salary (gross)",
    annualHint: "KRW",
    dependents: "Dependents",
    dependentsHint: "incl. self, persons",
    monthlyGross: "Monthly gross",
    monthlyDeduction: "Monthly deductions",
    monthlyNet: "Monthly take-home pay",
    deductionItem: "Deduction",
    month: "Month",
    year: "Year",
    takeHome: "Take-home pay",
    composition: "Monthly salary breakdown",
    takeHomeShort: "Take-home",
    pension: "National pension",
    health: "Health insurance",
    care: "Long-term care",
    employ: "Employment insurance",
    incomeTax: "Income tax",
    localTax: "Local income tax",
    note: "Based on 2025 social insurance rates (national pension 4.5% · health 3.545% · long-term care 12.95% · employment 0.9%). Income tax is a simplified ",
    noteApprox: "approximation",
    noteTail: " — excludes non-taxable income and various deductions, so it may differ from your actual payslip. For reference only.",
  },
  zh: {
    won: "元",
    annualSalary: "年薪 (税前)",
    annualHint: "元",
    dependents: "抚养人口",
    dependentsHint: "含本人, 人",
    monthlyGross: "月税前",
    monthlyDeduction: "月扣除合计",
    monthlyNet: "月到手工资",
    deductionItem: "扣除项目",
    month: "月",
    year: "年",
    takeHome: "到手工资",
    composition: "月工资构成",
    takeHomeShort: "到手",
    pension: "国民年金",
    health: "健康保险",
    care: "长期护理",
    employ: "雇佣保险",
    incomeTax: "所得税",
    localTax: "地方所得税",
    note: "基于2025年四大保险费率(国民年金 4.5%·健康 3.545%·长期护理 12.95%·雇佣 0.9%)。所得税为简易税额",
    noteApprox: "近似值",
    noteTail: " — 不含免税及各项扣除, 与实际工资单可能有差异。仅供参考。",
  },
} as const;

const won = (n: number, suffix: string) =>
  Math.round(n).toLocaleString("ko-KR") + " " + suffix;

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
  const t = TEXT[useLang()];
  const w = (n: number) => won(n, t.won);
  const [annual, setAnnual] = useToolState("annual", "48000000"); // 연봉
  const [dependents, setDependents] = useToolState("dep", "1"); // 부양가족(본인 포함)

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
    { label: t.pension, value: pension },
    { label: t.health, value: health },
    { label: t.care, value: care },
    { label: t.employ, value: employ },
    { label: t.incomeTax, value: incomeTax },
    { label: t.localTax, value: localTax },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.annualSalary} hint={t.annualHint}>
          <TextInput
            mono
            inputMode="numeric"
            value={annual}
            onChange={(e) => setAnnual(e.target.value)}
          />
        </Field>
        <Field label={t.dependents} hint={t.dependentsHint}>
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
        <Stat label={t.monthlyGross} value={w(monthly)} />
        <Stat label={t.monthlyDeduction} value={w(deductions)} />
        <Stat label={t.monthlyNet} value={w(net)} accent />
      </div>

      {/* 공제 내역 표 */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t.deductionItem}</th>
              <th className="px-3 py-2 text-right font-medium">{t.month}</th>
              <th className="px-3 py-2 text-right font-medium">{t.year}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.label} className="text-zinc-700 dark:text-zinc-300">
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right font-mono">{w(r.value)}</td>
                <td className="px-3 py-2 text-right font-mono text-zinc-500">
                  {w(r.value * 12)}
                </td>
              </tr>
            ))}
            <tr className="bg-zinc-50 font-semibold text-zinc-900 dark:bg-zinc-900/60 dark:text-zinc-100">
              <td className="px-3 py-2">{t.takeHome}</td>
              <td className="px-3 py-2 text-right font-mono">{w(net)}</td>
              <td className="px-3 py-2 text-right font-mono">{w(net * 12)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {t.composition}
        </div>
        <Bars
          items={[
            { label: t.takeHomeShort, value: net, display: w(net), color: PALETTE.emerald },
            ...rows.map((r) => ({
              label: r.label,
              value: r.value,
              display: w(r.value),
            })),
          ]}
        />
      </div>

      <p className="text-xs text-zinc-500">
        {t.note}
        <strong>{t.noteApprox}</strong>
        {t.noteTail}
      </p>
    </div>
  );
}
