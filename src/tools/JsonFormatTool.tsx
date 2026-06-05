import { useState } from "react";
import { Button, CopyButton, ErrorText, Field, TextArea } from "../components/ui";

export default function JsonFormatTool() {
  const [input, setInput] = useState('{"hello":"world","list":[1,2,3]}');
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function run(indent: number) {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "잘못된 JSON");
      setOutput("");
    }
  }

  return (
    <div className="space-y-4">
      <Field label="입력 JSON">
        <TextArea
          mono
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <Button onClick={() => run(2)}>정렬 (들여쓰기 2)</Button>
        <Button variant="ghost" onClick={() => run(0)}>
          압축 (Minify)
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
      {output && (
        <Field label="결과">
          <div className="space-y-2">
            <TextArea mono rows={10} value={output} readOnly />
            <CopyButton value={output} />
          </div>
        </Field>
      )}
    </div>
  );
}
