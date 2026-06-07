import { useState } from "react";
import { Button, CopyButton, ErrorText, Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    inputLabel: "입력 JSON",
    format: "정렬 (들여쓰기 2)",
    minify: "압축 (Minify)",
    invalid: "잘못된 JSON",
    result: "결과",
    statsTitle: "통계",
    type: "최상위 타입",
    count: "키/항목 수",
    depth: "최대 중첩 깊이",
    size: "문자 크기",
  },
  en: {
    inputLabel: "Input JSON",
    format: "Format (indent 2)",
    minify: "Minify",
    invalid: "Invalid JSON",
    result: "Result",
    statsTitle: "Stats",
    type: "Top-level type",
    count: "Keys / items",
    depth: "Max nesting depth",
    size: "Character size",
  },
  zh: {
    inputLabel: "输入 JSON",
    format: "格式化 (缩进 2)",
    minify: "压缩 (Minify)",
    invalid: "无效的 JSON",
    result: "结果",
    statsTitle: "统计",
    type: "顶层类型",
    count: "键 / 项数",
    depth: "最大嵌套深度",
    size: "字符大小",
  },
} as const;

function topType(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function topCount(v: unknown): number {
  if (Array.isArray(v)) return v.length;
  if (v !== null && typeof v === "object") return Object.keys(v).length;
  return 0;
}

function maxDepth(v: unknown): number {
  if (Array.isArray(v)) {
    return 1 + (v.length ? Math.max(...v.map(maxDepth)) : 0);
  }
  if (v !== null && typeof v === "object") {
    const vals = Object.values(v);
    return 1 + (vals.length ? Math.max(...vals.map(maxDepth)) : 0);
  }
  return 0;
}

export default function JsonFormatTool() {
  const t = TEXT[useLang()];
  const [input, setInput] = useToolState(
    "q",
    '{"hello":"world","list":[1,2,3]}',
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function run(indent: number) {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.invalid);
      setOutput("");
    }
  }

  // 유효한 JSON일 때만 통계 산출
  let parsedOk: { value: unknown } | null = null;
  try {
    if (input.trim() !== "") parsedOk = { value: JSON.parse(input) };
  } catch {
    parsedOk = null;
  }

  const statRows: [string, string][] = parsedOk
    ? [
        [t.type, topType(parsedOk.value)],
        [t.count, String(topCount(parsedOk.value))],
        [t.depth, String(maxDepth(parsedOk.value))],
        [t.size, `${input.length.toLocaleString("en-US")} chars`],
      ]
    : [];

  return (
    <div className="space-y-4">
      <Field label={t.inputLabel}>
        <TextArea
          mono
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <Button onClick={() => run(2)}>{t.format}</Button>
        <Button variant="ghost" onClick={() => run(0)}>
          {t.minify}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>

      {parsedOk && (
        <Field label={t.statsTitle}>
          <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <tbody>
                {statRows.map(([label, value]) => (
                  <tr
                    key={label}
                    className="border-t border-zinc-200 first:border-t-0 dark:border-zinc-800"
                  >
                    <td className="w-1/2 px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {label}
                    </td>
                    <td className="px-3 py-2 font-mono text-zinc-900 dark:text-zinc-100">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Field>
      )}

      {output && (
        <Field label={t.result}>
          <div className="space-y-2">
            <TextArea mono rows={10} value={output} readOnly />
            <CopyButton value={output} />
          </div>
        </Field>
      )}
    </div>
  );
}
