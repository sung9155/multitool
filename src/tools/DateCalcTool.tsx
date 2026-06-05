import { useState } from "react";
import { Field, Stat, TextInput } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    tabDiff: "두 날짜 차이",
    tabOffset: "N일 후/전",
    startDate: "시작일",
    endDate: "종료일",
    daysDiff: "일수 차이",
    weeksApprox: "주 (근사)",
    monthsApprox: "개월 (근사)",
    unitDay: "일",
    unitWeek: "주",
    unitMonth: "개월",
    baseDate: "기준일",
    offsetDays: "일수 (음수=이전)",
    offsetHint: "예: 100 또는 -30",
    daysAfter: (n: number) => `${n}일 후`,
    daysBefore: (n: number) => `${n}일 전`,
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    locale: "ko-KR",
  },
  en: {
    tabDiff: "Date difference",
    tabOffset: "N days after/before",
    startDate: "Start date",
    endDate: "End date",
    daysDiff: "Days difference",
    weeksApprox: "Weeks (approx.)",
    monthsApprox: "Months (approx.)",
    unitDay: "days",
    unitWeek: "wk",
    unitMonth: "mo",
    baseDate: "Base date",
    offsetDays: "Days (negative = before)",
    offsetHint: "e.g. 100 or -30",
    daysAfter: (n: number) => `${n} days after`,
    daysBefore: (n: number) => `${n} days before`,
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    locale: "en-US",
  },
  zh: {
    tabDiff: "两个日期差值",
    tabOffset: "N天后/前",
    startDate: "开始日期",
    endDate: "结束日期",
    daysDiff: "天数差值",
    weeksApprox: "周（约）",
    monthsApprox: "个月（约）",
    unitDay: "天",
    unitWeek: "周",
    unitMonth: "个月",
    baseDate: "基准日期",
    offsetDays: "天数（负数=之前）",
    offsetHint: "例: 100 或 -30",
    daysAfter: (n: number) => `${n}天后`,
    daysBefore: (n: number) => `${n}天前`,
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    locale: "zh-CN",
  },
} as const;

const today = () => new Date().toISOString().slice(0, 10);

type Tab = "diff" | "offset";

export default function DateCalcTool() {
  const t = TEXT[useLang()];
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

  const fmtDate = (d: Date) =>
    `${d.toISOString().slice(0, 10)} (${t.weekdays[d.getUTCDay()]})`;

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
            ["diff", t.tabDiff],
            ["offset", t.tabOffset],
          ] as const
        ).map(([tabId, label]) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tabId === tab
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
            <Field label={t.startDate}>
              <TextInput
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label={t.endDate}>
              <TextInput
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={t.daysDiff}
              value={Number.isFinite(diffDays) ? diffDays.toLocaleString(t.locale) : "—"}
              unit={t.unitDay}
              accent
            />
            <Stat label="D-Day" value={dday} />
            <Stat
              label={t.weeksApprox}
              value={Number.isFinite(diffDays) ? (diffDays / 7).toFixed(1) : "—"}
              unit={t.unitWeek}
            />
            <Stat
              label={t.monthsApprox}
              value={
                Number.isFinite(diffDays) ? (diffDays / 30.44).toFixed(1) : "—"
              }
              unit={t.unitMonth}
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.baseDate}>
              <TextInput
                type="date"
                value={base}
                onChange={(e) => setBase(e.target.value)}
              />
            </Field>
            <Field label={t.offsetDays} hint={t.offsetHint}>
              <TextInput
                mono
                inputMode="numeric"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </Field>
          </div>

          <Stat
            label={offsetN >= 0 ? t.daysAfter(offsetN) : t.daysBefore(Math.abs(offsetN))}
            value={resultDate ? fmtDate(resultDate) : "—"}
            accent
          />
        </>
      )}
    </div>
  );
}
