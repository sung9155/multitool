import { useState } from "react";
import { Button, CopyButton, Field, TextInput } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    count: "개수",
    generate: "생성 (v4)",
    idx: "#",
    uuid: "UUID",
    version: "버전",
    empty: "생성된 UUID 없음",
  },
  en: {
    count: "Count",
    generate: "Generate (v4)",
    idx: "#",
    uuid: "UUID",
    version: "Version",
    empty: "No UUID generated",
  },
  zh: {
    count: "数量",
    generate: "生成 (v4)",
    idx: "#",
    uuid: "UUID",
    version: "版本",
    empty: "未生成 UUID",
  },
} as const;

const MAX_COUNT = 1000;

function makeList(count: number) {
  const n = Math.min(MAX_COUNT, Math.max(0, Math.floor(count) || 0));
  return Array.from({ length: n }, () => crypto.randomUUID());
}

/** UUID 문자열에서 버전 숫자 추출 (13번째 문자) */
function uuidVersion(u: string): string {
  const v = u.replace(/-/g, "")[12];
  return v ? `v${v}` : "-";
}

export default function UuidTool() {
  const t = TEXT[useLang()];
  const [count, setCount] = useToolState("n", 5);
  const [list, setList] = useState<string[]>(() => makeList(5));

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <Field label={t.count}>
          <TextInput
            type="number"
            min={1}
            max={MAX_COUNT}
            value={count}
            onChange={(e) =>
              setCount(
                Math.min(MAX_COUNT, Math.max(1, Number(e.target.value) || 1)),
              )
            }
            className="w-28"
          />
        </Field>
        <Button onClick={() => setList(makeList(count))}>{t.generate}</Button>
        <CopyButton value={list.join("\n")} />
      </div>

      <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="w-12 px-3 py-2 font-medium">{t.idx}</th>
              <th className="px-3 py-2 font-medium">{t.uuid}</th>
              <th className="w-20 px-3 py-2 font-medium">{t.version}</th>
              <th className="w-12 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-zinc-500"
                >
                  {t.empty}
                </td>
              </tr>
            ) : (
              list.map((u, i) => (
                <tr
                  key={i}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-3 py-2 text-zinc-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    <code className="text-zinc-900 dark:text-zinc-100">{u}</code>
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-500">
                    {uuidVersion(u)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <CopyButton value={u} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
