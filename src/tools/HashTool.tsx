import { useEffect, useState } from "react";
import { CopyButton, Field, TextArea } from "../components/ui";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type Algo = (typeof ALGOS)[number];

async function hash(algo: Algo, text: string) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function HashTool() {
  const [algo, setAlgo] = useState<Algo>("SHA-256");
  const [input, setInput] = useState("hello");
  const [digest, setDigest] = useState("");

  useEffect(() => {
    let alive = true;
    hash(algo, input).then((d) => {
      if (alive) setDigest(d);
    });
    return () => {
      alive = false;
    };
  }, [algo, input]);

  return (
    <div className="space-y-4">
      <Field label="알고리즘">
        <div className="flex flex-wrap gap-2">
          {ALGOS.map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                a === algo
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>
      <Field label="입력 텍스트">
        <TextArea
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </Field>
      <Field label={`${algo} 해시`}>
        <div className="space-y-2">
          <div className="break-all rounded-md border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100">
            {digest}
          </div>
          <CopyButton value={digest} />
        </div>
      </Field>
    </div>
  );
}
