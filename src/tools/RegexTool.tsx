import { useMemo, useState } from "react";
import { ErrorText, Field, TextArea, TextInput } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    pattern: "정규식 패턴",
    flags: "플래그",
    testStr: "테스트 문자열",
    matches: "매치",
    count: "개 매치",
    groups: "그룹",
    noMatch: "매치 없음",
    invalid: "잘못된 정규식",
    flagHint: "예: gi, gm",
  },
  en: {
    pattern: "Regex pattern",
    flags: "Flags",
    testStr: "Test string",
    matches: "Matches",
    count: " matches",
    groups: "Groups",
    noMatch: "No match",
    invalid: "Invalid regex",
    flagHint: "e.g. gi, gm",
  },
  zh: {
    pattern: "正则表达式",
    flags: "标志",
    testStr: "测试字符串",
    matches: "匹配",
    count: " 处匹配",
    groups: "分组",
    noMatch: "无匹配",
    invalid: "无效的正则表达式",
    flagHint: "如: gi, gm",
  },
} as const;

export default function RegexTool() {
  const t = TEXT[useLang()];
  const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState(
    "문의: hong@example.com, support@test.co.kr 로 연락주세요.",
  );

  const { error, parts, matchList } = useMemo(() => {
    if (!pattern)
      return { error: "", parts: [{ text, hit: false }], matchList: [] };
    let re: RegExp;
    try {
      re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "invalid",
        parts: [],
        matchList: [],
      };
    }
    const segs: { text: string; hit: boolean }[] = [];
    const list: { match: string; groups: string[]; index: number }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(text)) !== null && guard++ < 10000) {
      if (m.index > last) segs.push({ text: text.slice(last, m.index), hit: false });
      segs.push({ text: m[0], hit: true });
      last = m.index + m[0].length;
      list.push({ match: m[0], groups: m.slice(1), index: m.index });
      if (m[0] === "") re.lastIndex++; // 빈 매치 무한루프 방지
    }
    if (last < text.length) segs.push({ text: text.slice(last), hit: false });
    return { error: "", parts: segs, matchList: list };
  }, [pattern, flags, text]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label={t.pattern}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-400">/</span>
            <TextInput
              mono
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
            <span className="font-mono text-zinc-400">/</span>
          </div>
        </Field>
        <Field label={t.flags} hint={t.flagHint}>
          <TextInput
            mono
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            className="w-24"
          />
        </Field>
      </div>

      <Field label={t.testStr}>
        <TextArea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>

      <ErrorText>{error ? `${t.invalid}: ${error}` : ""}</ErrorText>

      {!error && (
        <>
          <Field label={`${t.matches} (${matchList.length}${t.count})`}>
            <div className="whitespace-pre-wrap break-words rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {parts.map((p, i) =>
                p.hit ? (
                  <mark
                    key={i}
                    className="rounded bg-amber-300 px-0.5 text-zinc-900 dark:bg-amber-400"
                  >
                    {p.text}
                  </mark>
                ) : (
                  <span key={i} className="text-zinc-700 dark:text-zinc-300">
                    {p.text}
                  </span>
                ),
              )}
            </div>
          </Field>

          {matchList.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">{t.matches}</th>
                    <th className="px-3 py-2 text-left font-medium">{t.groups}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {matchList.slice(0, 50).map((m, i) => (
                    <tr key={i} className="text-zinc-700 dark:text-zinc-300">
                      <td className="px-3 py-1.5 text-zinc-400">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono">{m.match}</td>
                      <td className="px-3 py-1.5 font-mono text-zinc-500">
                        {m.groups.length ? m.groups.join(" · ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
