import { useState } from "react";
import { Button, CopyButton, ErrorText, Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    inputLabel: "입력 (UTF-8 지원)",
    encode: "인코딩 →",
    decode: "← 디코딩",
    decodeError: "디코딩 실패 — 올바른 Base64 인지 확인",
    result: "결과",
    stats: "통계",
    metric: "항목",
    value: "값",
    inputChars: "입력 문자 수",
    outputChars: "출력 문자 수",
    byteSize: "바이트 크기 (근사)",
    unitChars: "자",
    unitBytes: "B",
  },
  en: {
    inputLabel: "Input (UTF-8 supported)",
    encode: "Encode →",
    decode: "← Decode",
    decodeError: "Decode failed — check that input is valid Base64",
    result: "Result",
    stats: "Stats",
    metric: "Metric",
    value: "Value",
    inputChars: "Input chars",
    outputChars: "Output chars",
    byteSize: "Byte size (approx.)",
    unitChars: "chars",
    unitBytes: "B",
  },
  zh: {
    inputLabel: "输入 (支持 UTF-8)",
    encode: "编码 →",
    decode: "← 解码",
    decodeError: "解码失败 — 请确认是有效的 Base64",
    result: "结果",
    stats: "统计",
    metric: "项目",
    value: "值",
    inputChars: "输入字符数",
    outputChars: "输出字符数",
    byteSize: "字节大小（约）",
    unitChars: "字符",
    unitBytes: "字节",
  },
} as const;

function encode(s: string) {
  return btoa(unescape(encodeURIComponent(s)));
}
function decode(s: string) {
  return decodeURIComponent(escape(atob(s)));
}

export default function Base64Tool() {
  const t = TEXT[useLang()];
  const [input, setInput] = useToolState("input", "안녕하세요 Multitool");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const byteSize = output
    ? (() => {
        try {
          return new TextEncoder().encode(output).length;
        } catch {
          return output.length;
        }
      })()
    : 0;

  function run(mode: "encode" | "decode") {
    try {
      setOutput(mode === "encode" ? encode(input) : decode(input.trim()));
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
          rows={6}
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
            <TextArea mono rows={6} value={output} readOnly />
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
                  [t.inputChars, `${input.length.toLocaleString()} ${t.unitChars}`],
                  [t.outputChars, `${output.length.toLocaleString()} ${t.unitChars}`],
                  [t.byteSize, `${byteSize.toLocaleString()} ${t.unitBytes}`],
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
