import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { tools } from "../tools/registry";
import type { ToolCategory } from "../tools/types";
import { useFavorites } from "./favorites";
import { useRecent } from "./recent";
import { LangSwitcher, localizeTool, useLang, useT } from "./i18n";
import CommandPalette from "./CommandPalette";

const ORDER: ToolCategory[] = [
  "자동화",
  "금융",
  "계산",
  "변환",
  "건강",
  "일상",
  "인코딩",
  "생성",
  "텍스트",
];

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "dark" | "light";
  onToggle: () => void;
}) {
  return (
    <button
      aria-label="테마 전환"
      onClick={onToggle}
      className="rounded-md p-2 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      {theme === "dark" ? (
        // 해 (라이트로 전환)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // 달 (다크로 전환)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function NavGroup({
  title,
  titleClass,
  items,
  lang,
  pathname,
  collapsible,
  collapsed,
  onToggle,
}: {
  title: string;
  titleClass: string;
  items: typeof tools;
  lang: import("./i18n").Lang;
  pathname: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="mb-3">
      {collapsible ? (
        <button
          onClick={onToggle}
          className={`flex w-full items-center justify-between rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 ${titleClass}`}
          aria-expanded={!collapsed}
        >
          <span>
            {title}
            <span className="ml-1.5 font-normal lowercase opacity-60">
              {items.length}
            </span>
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <div
          className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${titleClass}`}
        >
          {title}
        </div>
      )}
      {collapsed
        ? null
        : items.map((tool) => {
        const active = pathname === `/t/${tool.slug}`;
        return (
          <Link
            key={tool.slug}
            to={`/t/${tool.slug}`}
            className={`block rounded-md px-3 py-2.5 text-sm ${
              active
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300"
                : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {localizeTool(tool, lang).name}
          </Link>
        );
      })}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false); // 모바일 드로어
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );
  const { pathname } = useLocation();

  // 경로 바뀌면 드로어 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 드로어 열림 시 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // 테마 적용 + 저장
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* 저장 실패 무시 */
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  // 카테고리 접힘 상태 (localStorage 영속)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("collapsedCats");
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {
      /* 무시 */
    }
    return new Set();
  });
  const toggleCat = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      try {
        localStorage.setItem("collapsedCats", JSON.stringify([...next]));
      } catch {
        /* 무시 */
      }
      return next;
    });

  const favs = useFavorites();
  const recent = useRecent();
  const lang = useLang();
  const t = useT();

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return tools.filter((tool) => {
      const loc = localizeTool(tool, lang);
      return (
        (tool.name + tool.description + loc.name + loc.description)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [q, lang]);

  const grouped = useMemo(() => {
    const map = new Map<ToolCategory, typeof tools>();
    for (const tool of filtered) {
      if (!map.has(tool.category)) map.set(tool.category, []);
      map.get(tool.category)!.push(tool);
    }
    return ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const);
  }, [filtered]);

  // 즐겨찾기한 도구 (검색 필터 반영, 등록 순서 유지)
  const favTools = filtered.filter((tool) => favs.includes(tool.slug));
  // 최근 사용 (최신순, 검색/존재 반영)
  const recentTools = recent
    .map((slug) => filtered.find((tool) => tool.slug === slug))
    .filter((tool): tool is (typeof tools)[number] => Boolean(tool));

  return (
    <div className="flex min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* 모바일 상단바 */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <button
          aria-label="메뉴 열기"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
        <div className="ml-auto flex items-center gap-1">
          <LangSwitcher />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {/* 드로어 배경 */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드바 — 모바일: 슬라이드 드로어 / md↑: 고정 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] transform flex-col border-r border-zinc-200 bg-white transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900 dark:md:bg-zinc-900/40 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/" className="block">
            <h1 className="text-lg font-bold">🧰 Multitool</h1>
            <p className="text-xs text-zinc-500">{t("subtitle")}</p>
          </Link>
          <div className="flex items-center gap-1">
            <LangSwitcher />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              aria-label="메뉴 닫기"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
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
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search")}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-14 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("palette:open"))}
              title={t("paletteOpen")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              ⌘K
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-6">
          {favTools.length > 0 && (
            <NavGroup
              title={t("favorites")}
              titleClass="text-amber-500"
              items={favTools}
              lang={lang}
              pathname={pathname}
            />
          )}
          {recentTools.length > 0 && (
            <NavGroup
              title={t("recent")}
              titleClass="text-zinc-500"
              items={recentTools}
              lang={lang}
              pathname={pathname}
            />
          )}
          {grouped.map(([cat, items]) => (
            <NavGroup
              key={cat}
              title={t(`cat_${cat}`)}
              titleClass="text-zinc-500"
              items={items}
              lang={lang}
              pathname={pathname}
              collapsible
              // 검색 중에는 결과가 보이도록 강제 펼침
              collapsed={q.trim() === "" && collapsed.has(cat)}
              onToggle={() => toggleCat(cat)}
            />
          ))}
          {grouped.length === 0 && (
            <p className="px-3 text-sm text-zinc-500">{t("noResult")}</p>
          )}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>

      <CommandPalette />
    </div>
  );
}
