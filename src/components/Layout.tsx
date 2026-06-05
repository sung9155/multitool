import { useEffect, useMemo, useState } from "react";
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
  const [open, setOpen] = useState(false); // 모바일 드로어
  const { pathname } = useLocation();

  // 경로 바뀌면 드로어 닫기 (도구 선택 시 자동 닫힘)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
      {/* 모바일 상단바 */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur md:hidden">
        <button
          aria-label="메뉴 열기"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-zinc-300 hover:bg-zinc-800"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <Link to="/" className="font-bold">
          🧰 Multitool
        </Link>
      </header>

      {/* 드로어 열렸을 때 배경 */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드바 — 모바일: 슬라이드 드로어 / md↑: 고정 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] transform flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:bg-zinc-900/40 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/" className="block">
            <h1 className="text-lg font-bold">🧰 Multitool</h1>
            <p className="text-xs text-zinc-500">일상 · 개발 도구 모음</p>
          </Link>
          <button
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

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
                    className={`block rounded-md px-3 py-2.5 text-sm ${
                      active
                        ? "bg-indigo-600/20 text-indigo-300"
                        : "text-zinc-300 hover:bg-zinc-800 active:bg-zinc-800"
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

      <main className="min-w-0 flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
