import { useState } from "react";
import { Field, TextInput, Stat } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "환율을 직접 입력해 변환합니다 (오프라인). 각 통화 1단위 = ? 원 으로 설정.",
    amount: "금액",
    from: "보내는 통화",
    to: "받는 통화",
    rates: "환율 (1단위 = ? 원)",
    result: "환산 결과",
    rate: "적용 환율",
  },
  en: {
    intro: "Convert with manually entered rates (offline). Set each currency: 1 unit = ? KRW.",
    amount: "Amount",
    from: "From",
    to: "To",
    rates: "Rates (1 unit = ? KRW)",
    result: "Converted",
    rate: "Applied rate",
  },
  zh: {
    intro: "手动输入汇率进行换算（离线）。设置每种货币：1 单位 = ? 元。",
    amount: "金额",
    from: "源货币",
    to: "目标货币",
    rates: "汇率 (1 单位 = ? 元)",
    result: "换算结果",
    rate: "适用汇率",
  },
} as const;

const DEFAULTS: Record<string, number> = {
  KRW: 1,
  USD: 1380,
  EUR: 1480,
  JPY: 9.1,
  CNY: 190,
  GBP: 1750,
};

export default function CurrencyTool() {
  const t = TEXT[useLang()];
  const [rates, setRates] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)])),
  );
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("KRW");

  const codes = Object.keys(DEFAULTS);
  const rFrom = Number(rates[from]);
  const rTo = Number(rates[to]);
  const krw = Number(amount) * rFrom;
  const result = rTo > 0 ? krw / rTo : 0;
  const pairRate = rTo > 0 ? rFrom / rTo : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t.amount}>
          <TextInput mono inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t.from}>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {codes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label={t.to}>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {codes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label={t.result}
          value={Number.isFinite(result) ? result.toLocaleString("ko-KR", { maximumFractionDigits: 2 }) : "—"}
          unit={to}
          accent
        />
        <Stat
          label={t.rate}
          value={`1 ${from} = ${pairRate.toLocaleString("ko-KR", { maximumFractionDigits: 4 })} ${to}`}
        />
      </div>

      <Field label={t.rates}>
        <div className="grid gap-2 sm:grid-cols-3">
          {codes.map((c) => (
            <label key={c} className="flex items-center gap-2">
              <span className="w-12 font-mono text-sm text-zinc-500">{c}</span>
              <TextInput
                mono
                inputMode="decimal"
                value={rates[c]}
                disabled={c === "KRW"}
                onChange={(e) => setRates((s) => ({ ...s, [c]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}
