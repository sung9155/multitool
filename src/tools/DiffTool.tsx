import { useMemo } from "react";
import { Field, TextArea, Stat } from "../components/ui";
import { Bars } from "../components/charts";
import { useToolState } from "../components/toolState";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "두 텍스트를 줄 단위로 비교합니다.",
    left: "원본 (A)",
    right: "비교 (B)",
    added: "추가",
    removed: "삭제",
    same: "동일",
    ignoreWs: "공백 무시",
  },
  en: {
    intro: "Compare two texts line by line.",
    left: "Original (A)",
    right: "Changed (B)",
    added: "Added",
    removed: "Removed",
    same: "Unchanged",
    ignoreWs: "Ignore whitespace",
  },
  zh: {
    intro: "逐行比较两段文本。",
    left: "原始 (A)",
    right: "修改 (B)",
    added: "新增",
    removed: "删除",
    same: "相同",
    ignoreWs: "忽略空白",
  },
} as const;

type Row = { type: "same" | "add" | "del"; text: string };

function diffLines(a: string[], b: string[]): Row[] {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Row[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", text: a[i++] });
    } else {
      out.push({ type: "add", text: b[j++] });
    }
  }
  while (i < n) out.push({ type: "del", text: a[i++] });
  while (j < m) out.push({ type: "add", text: b[j++] });
  return out;
}

export default function DiffTool() {
  const t = TEXT[useLang()];
  const [left, setLeft] = useToolState("left", "hello\nworld\nfoo");
  const [right, setRight] = useToolState("right", "hello\nworld!\nbar\nbaz");
  const [ignoreWs, setIgnoreWs] = useToolState("ws", false);

  const rows = useMemo(() => {
    const norm = (s: string) =>
      (ignoreWs ? s.replace(/[ \t]+/g, " ").trim() : s);
    const a = left.split("\n").map(norm);
    const b = right.split("\n").map(norm);
    return diffLines(a, b);
  }, [left, right, ignoreWs]);

  const added = rows.filter((r) => r.type === "add").length;
  const removed = rows.filter((r) => r.type === "del").length;
  const same = rows.filter((r) => r.type === "same").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.left}>
          <TextArea mono rows={6} value={left} onChange={(e) => setLeft(e.target.value)} />
        </Field>
        <Field label={t.right}>
          <TextArea mono rows={6} value={right} onChange={(e) => setRight(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <input type="checkbox" checked={ignoreWs} onChange={(e) => setIgnoreWs(e.target.checked)} />
        {t.ignoreWs}
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t.added} value={`+${added}`} accent />
        <Stat label={t.removed} value={`-${removed}`} />
        <Stat label={t.same} value={same} />
      </div>
      <Bars
        items={[
          { label: t.added, value: added },
          { label: t.removed, value: removed },
          { label: t.same, value: same },
        ]}
      />
      <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 dark:border-zinc-700 dark:bg-zinc-900">
        {rows.map((r, i) => (
          <div
            key={i}
            className={
              r.type === "add"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : r.type === "del"
                ? "bg-red-500/15 text-red-700 dark:text-red-300"
                : "text-zinc-600 dark:text-zinc-400"
            }
          >
            <span className="select-none opacity-60">
              {r.type === "add" ? "+ " : r.type === "del" ? "- " : "  "}
            </span>
            {r.text || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}
