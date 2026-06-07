import { useState } from "react";
import { Field, TextInput, Stat } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "할부 수수료와 일시불 기회비용(예치 이자)을 비교합니다.",
    price: "구매 금액 (원)",
    months: "할부 개월",
    apr: "할부 수수료율 (연 %)",
    save: "여유자금 예치 이율 (연 %)",
    monthly: "월 할부금",
    instTotal: "할부 총액",
    instFee: "할부 수수료",
    lumpCost: "일시불 기회비용",
    verdict: "유리한 선택",
    pickInst: "할부가 유리",
    pickLump: "일시불이 유리",
    diff: "차액",
  },
  en: {
    intro: "Compare installment fees vs lump-sum opportunity cost (deposit interest).",
    price: "Price (KRW)",
    months: "Installment months",
    apr: "Installment fee APR (%)",
    save: "Idle-cash deposit rate (%)",
    monthly: "Monthly payment",
    instTotal: "Installment total",
    instFee: "Installment fee",
    lumpCost: "Lump-sum opportunity cost",
    verdict: "Better choice",
    pickInst: "Installment wins",
    pickLump: "Lump-sum wins",
    diff: "Difference",
  },
  zh: {
    intro: "比较分期手续费与一次性付款的机会成本（存款利息）。",
    price: "购买金额 (元)",
    months: "分期月数",
    apr: "分期手续费率 (年 %)",
    save: "闲置资金存款利率 (年 %)",
    monthly: "每月分期",
    instTotal: "分期总额",
    instFee: "分期手续费",
    lumpCost: "一次性机会成本",
    verdict: "更优选择",
    pickInst: "分期更优",
    pickLump: "一次性更优",
    diff: "差额",
  },
} as const;

const won = (n: number) => (Number.isFinite(n) ? Math.round(n).toLocaleString("ko-KR") : "—");

export default function InstallmentTool() {
  const t = TEXT[useLang()];
  const [price, setPrice] = useState("1200000");
  const [months, setMonths] = useState("12");
  const [apr, setApr] = useState("0");
  const [save, setSave] = useState("3.5");

  const P = Number(price);
  const N = Math.max(1, Math.floor(Number(months)));
  const i = Number(apr) / 100 / 12;
  // 원리금균등 할부금
  const monthly = i > 0 ? (P * i) / (1 - Math.pow(1 + i, -N)) : P / N;
  const instTotal = monthly * N;
  const instFee = instTotal - P;

  // 일시불: 지금 P 지출 → 그 돈을 예치했다면 얻었을 이자 기회비용(기간 절반 가정 평균잔액 근사)
  const lumpCost = P * (Number(save) / 100) * (N / 12) * 0.5;

  const instEffective = instFee; // 할부 추가비용
  const lumpEffective = lumpCost; // 일시불 기회비용
  const instWins = instEffective < lumpEffective;
  const diff = Math.abs(instEffective - lumpEffective);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.price}>
          <TextInput mono inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label={t.months}>
          <TextInput mono inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
        </Field>
        <Field label={t.apr}>
          <TextInput mono inputMode="decimal" value={apr} onChange={(e) => setApr(e.target.value)} />
        </Field>
        <Field label={t.save}>
          <TextInput mono inputMode="decimal" value={save} onChange={(e) => setSave(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.monthly} value={won(monthly)} unit="원" accent />
        <Stat label={t.instTotal} value={won(instTotal)} unit="원" />
        <Stat label={t.instFee} value={won(instFee)} unit="원" />
        <Stat label={t.lumpCost} value={won(lumpCost)} unit="원" />
      </div>
      <div
        className={`rounded-md border p-3 text-sm font-medium ${
          instWins
            ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {t.verdict}: {instWins ? t.pickInst : t.pickLump} · {t.diff} {won(diff)}원
      </div>
    </div>
  );
}
