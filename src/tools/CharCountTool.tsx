import { useState } from "react";
import { Field, Stat, TextArea } from "../components/ui";

export default function CharCountTool() {
  const [text, setText] = useState(
    "안녕하세요. Multitool 글자수 세기 도구입니다.\n여러 줄도 지원합니다.",
  );

  const withSpaces = text.length;
  const withoutSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lines = text === "" ? 0 : text.split(/\n/).length;
  const bytes = new TextEncoder().encode(text).length;

  const stats: [string, number, string?][] = [
    ["글자수 (공백 포함)", withSpaces, "자"],
    ["글자수 (공백 제외)", withoutSpaces, "자"],
    ["단어수", words, "개"],
    ["줄수", lines, "줄"],
    ["바이트 (UTF-8)", bytes, "B"],
  ];

  return (
    <div className="space-y-4">
      <Field label="텍스트 입력" hint="실시간 통계">
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

      <p className="text-xs text-zinc-500">
        트위터(280자) · SMS(한글 90바이트 / LMS 2000바이트) 제한 참고용.
      </p>
    </div>
  );
}
