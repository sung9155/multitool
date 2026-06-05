import { useState } from "react";
import { Button, CopyButton, ErrorText, Field, TextArea } from "../components/ui";

export default function UrlEncodeTool() {
  const [input, setInput] = useState("https://example.com/검색?q=한글 변수");
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
      setError("디코딩 실패 — 올바른 URL 인코딩 문자열인지 확인");
      setOutput("");
    }
  }

  return (
    <div className="space-y-4">
      <Field label="입력">
        <TextArea
          rows={5}
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
            <TextArea mono rows={5} value={output} readOnly />
            <CopyButton value={output} />
          </div>
        </Field>
      )}
    </div>
  );
}
