import { useState } from "react";
import { Field, TextInput } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    won: "원",
    inputBasis: "입력 금액 기준",
    supplyMode: "공급가액 (세전)",
    totalMode: "합계금액 (세포함)",
    amount: "금액",
    vatRate: "부가세율 (%)",
    supply: "공급가액",
    vat: "부가세",
    total: "합계금액",
  },
  en: {
    won: "KRW",
    inputBasis: "Input amount basis",
    supplyMode: "Supply value (pre-tax)",
    totalMode: "Total (tax incl.)",
    amount: "Amount",
    vatRate: "VAT rate (%)",
    supply: "Supply value",
    vat: "VAT",
    total: "Total",
  },
  zh: {
    won: "元",
    inputBasis: "输入金额基准",
    supplyMode: "供应价 (税前)",
    totalMode: "合计金额 (含税)",
    amount: "金额",
    vatRate: "增值税率 (%)",
    supply: "供应价",
    vat: "增值税",
    total: "合计金额",
  },
} as const;

const won = (n: number, suffix: string) =>
  Number.isFinite(n) ? Math.round(n).toLocaleString("ko-KR") + " " + suffix : "—";

export default function VatTool() {
  const t = TEXT[useLang()];
  const w = (n: number) => won(n, t.won);
  const [amount, setAmount] = useState("1000000");
  const [rate, setRate] = useState("10");
  const [mode, setMode] = useState<"supply" | "total">("supply");

  const value = Number(amount.replace(/,/g, ""));
  const r = Number(rate) / 100;

  let supply: number, vat: number, total: number;
  if (mode === "supply") {
    // 입력 = 공급가액
    supply = value;
    vat = value * r;
    total = supply + vat;
  } else {
    // 입력 = 합계(부가세 포함)
    supply = value / (1 + r);
    vat = value - supply;
    total = value;
  }

  return (
    <div className="space-y-4">
      <Field label={t.inputBasis}>
        <div className="flex gap-2">
          {(
            [
              ["supply", t.supplyMode],
              ["total", t.totalMode],
            ] as const
          ).map(([m, label]) => (
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
        <Field label={t.amount}>
          <TextInput
            mono
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label={t.vatRate}>
          <TextInput
            mono
            inputMode="numeric"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-28"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [t.supply, supply],
          [t.vat, vat],
          [t.total, total],
        ].map(([label, v]) => (
          <div
            key={label as string}
            className="rounded-md border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="text-xs text-zinc-500">{label}</div>
            <div className="font-mono text-lg text-zinc-900 dark:text-zinc-100">
              {w(v as number)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
