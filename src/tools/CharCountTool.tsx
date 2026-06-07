import { Field, Stat, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";
import { Bars, ChartCard } from "../components/charts";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    withSpaces: "글자수 (공백 포함)",
    withoutSpaces: "글자수 (공백 제외)",
    words: "단어수",
    lines: "줄수",
    bytes: "바이트 (UTF-8)",
    unitChar: "자",
    unitWord: "개",
    unitLine: "줄",
    inputLabel: "텍스트 입력",
    inputHint: "실시간 통계",
    chartTitle: "통계 시각화",
    chars: "글자수",
    note: "트위터(280자) · SMS(한글 90바이트 / LMS 2000바이트) 제한 참고용.",
  },
  en: {
    withSpaces: "Characters (with spaces)",
    withoutSpaces: "Characters (without spaces)",
    words: "Words",
    lines: "Lines",
    bytes: "Bytes (UTF-8)",
    unitChar: "",
    unitWord: "",
    unitLine: "",
    inputLabel: "Text input",
    inputHint: "Live stats",
    chartTitle: "Stats visualization",
    chars: "Characters",
    note: "For Twitter (280 chars) · SMS (Korean 90 bytes / LMS 2000 bytes) limits.",
  },
  zh: {
    withSpaces: "字数 (含空格)",
    withoutSpaces: "字数 (不含空格)",
    words: "单词数",
    lines: "行数",
    bytes: "字节 (UTF-8)",
    unitChar: "字",
    unitWord: "个",
    unitLine: "行",
    inputLabel: "文本输入",
    inputHint: "实时统计",
    chartTitle: "统计可视化",
    chars: "字数",
    note: "供 Twitter(280 字) · 短信(韩文 90 字节 / LMS 2000 字节) 限制参考。",
  },
} as const;

export default function CharCountTool() {
  const t = TEXT[useLang()];
  const [text, setText] = useToolState(
    "q",
    "안녕하세요. Multitool 글자수 세기 도구입니다.\n여러 줄도 지원합니다.",
  );

  const withSpaces = text.length;
  const withoutSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lines = text === "" ? 0 : text.split(/\n/).length;
  const bytes = new TextEncoder().encode(text).length;

  const stats: [string, number, string?][] = [
    [t.withSpaces, withSpaces, t.unitChar],
    [t.withoutSpaces, withoutSpaces, t.unitChar],
    [t.words, words, t.unitWord],
    [t.lines, lines, t.unitLine],
    [t.bytes, bytes, "B"],
  ];

  return (
    <div className="space-y-4">
      <Field label={t.inputLabel} hint={t.inputHint}>
        <TextArea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([label, val, unit]) => (
          <Stat
            key={label}
            label={label}
            value={val.toLocaleString("ko-KR")}
            unit={unit}
          />
        ))}
      </div>

      <ChartCard title={t.chartTitle}>
        <Bars
          items={[
            {
              label: t.chars,
              value: withSpaces,
              display: withSpaces.toLocaleString("en-US"),
            },
            {
              label: t.words,
              value: words,
              display: words.toLocaleString("en-US"),
            },
            {
              label: t.lines,
              value: lines,
              display: lines.toLocaleString("en-US"),
            },
            {
              label: t.bytes,
              value: bytes,
              display: `${bytes.toLocaleString("en-US")} B`,
            },
          ]}
        />
      </ChartCard>

      <p className="text-xs text-zinc-500">{t.note}</p>
    </div>
  );
}
