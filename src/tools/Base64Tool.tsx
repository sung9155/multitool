import { useState } from "react";
import { Button, CopyButton, ErrorText, Field, TextArea } from "../components/ui";

function encode(s: string) {
  return btoa(unescape(encodeURIComponent(s)));
}
function decode(s: string) {
  return decodeURIComponent(escape(atob(s)));
}

export default function Base64Tool() {
  const [input, setInput] = useState("안녕하세요 Multitool");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function run(mode: "encode" | "decode") {
    try {
      setOutput(mode === "encode" ? encode(input) : decode(input.trim()));
      setError("");
    } catch {
      setError("디코딩 실패 — 올바른 Base64 인지 확인");
      setOutput("");
    }
  }

  return (
    <div className="space-y-4">
      <Field label="입력 (UTF-8 지원)">
        <TextArea
          rows={6}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <Button onClick={() => run("encode")}>인코딩 →</Button>
        <Button variant="ghost" onClick={() => run("decode")}>
          ← 디코딩
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
      {output && (
        <Field label="결과">
          <div className="space-y-2">
            <TextArea mono rows={6} value={output} readOnly />
            <CopyButton value={output} />
          </div>
        </Field>
      )}
    </div>
  );
}
