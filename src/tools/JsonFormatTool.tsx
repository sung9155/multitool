import { useState } from "react";
import { Button, CopyButton, ErrorText, Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    inputLabel: "입력 JSON",
    format: "정렬 (들여쓰기 2)",
    minify: "압축 (Minify)",
    invalid: "잘못된 JSON",
    result: "결과",
  },
  en: {
    inputLabel: "Input JSON",
    format: "Format (indent 2)",
    minify: "Minify",
    invalid: "Invalid JSON",
    result: "Result",
  },
  zh: {
    inputLabel: "输入 JSON",
    format: "格式化 (缩进 2)",
    minify: "压缩 (Minify)",
    invalid: "无效的 JSON",
    result: "结果",
  },
} as const;

export default function JsonFormatTool() {
  const t = TEXT[useLang()];
  const [input, setInput] = useState('{"hello":"world","list":[1,2,3]}');
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
