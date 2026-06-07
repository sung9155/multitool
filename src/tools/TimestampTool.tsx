import { CopyButton, Field, TextInput } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";
import { ChartCard } from "../components/charts";

const TEXT = {
  ko: {
    label: "Unix 타임스탬프",
    hint: "초(10자리) 또는 밀리초(13자리)",
    local: "로컬 시간",
    utc: "UTC (ISO 8601)",
    now: "지금",
    breakdownTitle: "날짜/시간 분해",
    colField: "항목",
    colValue: "값",
    fYear: "연도",
    fMonth: "월",
    fDay: "일",
    fHour: "시",
    fMinute: "분",
    fSecond: "초",
    fWeekday: "요일",
    fIso: "ISO 8601",
    fUnix: "Unix (초)",
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
  },
  en: {
    label: "Unix timestamp",
    hint: "seconds (10 digits) or milliseconds (13 digits)",
    local: "Local time",
    utc: "UTC (ISO 8601)",
    now: "Now",
    breakdownTitle: "Datetime breakdown",
    colField: "Field",
    colValue: "Value",
    fYear: "Year",
    fMonth: "Month",
    fDay: "Day",
    fHour: "Hour",
    fMinute: "Minute",
    fSecond: "Second",
    fWeekday: "Weekday",
    fIso: "ISO 8601",
    fUnix: "Unix (sec)",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  zh: {
    label: "Unix 时间戳",
    hint: "秒(10 位) 或 毫秒(13 位)",
    local: "本地时间",
    utc: "UTC (ISO 8601)",
    now: "现在",
    breakdownTitle: "日期/时间分解",
    colField: "项目",
    colValue: "数值",
    fYear: "年",
    fMonth: "月",
    fDay: "日",
    fHour: "时",
    fMinute: "分",
    fSecond: "秒",
    fWeekday: "星期",
    fIso: "ISO 8601",
    fUnix: "Unix (秒)",
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
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
  const [ts, setTs] = useToolState("ts", String(Math.floor(Date.now() / 1000)));

  const num = Number(ts.trim());
  // 10자리=초, 13자리=밀리초 자동 판별
  const ms = ts.trim().length > 10 ? num : num * 1000;
  const date = new Date(ms);

  const valid = !Number.isNaN(date.getTime());
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const breakdown: { field: string; value: string }[] = [
    { field: t.fYear, value: valid ? String(date.getFullYear()) : "—" },
    { field: t.fMonth, value: valid ? pad2(date.getMonth() + 1) : "—" },
    { field: t.fDay, value: valid ? pad2(date.getDate()) : "—" },
    { field: t.fHour, value: valid ? pad2(date.getHours()) : "—" },
    { field: t.fMinute, value: valid ? pad2(date.getMinutes()) : "—" },
    { field: t.fSecond, value: valid ? pad2(date.getSeconds()) : "—" },
    { field: t.fWeekday, value: valid ? t.weekdays[date.getDay()] : "—" },
    { field: t.fIso, value: valid ? date.toISOString() : "—" },
    {
      field: t.fUnix,
      value: valid ? String(Math.floor(date.getTime() / 1000)) : "—",
    },
  ];

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

      <ChartCard title={t.breakdownTitle}>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-100 text-left text-xs text-zinc-500 dark:bg-zinc-900/60">
                <th className="px-3 py-2 font-medium">{t.colField}</th>
                <th className="px-3 py-2 text-right font-medium">{t.colValue}</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr
                  key={row.field}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {row.field}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-900 dark:text-zinc-100">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
