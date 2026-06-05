import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { tools } from "../tools/registry";
import type { ToolCategory } from "../tools/types";

const ORDER: ToolCategory[] = [
  "자동화",
  "계산",
  "변환",
  "인코딩",
  "생성",
  "텍스트",
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [q, setQ] = useState("");
  const { pathname } = useLocation();

  const grouped = useMemo(() => {
    const filtered = tools.filter((t) =>
      (t.name + t.description).toLowerCase().includes(q.toLowerCase().trim()),
    );
    const map = new Map<ToolCategory, typeof tools>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const);
  }, [q]);

  return (
    <div className="flex min-h-full bg-zinc-950 text-zinc-100">
      <aside className="flex w-72 flex-col border-r border-zinc-800 bg-zinc-900/40">
        <Link to="/" className="block px-5 py-4">
          <h1 className="text-lg font-bold">🧰 Multitool</h1>
          <p className="text-xs text-zinc-500">일상 · 개발 도구 모음</p>
        </Link>
        <div className="px-4 pb-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="도구 검색…"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-6">
          {grouped.map(([cat, items]) => (
            <div key={cat} className="mb-3">
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {cat}
              </div>
              {items.map((t) => {
                const active = pathname === `/t/${t.slug}`;
                return (
                  <Link
                    key={t.slug}
                    to={`/t/${t.slug}`}
                    className={`block rounded-md px-3 py-2 text-sm ${
                      active
                        ? "bg-indigo-600/20 text-indigo-300"
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    {t.name}
                  </Link>
                );
              })}
            </div>
          ))}
          {grouped.length === 0 && (
            <p className="px-3 text-sm text-zinc-500">결과 없음</p>
          )}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
