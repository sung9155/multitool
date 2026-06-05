import { useState } from "react";
import { Field, TextInput } from "../components/ui";

const won = (n: number) =>
  Number.isFinite(n) ? Math.round(n).toLocaleString("ko-KR") + " 원" : "—";

export default function VatTool() {
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
      <Field label="입력 금액 기준">
        <div className="flex gap-2">
          {(
            [
              ["supply", "공급가액 (세전)"],
              ["total", "합계금액 (세포함)"],
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
        <Field label="금액">
          <TextInput
            mono
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="부가세율 (%)">
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
          ["공급가액", supply],
          ["부가세", vat],
          ["합계금액", total],
        ].map(([label, v]) => (
          <div
            key={label as string}
            className="rounded-md border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="text-xs text-zinc-500">{label}</div>
            <div className="font-mono text-lg text-zinc-900 dark:text-zinc-100">
              {won(v as number)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
