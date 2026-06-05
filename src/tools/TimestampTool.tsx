import { useState } from "react";
import { CopyButton, Field, TextInput } from "../components/ui";

function fmt(d: Date) {
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function TimestampTool() {
  const [ts, setTs] = useState(() => String(Math.floor(Date.now() / 1000)));

  const num = Number(ts.trim());
  // 10자리=초, 13자리=밀리초 자동 판별
  const ms = ts.trim().length > 10 ? num : num * 1000;
  const date = new Date(ms);

  return (
    <div className="space-y-4">
      <Field label="Unix 타임스탬프" hint="초(10자리) 또는 밀리초(13자리)">
        <TextInput
          mono
          value={ts}
          onChange={(e) => setTs(e.target.value)}
          placeholder="1700000000"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
          <div className="text-xs text-zinc-500">로컬 시간</div>
          <div className="font-mono text-zinc-100">{fmt(date)}</div>
        </div>
        <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
          <div className="text-xs text-zinc-500">UTC (ISO 8601)</div>
          <div className="font-mono text-zinc-100">
            {Number.isNaN(date.getTime()) ? "—" : date.toISOString()}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
          onClick={() => setTs(String(Math.floor(Date.now() / 1000)))}
        >
          지금
        </button>
        <CopyButton value={fmt(date)} />
      </div>
    </div>
  );
}
