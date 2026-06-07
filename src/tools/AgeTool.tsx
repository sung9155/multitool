import { useState } from "react";
import { Field, TextInput, Stat } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "생년월일로 만 나이·연 나이와 살아온 일수를 계산합니다.",
    birth: "생년월일",
    base: "기준일",
    intl: "만 나이",
    korAge: "연 나이(한국식)",
    days: "살아온 일수",
    nextBday: "다음 생일까지",
    years: "세",
    day: "일",
    invalid: "날짜를 확인하세요",
  },
  en: {
    intro: "Compute international/Korean age and days lived from a birth date.",
    birth: "Birth date",
    base: "As of",
    intl: "International age",
    korAge: "Year age (Korean)",
    days: "Days lived",
    nextBday: "Until next birthday",
    years: "yr",
    day: "d",
    invalid: "Check the date",
  },
  zh: {
    intro: "根据出生日期计算周岁/虚岁和已度过天数。",
    birth: "出生日期",
    base: "基准日",
    intl: "周岁",
    korAge: "虚岁(韩式)",
    days: "已度过天数",
    nextBday: "距下次生日",
    years: "岁",
    day: "天",
    invalid: "请检查日期",
  },
} as const;

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AgeTool() {
  const t = TEXT[useLang()];
  const [birth, setBirth] = useState("1990-01-01");
  const [base, setBase] = useState(todayStr());

  const b = new Date(birth);
  const n = new Date(base);
  const valid = !isNaN(b.getTime()) && !isNaN(n.getTime()) && b <= n;

  let intl = 0, days = 0, nextDays = 0, korean = 0;
  if (valid) {
    intl = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) intl--;
    korean = n.getFullYear() - b.getFullYear() + 1;
    days = Math.floor((n.getTime() - b.getTime()) / 86400000);
    const next = new Date(n.getFullYear(), b.getMonth(), b.getDate());
    if (next < n) next.setFullYear(next.getFullYear() + 1);
    nextDays = Math.ceil((next.getTime() - n.getTime()) / 86400000);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.birth}>
          <TextInput type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
        </Field>
        <Field label={t.base}>
          <TextInput type="date" value={base} onChange={(e) => setBase(e.target.value)} />
        </Field>
      </div>
      {!valid ? (
        <p className="text-sm text-red-400">{t.invalid}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t.intl} value={intl} unit={t.years} accent />
          <Stat label={t.korAge} value={korean} unit={t.years} />
          <Stat label={t.days} value={days.toLocaleString()} unit={t.day} />
          <Stat label={t.nextBday} value={nextDays} unit={t.day} accent />
        </div>
      )}
    </div>
  );
}
