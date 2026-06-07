import { useState } from "react";
import { Field, TextInput, Stat, CopyButton } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "2 · 8 · 10 · 16진수 상호 변환 + 비트 시프트.",
    from: "입력 진법",
    value: "값",
    shift: "비트 시프트",
    shiftLeft: "<< 왼쪽",
    shiftRight: ">> 오른쪽",
    by: "비트 수",
    bin: "2진수",
    oct: "8진수",
    dec: "10진수",
    hex: "16진수",
    bits: "비트 표현(32)",
    invalid: "해당 진법에 맞지 않는 값",
  },
  en: {
    intro: "Convert between base 2 · 8 · 10 · 16 + bit shift.",
    from: "Input base",
    value: "Value",
    shift: "Bit shift",
    shiftLeft: "<< left",
    shiftRight: ">> right",
    by: "Bits",
    bin: "Binary",
    oct: "Octal",
    dec: "Decimal",
    hex: "Hex",
    bits: "Bit view (32)",
    invalid: "Value not valid for this base",
  },
  zh: {
    intro: "2 · 8 · 10 · 16 进制互转 + 位移。",
    from: "输入进制",
    value: "数值",
    shift: "位移",
    shiftLeft: "<< 左移",
    shiftRight: ">> 右移",
    by: "位数",
    bin: "二进制",
    oct: "八进制",
    dec: "十进制",
    hex: "十六进制",
    bits: "位表示(32)",
    invalid: "该进制下数值无效",
  },
} as const;

const BASES = [
  { base: 2, re: /^[01]+$/ },
  { base: 8, re: /^[0-7]+$/ },
  { base: 10, re: /^[0-9]+$/ },
  { base: 16, re: /^[0-9a-fA-F]+$/ },
];

export default function BaseConvertTool() {
  const t = TEXT[useLang()];
  const [base, setBase] = useState(16);
  const [value, setValue] = useState("FF");
  const [shift, setShift] = useState("0");

  const spec = BASES.find((b) => b.base === base)!;
  const clean = value.trim();
  const valid = clean !== "" && spec.re.test(clean);
  let n = valid ? parseInt(clean, base) : NaN;
  const s = Number(shift) | 0;
  if (Number.isFinite(n) && s !== 0) {
    n = s > 0 ? n << s : n >> -s;
    n = n >>> 0; // unsigned 32
  }

  const bits = Number.isFinite(n)
    ? (n >>> 0).toString(2).padStart(8, "0").replace(/(.{8})/g, "$1 ").trim()
    : "—";

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.from}>
          <div className="flex gap-2">
            {BASES.map((b) => (
              <button
                key={b.base}
                onClick={() => setBase(b.base)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  b.base === base
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {b.base}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t.value}>
          <TextInput mono value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
      </div>
      <Field label={`${t.shift} (${t.by})`} hint={`${t.shiftLeft} > 0 / ${t.shiftRight} < 0`}>
        <TextInput
          mono
          inputMode="numeric"
          value={shift}
          onChange={(e) => setShift(e.target.value.replace(/[^-0-9]/g, ""))}
          className="w-32"
        />
      </Field>
      {!valid && <p className="text-sm text-red-400">{t.invalid}</p>}
      {Number.isFinite(n) && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t.bin} value={n.toString(2)} />
            <Stat label={t.oct} value={n.toString(8)} />
            <Stat label={t.dec} value={n.toString(10)} accent />
            <Stat label={t.hex} value={n.toString(16).toUpperCase()} accent />
          </div>
          <Field label={t.bits}>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-md border border-zinc-200 bg-zinc-100 p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900">
                {bits}
              </code>
              <CopyButton value={n.toString(16).toUpperCase()} />
            </div>
          </Field>
        </>
      )}
    </div>
  );
}
