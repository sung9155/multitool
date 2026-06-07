import { useEffect, useState } from "react";
import { CopyButton, Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    algo: "알고리즘",
    input: "입력 텍스트",
    hashSuffix: "해시",
    allTitle: "모든 알고리즘",
    colAlgo: "알고리즘",
    colHash: "해시",
    colLen: "길이(hex)",
    empty: "입력 없음",
  },
  en: {
    algo: "Algorithm",
    input: "Input text",
    hashSuffix: "hash",
    allTitle: "All algorithms",
    colAlgo: "Algorithm",
    colHash: "Hash",
    colLen: "Length (hex)",
    empty: "No input",
  },
  zh: {
    algo: "算法",
    input: "输入文本",
    hashSuffix: "哈希",
    allTitle: "所有算法",
    colAlgo: "算法",
    colHash: "哈希",
    colLen: "长度(hex)",
    empty: "无输入",
  },
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
  const [algo, setAlgo] = useToolState<Algo>("algo", "SHA-256");
  const [input, setInput] = useToolState("q", "hello");
  const [digest, setDigest] = useState("");
  const [all, setAll] = useState<Record<Algo, string>>({
    "SHA-1": "",
    "SHA-256": "",
    "SHA-384": "",
    "SHA-512": "",
  });

  useEffect(() => {
    let alive = true;
    hash(algo as Algo, input).then((d) => {
      if (alive) setDigest(d);
    });
    return () => {
      alive = false;
    };
  }, [algo, input]);

  useEffect(() => {
    let alive = true;
    Promise.all(ALGOS.map((a) => hash(a, input))).then((results) => {
      if (!alive) return;
      const next = {} as Record<Algo, string>;
      ALGOS.forEach((a, i) => {
        next[a] = results[i];
      });
      setAll(next);
    });
    return () => {
      alive = false;
    };
  }, [input]);

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

      <Field label={t.allTitle}>
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="w-24 px-3 py-2 font-medium">{t.colAlgo}</th>
                <th className="px-3 py-2 font-medium">{t.colHash}</th>
                <th className="w-24 px-3 py-2 font-medium">{t.colLen}</th>
                <th className="w-12 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {ALGOS.map((a) => (
                <tr
                  key={a}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                    {a}
                  </td>
                  <td className="px-3 py-2">
                    <code className="break-all text-xs text-zinc-900 dark:text-zinc-100">
                      {all[a] || t.empty}
                    </code>
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-500">
                    {all[a].length}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {all[a] ? <CopyButton value={all[a]} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Field>
    </div>
  );
}
