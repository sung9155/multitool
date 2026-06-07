import { Field, Stat, TextInput } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

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
    breakdown: "차이 분석",
    metric: "항목",
    value: "값",
    totalDays: "총 일수",
    totalWeeks: "총 주수",
    ymd: "연/월/일",
    absDays: "절대 일수",
    fmtWeeks: (w: number, d: number) => `${w}주 ${d}일`,
    fmtYmd: (y: number, m: number, d: number) => `${y}년 ${m}개월 ${d}일`,
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
    breakdown: "Difference breakdown",
    metric: "Metric",
    value: "Value",
    totalDays: "Total days",
    totalWeeks: "Total weeks",
    ymd: "Years / Months / Days",
    absDays: "Absolute days",
    fmtWeeks: (w: number, d: number) => `${w} wk ${d} d`,
    fmtYmd: (y: number, m: number, d: number) => `${y} y ${m} mo ${d} d`,
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
    breakdown: "差值分析",
    metric: "项目",
    value: "值",
    totalDays: "总天数",
    totalWeeks: "总周数",
    ymd: "年/月/日",
    absDays: "绝对天数",
    fmtWeeks: (w: number, d: number) => `${w}周 ${d}天`,
    fmtYmd: (y: number, m: number, d: number) => `${y}年 ${m}个月 ${d}天`,
  },
} as const;

const today = () => new Date().toISOString().slice(0, 10);

type Tab = "diff" | "offset";

export default function DateCalcTool() {
  const t = TEXT[useLang()];
  const [tab, setTab] = useToolState<Tab>("tab", "diff");

  // 두 날짜 차이
  const [start, setStart] = useToolState("start", today());
  const [end, setEnd] = useToolState("end", today());

  // N일 후/전
  const [base, setBase] = useToolState("base", today());
  const [days, setDays] = useToolState("days", "100");

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

  // 연/월/일 분해 (시작→종료, 달력 기준)
  function ymdDiff(a: number, b: number) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    const lo = new Date(Math.min(a, b));
    const hi = new Date(Math.max(a, b));
    let years = hi.getUTCFullYear() - lo.getUTCFullYear();
    let months = hi.getUTCMonth() - lo.getUTCMonth();
    let dayDiff = hi.getUTCDate() - lo.getUTCDate();
    if (dayDiff < 0) {
      months -= 1;
      const prevMonth = new Date(
        Date.UTC(hi.getUTCFullYear(), hi.getUTCMonth(), 0),
      );
      dayDiff += prevMonth.getUTCDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days: dayDiff };
  }
  const ymd = ymdDiff(startMs, endMs);

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

          <Field label={t.breakdown}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700">
                  <th className="py-1.5 pr-3 font-medium">{t.metric}</th>
                  <th className="py-1.5 font-medium">{t.value}</th>
                </tr>
              </thead>
              <tbody className="text-zinc-800 dark:text-zinc-200">
                {(
                  [
                    [
                      t.totalDays,
                      Number.isFinite(diffDays)
                        ? diffDays.toLocaleString(t.locale)
                        : "—",
                    ],
                    [
                      t.absDays,
                      Number.isFinite(diffDays)
                        ? Math.abs(diffDays).toLocaleString(t.locale)
                        : "—",
                    ],
                    [
                      t.totalWeeks,
                      Number.isFinite(diffDays)
                        ? t.fmtWeeks(
                            Math.trunc(Math.abs(diffDays) / 7),
                            Math.abs(diffDays) % 7,
                          )
                        : "—",
                    ],
                    [
                      t.ymd,
                      ymd
                        ? t.fmtYmd(ymd.years, ymd.months, ymd.days)
                        : "—",
                    ],
                    ["D-Day", dday],
                  ] as const
                ).map(([label, v]) => (
                  <tr
                    key={label}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="py-1.5 pr-3 text-zinc-500">{label}</td>
                    <td className="py-1.5 font-mono">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Field>
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
