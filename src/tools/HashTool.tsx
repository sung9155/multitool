import { useEffect, useState } from "react";
import { CopyButton, Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: { algo: "알고리즘", input: "입력 텍스트", hashSuffix: "해시" },
  en: { algo: "Algorithm", input: "Input text", hashSuffix: "hash" },
  zh: { algo: "算法", input: "输入文本", hashSuffix: "哈希" },
} as const;

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
  const t = TEXT[useLang()];
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
      <Field label={t.algo}>
        <div className="flex flex-wrap gap-2">
          {ALGOS.map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                a === algo
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>
      <Field label={t.input}>
        <TextArea
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </Field>
      <Field label={`${algo} ${t.hashSuffix}`}>
        <div className="space-y-2">
          <div className="break-all rounded-md border border-zinc-200 bg-zinc-100 p-3 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {digest}
          </div>
          <CopyButton value={digest} />
        </div>
      </Field>
    </div>
  );
}
