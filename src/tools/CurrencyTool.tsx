import { Field, TextInput, Stat } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState, useToolStateJSON } from "../components/toolState";
import { ChartCard } from "../components/charts";

const TEXT = {
  ko: {
    intro: "환율을 직접 입력해 변환합니다 (오프라인). 각 통화 1단위 = ? 원 으로 설정.",
    amount: "금액",
    from: "보내는 통화",
    to: "받는 통화",
    rates: "환율 (1단위 = ? 원)",
    result: "환산 결과",
    rate: "적용 환율",
    allTable: "전체 통화 환산",
    currency: "통화",
    value: "환산 금액",
  },
  en: {
    intro: "Convert with manually entered rates (offline). Set each currency: 1 unit = ? KRW.",
    amount: "Amount",
    from: "From",
    to: "To",
    rates: "Rates (1 unit = ? KRW)",
    result: "Converted",
    rate: "Applied rate",
    allTable: "All currencies",
    currency: "Currency",
    value: "Converted amount",
  },
  zh: {
    intro: "手动输入汇率进行换算（离线）。设置每种货币：1 单位 = ? 元。",
    amount: "金额",
    from: "源货币",
    to: "目标货币",
    rates: "汇率 (1 单位 = ? 元)",
    result: "换算结果",
    rate: "适用汇率",
    allTable: "全部货币换算",
    currency: "货币",
    value: "换算金额",
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
  const [rates, setRates] = useToolStateJSON<Record<string, string>>(
    "rates",
    Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)])),
  );
  const [amount, setAmount] = useToolState("amount", "100");
  const [from, setFrom] = useToolState("from", "USD");
  const [to, setTo] = useToolState("to", "KRW");

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

      <ChartCard title={t.allTable}>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-900/40">
                <th className="px-3 py-2 font-medium text-zinc-500">{t.currency}</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-500">{t.value}</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => {
                const rc = Number(rates[c]);
                const v = rc > 0 ? krw / rc : 0;
                return (
                  <tr
                    key={c}
                    className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800/60 ${
                      c === to ? "bg-indigo-500/10" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-zinc-600 dark:text-zinc-300">{c}</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-900 dark:text-zinc-100">
                      {Number.isFinite(v) ? v.toLocaleString("ko-KR", { maximumFractionDigits: 2 }) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

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
