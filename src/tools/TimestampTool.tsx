import { useState } from "react";
import { CopyButton, Field, TextInput } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    label: "Unix 타임스탬프",
    hint: "초(10자리) 또는 밀리초(13자리)",
    local: "로컬 시간",
    utc: "UTC (ISO 8601)",
    now: "지금",
  },
  en: {
    label: "Unix timestamp",
    hint: "seconds (10 digits) or milliseconds (13 digits)",
    local: "Local time",
    utc: "UTC (ISO 8601)",
    now: "Now",
  },
  zh: {
    label: "Unix 时间戳",
    hint: "秒(10 位) 或 毫秒(13 位)",
    local: "本地时间",
    utc: "UTC (ISO 8601)",
    now: "现在",
  },
} as const;

function fmt(d: Date) {
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function TimestampTool() {
  const t = TEXT[useLang()];
  const [ts, setTs] = useState(() => String(Math.floor(Date.now() / 1000)));

  const num = Number(ts.trim());
  // 10자리=초, 13자리=밀리초 자동 판별
  const ms = ts.trim().length > 10 ? num : num * 1000;
  const date = new Date(ms);

  return (
    <div className="space-y-4">
      <Field label={t.label} hint={t.hint}>
        <TextInput
          mono
          value={ts}
          onChange={(e) => setTs(e.target.value)}
          placeholder="1700000000"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="text-xs text-zinc-500">{t.local}</div>
          <div className="font-mono text-zinc-900 dark:text-zinc-100">{fmt(date)}</div>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="text-xs text-zinc-500">{t.utc}</div>
          <div className="font-mono text-zinc-900 dark:text-zinc-100">
            {Number.isNaN(date.getTime()) ? "—" : date.toISOString()}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          onClick={() => setTs(String(Math.floor(Date.now() / 1000)))}
        >
          {t.now}
        </button>
        <CopyButton value={fmt(date)} />
      </div>
    </div>
  );
}
