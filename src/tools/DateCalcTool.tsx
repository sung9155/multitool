import { useState } from "react";
import { Field, Stat, TextInput } from "../components/ui";

const today = () => new Date().toISOString().slice(0, 10);

type Tab = "diff" | "offset";

export default function DateCalcTool() {
  const [tab, setTab] = useState<Tab>("diff");

  // 두 날짜 차이
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());

  // N일 후/전
  const [base, setBase] = useState(today());
  const [days, setDays] = useState("100");

  const msPerDay = 86400000;

  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const diffDays =
    Number.isFinite(startMs) && Number.isFinite(endMs)
      ? Math.round((endMs - startMs) / msPerDay)
      : NaN;

  const offsetN = Number(days);
  const baseMs = new Date(base).getTime();
  const resultDate =
    Number.isFinite(baseMs) && Number.isFinite(offsetN)
      ? new Date(baseMs + offsetN * msPerDay)
      : null;

  const weekdayKo = ["일", "월", "화", "수", "목", "금", "토"];
  const fmtDate = (d: Date) =>
    `${d.toISOString().slice(0, 10)} (${weekdayKo[d.getUTCDay()]})`;

  const dday =
    !Number.isFinite(diffDays)
      ? "—"
      : diffDays === 0
        ? "D-Day"
        : diffDays > 0
          ? `D-${diffDays}`
          : `D+${Math.abs(diffDays)}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            ["diff", "두 날짜 차이"],
            ["offset", "N일 후/전"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              t === tab
                ? "bg-indigo-600 text-white"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "diff" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="시작일">
              <TextInput
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="종료일">
              <TextInput
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="일수 차이"
              value={Number.isFinite(diffDays) ? diffDays.toLocaleString("ko-KR") : "—"}
              unit="일"
              accent
            />
            <Stat label="D-Day" value={dday} />
            <Stat
              label="주 (근사)"
              value={Number.isFinite(diffDays) ? (diffDays / 7).toFixed(1) : "—"}
              unit="주"
            />
            <Stat
              label="개월 (근사)"
              value={
                Number.isFinite(diffDays) ? (diffDays / 30.44).toFixed(1) : "—"
              }
              unit="개월"
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="기준일">
              <TextInput
                type="date"
                value={base}
                onChange={(e) => setBase(e.target.value)}
              />
            </Field>
            <Field label="일수 (음수=이전)" hint="예: 100 또는 -30">
              <TextInput
                mono
                inputMode="numeric"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </Field>
          </div>

          <Stat
            label={`${offsetN >= 0 ? `${offsetN}일 후` : `${Math.abs(offsetN)}일 전`}`}
            value={resultDate ? fmtDate(resultDate) : "—"}
            accent
          />
        </>
      )}
    </div>
  );
}
