import { useState } from "react";
import { Field, TextInput, Stat } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "적금(매월 납입) / 예금(목돈 예치)의 만기 원리금과 이자를 계산합니다 (세금 15.4% 옵션).",
    type: "유형",
    installSave: "적금(매월)",
    deposit: "예금(거치)",
    monthly: "월 납입액 (원)",
    principal: "예치금 (원)",
    rate: "연이율 (%)",
    months: "기간 (개월)",
    tax: "이자과세 15.4% 적용",
    totalIn: "총 납입/원금",
    interest: "세전 이자",
    taxAmt: "이자세",
    maturity: "세후 만기 수령액",
  },
  en: {
    intro: "Compute maturity & interest for monthly savings or lump deposit (15.4% tax option).",
    type: "Type",
    installSave: "Monthly savings",
    deposit: "Lump deposit",
    monthly: "Monthly amount (KRW)",
    principal: "Deposit (KRW)",
    rate: "Annual rate (%)",
    months: "Term (months)",
    tax: "Apply 15.4% interest tax",
    totalIn: "Total paid/principal",
    interest: "Pre-tax interest",
    taxAmt: "Interest tax",
    maturity: "After-tax maturity",
  },
  zh: {
    intro: "计算零存整取/整存到期本息与利息（可选 15.4% 利息税）。",
    type: "类型",
    installSave: "零存(每月)",
    deposit: "整存(定期)",
    monthly: "每月金额 (元)",
    principal: "存入 (元)",
    rate: "年利率 (%)",
    months: "期限 (月)",
    tax: "适用 15.4% 利息税",
    totalIn: "累计存入/本金",
    interest: "税前利息",
    taxAmt: "利息税",
    maturity: "税后到期金额",
  },
} as const;

const won = (n: number) => (Number.isFinite(n) ? Math.round(n).toLocaleString("ko-KR") : "—");

export default function SavingsTool() {
  const t = TEXT[useLang()];
  const [type, setType] = useState<"save" | "deposit">("save");
  const [monthly, setMonthly] = useState("500000");
  const [principal, setPrincipal] = useState("10000000");
  const [rate, setRate] = useState("3.5");
  const [months, setMonths] = useState("12");
  const [tax, setTax] = useState(true);

  const r = Number(rate) / 100;
  const N = Math.max(0, Math.floor(Number(months)));
  let totalIn = 0, interest = 0;

  if (type === "save") {
    const m = Number(monthly);
    totalIn = m * N;
    // 단리 적금 이자: m * r/12 * (N(N+1)/2)
    interest = m * (r / 12) * ((N * (N + 1)) / 2);
  } else {
    const p = Number(principal);
    totalIn = p;
    interest = p * r * (N / 12); // 단리 예금
  }

  const taxAmt = tax ? interest * 0.154 : 0;
  const maturity = totalIn + interest - taxAmt;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <Field label={t.type}>
        <div className="flex gap-2">
          {(
            [
              ["save", t.installSave],
              ["deposit", t.deposit],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setType(m)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                m === type
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {type === "save" ? (
          <Field label={t.monthly}>
            <TextInput mono inputMode="numeric" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          </Field>
        ) : (
          <Field label={t.principal}>
            <TextInput mono inputMode="numeric" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          </Field>
        )}
        <Field label={t.rate}>
          <TextInput mono inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label={t.months}>
          <TextInput mono inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <input type="checkbox" checked={tax} onChange={(e) => setTax(e.target.checked)} />
        {t.tax}
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.totalIn} value={won(totalIn)} unit="원" />
        <Stat label={t.interest} value={won(interest)} unit="원" />
        <Stat label={t.taxAmt} value={won(taxAmt)} unit="원" />
        <Stat label={t.maturity} value={won(maturity)} unit="원" accent />
      </div>
    </div>
  );
}
