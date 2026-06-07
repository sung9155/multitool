import { Field, TextInput, Stat } from "../components/ui";
import { useToolState } from "../components/toolState";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "표준 5필드 cron (분 시 일 월 요일). 다음 실행 시각을 미리봅니다.",
    expr: "cron 표현식",
    summary: "해석",
    next: "다음 실행 (로컬)",
    invalid: "표현식 형식 오류 (5개 필드 필요)",
    min: "분", hour: "시", dom: "일", mon: "월", dow: "요일",
    every: "매", everyN: "마다", at: "", on: "",
    grid: "주간 실행 그리드 (요일 × 시)",
    days: ["일", "월", "화", "수", "목", "금", "토"],
  },
  en: {
    intro: "Standard 5-field cron (min hour dom mon dow). Preview next run times.",
    expr: "cron expression",
    summary: "Meaning",
    next: "Next runs (local)",
    invalid: "Invalid format (need 5 fields)",
    min: "minute", hour: "hour", dom: "day-of-month", mon: "month", dow: "day-of-week",
    every: "every", everyN: "every", at: "at", on: "on",
    grid: "Weekly schedule grid (day × hour)",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  zh: {
    intro: "标准 5 字段 cron (分 时 日 月 周)。预览下次执行时间。",
    expr: "cron 表达式",
    summary: "解释",
    next: "下次执行 (本地)",
    invalid: "格式错误 (需 5 个字段)",
    min: "分", hour: "时", dom: "日", mon: "月", dow: "周",
    every: "每", everyN: "每", at: "", on: "",
    grid: "每周执行网格 (周 × 时)",
    days: ["日", "一", "二", "三", "四", "五", "六"],
  },
} as const;

// 필드 → 허용 값 집합
function expand(field: string, min: number, max: number): number[] | null {
  const out = new Set<number>();
  for (const part of field.split(",")) {
    let step = 1;
    let range = part;
    const slash = part.split("/");
    if (slash.length === 2) {
      range = slash[0];
      step = Number(slash[1]);
      if (!Number.isInteger(step) || step <= 0) return null;
    }
    let lo = min, hi = max;
    if (range === "*" || range === "") {
      // keep full
    } else if (range.includes("-")) {
      const [a, b] = range.split("-").map(Number);
      if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
      lo = a; hi = b;
    } else {
      const v = Number(range);
      if (!Number.isInteger(v)) return null;
      lo = hi = v;
    }
    if (lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return [...out].sort((a, b) => a - b);
}

function parse(expr: string) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const mins = expand(parts[0], 0, 59);
  const hours = expand(parts[1], 0, 23);
  const doms = expand(parts[2], 1, 31);
  const mons = expand(parts[3], 1, 12);
  const dows = expand(parts[4], 0, 6); // 0=Sun
  if (!mins || !hours || !doms || !mons || !dows) return null;
  return { mins, hours, doms, mons, dows, raw: parts };
}

function nextRuns(p: NonNullable<ReturnType<typeof parse>>, count: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  const domRestricted = p.raw[2] !== "*";
  const dowRestricted = p.raw[4] !== "*";
  for (let i = 0; i < 525600 && out.length < count; i++) {
    const m = d.getMinutes(), h = d.getHours();
    const dom = d.getDate(), mon = d.getMonth() + 1, dow = d.getDay();
    const domOk = p.doms.includes(dom);
    const dowOk = p.dows.includes(dow);
    // cron: dom/dow 둘 다 제한 시 OR, 아니면 AND
    const dayOk =
      domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk;
    if (p.mins.includes(m) && p.hours.includes(h) && p.mons.includes(mon) && dayOk) {
      out.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}

export default function CronTool() {
  const t = TEXT[useLang()];
  const [expr, setExpr] = useToolState("expr", "0 */2 * * 1-5");

  const p = parse(expr);
  const runs = p ? nextRuns(p, 6) : [];

  const fieldDesc = (label: string, raw: string) =>
    raw === "*" ? `${label}: *` : `${label}: ${raw}`;

  // 그리드: 해당 시(hour)에 발화 분이 하나라도 있으면 활성, 요일은 dows 매칭
  const hourActive = p ? new Set(p.hours) : new Set<number>();

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <Field label={t.expr}>
        <TextInput mono value={expr} onChange={(e) => setExpr(e.target.value)} />
      </Field>
      {!p && <p className="text-sm text-red-400">{t.invalid}</p>}
      {p && (
        <>
          <div className="grid gap-3 sm:grid-cols-5">
            <Stat label={t.min} value={p.raw[0]} />
            <Stat label={t.hour} value={p.raw[1]} />
            <Stat label={t.dom} value={p.raw[2]} />
            <Stat label={t.mon} value={p.raw[3]} />
            <Stat label={t.dow} value={p.raw[4]} />
          </div>
          <Field label={t.next}>
            <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
              {runs.map((r, i) => (
                <li key={i} className="px-3 py-2 font-mono text-sm">
                  {r.toLocaleString()}
                </li>
              ))}
              {runs.length === 0 && (
                <li className="px-3 py-2 text-sm text-zinc-500">—</li>
              )}
            </ul>
          </Field>
          <Field label={t.grid}>
            <div className="overflow-x-auto">
              <table className="border-collapse text-[10px]">
                <thead>
                  <tr>
                    <th className="w-8" />
                    {Array.from({ length: 24 }, (_, h) => (
                      <th key={h} className="px-0.5 font-normal text-zinc-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.days.map((dayName, dow) => (
                    <tr key={dow}>
                      <td className="pr-1 text-right text-zinc-500">{dayName}</td>
                      {Array.from({ length: 24 }, (_, h) => {
                        const active = p.dows.includes(dow) && hourActive.has(h);
                        return (
                          <td key={h} className="p-px">
                            <div
                              className={`h-3 w-3 rounded-sm ${
                                active
                                  ? "bg-indigo-500"
                                  : "bg-zinc-200 dark:bg-zinc-800"
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Field>
        </>
      )}
      <p className="text-xs text-zinc-400">{fieldDesc(t.summary, expr)}</p>
    </div>
  );
}
