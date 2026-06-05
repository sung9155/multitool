import { useState } from "react";
import { Button, CopyButton, Field, TextInput } from "../components/ui";

function makeList(count: number) {
  return Array.from({ length: count }, () => crypto.randomUUID());
}

export default function UuidTool() {
  const [count, setCount] = useState(5);
  const [list, setList] = useState<string[]>(() => makeList(5));

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <Field label="개수">
          <TextInput
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) =>
              setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))
            }
            className="w-28"
          />
        </Field>
        <Button onClick={() => setList(makeList(count))}>생성 (v4)</Button>
        <CopyButton value={list.join("\n")} />
      </div>
      <div className="space-y-1">
        {list.map((u, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <code className="text-sm text-zinc-900 dark:text-zinc-100">{u}</code>
            <CopyButton value={u} />
          </div>
        ))}
      </div>
    </div>
  );
}
