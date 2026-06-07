import { useState } from "react";
import { Button, CopyButton, ErrorText, Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    inputLabel: "입력",
    encode: "인코딩 →",
    decode: "← 디코딩",
    decodeError: "디코딩 실패 — 올바른 URL 인코딩 문자열인지 확인",
    result: "결과",
    stats: "통계",
    metric: "항목",
    value: "값",
    inputLen: "입력 길이",
    outputLen: "출력 길이",
    delta: "증감",
    unitChars: "자",
  },
  en: {
    inputLabel: "Input",
    encode: "Encode →",
    decode: "← Decode",
    decodeError: "Decode failed — check that input is a valid URL-encoded string",
    result: "Result",
    stats: "Stats",
    metric: "Metric",
    value: "Value",
    inputLen: "Input length",
    outputLen: "Output length",
    delta: "Delta",
    unitChars: "chars",
  },
  zh: {
    inputLabel: "输入",
    encode: "编码 →",
    decode: "← 解码",
    decodeError: "解码失败 — 请确认是有效的 URL 编码字符串",
    result: "结果",
    stats: "统计",
    metric: "项目",
    value: "值",
    inputLen: "输入长度",
    outputLen: "输出长度",
    delta: "增减",
    unitChars: "字符",
  },
} as const;

export default function UrlEncodeTool() {
  const t = TEXT[useLang()];
  const [input, setInput] = useToolState("input", "https://example.com/검색?q=한글 변수");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function run(mode: "encode" | "decode") {
    try {
      setOutput(
        mode === "encode"
          ? encodeURIComponent(input)
          : decodeURIComponent(input.trim()),
      );
      setError("");
    } catch {
      setError(t.decodeError);
      setOutput("");
    }
  }

  return (
    <div className="space-y-4">
      <Field label={t.inputLabel}>
        <TextArea
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <Button onClick={() => run("encode")}>{t.encode}</Button>
        <Button variant="ghost" onClick={() => run("decode")}>
          {t.decode}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
      {output && (
        <Field label={t.result}>
          <div className="space-y-2">
            <TextArea mono rows={5} value={output} readOnly />
            <CopyButton value={output} />
          </div>
        </Field>
      )}

      {output && (
        <Field label={t.stats}>
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
                  [t.inputLen, `${input.length.toLocaleString()} ${t.unitChars}`],
                  [t.outputLen, `${output.length.toLocaleString()} ${t.unitChars}`],
                  [
                    t.delta,
                    `${output.length - input.length >= 0 ? "+" : ""}${(
                      output.length - input.length
                    ).toLocaleString()} ${t.unitChars}`,
                  ],
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
      )}
    </div>
  );
}
