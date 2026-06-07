import { useEffect, useState } from "react";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

interface Zone {
  tz: string;
  ko: string;
  en: string;
  zh: string;
}

const ZONES: Zone[] = [
  { tz: "Asia/Seoul", ko: "서울", en: "Seoul", zh: "首尔" },
  { tz: "Asia/Tokyo", ko: "도쿄", en: "Tokyo", zh: "东京" },
  { tz: "Asia/Shanghai", ko: "베이징/상하이", en: "Beijing", zh: "北京" },
  { tz: "Asia/Singapore", ko: "싱가포르", en: "Singapore", zh: "新加坡" },
  { tz: "Asia/Kolkata", ko: "뉴델리", en: "New Delhi", zh: "新德里" },
  { tz: "Europe/Moscow", ko: "모스크바", en: "Moscow", zh: "莫斯科" },
  { tz: "Europe/Paris", ko: "파리/베를린", en: "Paris", zh: "巴黎" },
  { tz: "Europe/London", ko: "런던", en: "London", zh: "伦敦" },
  { tz: "America/New_York", ko: "뉴욕", en: "New York", zh: "纽约" },
  { tz: "America/Chicago", ko: "시카고", en: "Chicago", zh: "芝加哥" },
  { tz: "America/Los_Angeles", ko: "로스앤젤레스", en: "Los Angeles", zh: "洛杉矶" },
  { tz: "Australia/Sydney", ko: "시드니", en: "Sydney", zh: "悉尼" },
];

const T = {
  ko: { city: "도시", time: "현재 시각", date: "날짜", diff: "시차", base: "기준" },
  en: { city: "City", time: "Time", date: "Date", diff: "Offset", base: "Base" },
  zh: { city: "城市", time: "时间", date: "日期", diff: "时差", base: "基准" },
};

// 특정 타임존의 UTC 오프셋(분)
function tzOffsetMin(tz: string, now: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === "24" ? "0" : map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return Math.round((asUTC - now.getTime()) / 60000);
}

export default function WorldClockTool() {
  const lang = useLang();
  const t = T[lang];
  const [now, setNow] = useState(() => new Date());
  const [base, setBase] = useToolState("base", "Asia/Seoul");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const cityName = (z: Zone) => z[lang];
  const baseOff = tzOffsetMin(base, now);

  const fmtTime = (tz: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : lang === "en" ? "en-US" : "ko-KR", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
  const fmtDate = (tz: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : lang === "en" ? "en-US" : "ko-KR", {
      timeZone: tz,
      month: "short",
      day: "numeric",
      weekday: "short",
    }).format(now);

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{t.base}:</span>
        <select
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {ZONES.map((z) => (
            <option key={z.tz} value={z.tz}>
              {cityName(z)}
            </option>
          ))}
        </select>
      </label>

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t.city}</th>
              <th className="px-3 py-2 text-right font-medium">{t.time}</th>
              <th className="px-3 py-2 text-right font-medium">{t.date}</th>
              <th className="px-3 py-2 text-right font-medium">{t.diff}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {ZONES.map((z) => {
              const diff = (tzOffsetMin(z.tz, now) - baseOff) / 60;
              const isBase = z.tz === base;
              const diffStr =
                diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${diff}h`;
              return (
                <tr
                  key={z.tz}
                  className={
                    isBase
                      ? "bg-indigo-50 font-medium text-zinc-900 dark:bg-indigo-600/15 dark:text-zinc-100"
                      : "text-zinc-700 dark:text-zinc-300"
                  }
                >
                  <td className="px-3 py-2">{cityName(z)}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {fmtTime(z.tz)}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-500">
                    {fmtDate(z.tz)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-500">
                    {diffStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
