import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LangSwitcher, useLang, useT } from "./i18n";
import CommandPalette from "./CommandPalette";
import AltoBackdrop from "./AltoBackdrop";
import { games, localizeGame } from "../games/registry";

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

  const lang = useLang();
  const t = useT();

  const gameItems = useMemo(() => {
    const query = q.toLowerCase().trim();
    return games.filter((g) => {
      const loc = localizeGame(g, lang);
      return (g.name + g.description + loc.name + loc.description)
        .toLowerCase()
        .includes(query);
    });
  }, [q, lang]);

  return (
    <div className="flex min-h-full text-zinc-900 dark:text-zinc-100">
      <AltoBackdrop />
      {/* 모바일 상단바 */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-white/40 bg-white/50 px-4 backdrop-blur-md md:hidden dark:border-white/10 dark:bg-zinc-950/50">
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
          🏔️ Multitool
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
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] transform flex-col border-r border-white/40 bg-white/80 backdrop-blur-md transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:bg-white/35 dark:border-white/10 dark:bg-zinc-950/80 dark:md:bg-zinc-950/35 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/" className="block">
            <h1 className="text-lg font-bold">🏔️ Multitool</h1>
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
              className="w-full rounded-md border border-white/60 bg-white/70 px-3 py-2 pr-14 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-zinc-900/60"
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
          <div className="mb-3">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-500">
              {t("nav_games")}
            </div>
            {gameItems.map((game) => {
              const active = pathname === `/g/${game.slug}`;
              return (
                <Link
                  key={game.slug}
                  to={`/g/${game.slug}`}
                  className={`block rounded-md px-3 py-2.5 text-sm ${
                    active
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-300"
                      : "text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800/70"
                  }`}
                >
                  {game.emoji} {localizeGame(game, lang).name}
                </Link>
              );
            })}
            {gameItems.length === 0 && (
              <p className="px-3 text-sm text-zinc-500">{t("noResult")}</p>
            )}
          </div>
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
