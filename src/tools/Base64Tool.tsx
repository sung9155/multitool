import { useState } from "react";
import { Button, CopyButton, ErrorText, Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    inputLabel: "입력 (UTF-8 지원)",
    encode: "인코딩 →",
    decode: "← 디코딩",
    decodeError: "디코딩 실패 — 올바른 Base64 인지 확인",
    result: "결과",
  },
  en: {
    inputLabel: "Input (UTF-8 supported)",
    encode: "Encode →",
    decode: "← Decode",
    decodeError: "Decode failed — check that input is valid Base64",
    result: "Result",
  },
  zh: {
    inputLabel: "输入 (支持 UTF-8)",
    encode: "编码 →",
    decode: "← 解码",
    decodeError: "解码失败 — 请确认是有效的 Base64",
    result: "结果",
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
  const [input, setInput] = useState("안녕하세요 Multitool");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

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
    </div>
  );
}
