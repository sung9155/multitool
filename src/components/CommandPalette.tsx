import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tools } from "../tools/registry";
import { localizeTool, useLang, useT } from "./i18n";

/**
 * Ctrl/Cmd+K 로 열리는 빠른 검색 팔레트.
 * ↑↓ 이동, Enter 이동, Esc 닫기.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const lang = useLang();
  const t = useT();

  // 전역 단축키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("palette:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("palette:open", onOpen);
    };
  }, []);

  // 열릴 때 초기화 + 포커스
  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => {
    const query = q.toLowerCase().trim();
    const list = tools.map((tool) => ({ tool, loc: localizeTool(tool, lang) }));
    if (!query) return list.slice(0, 50);
    return list.filter(({ tool, loc }) =>
      (tool.name + tool.description + loc.name + loc.description)
        .toLowerCase()
        .includes(query),
    );
  }, [q, lang]);

  useEffect(() => {
    if (idx >= results.length) setIdx(0);
  }, [results, idx]);

  if (!open) return null;

  const go = (slug: string) => {
    navigate(`/t/${slug}`);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[idx];
      if (r) go(r.tool.slug);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIdx(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={t("palettePlaceholder")}
          className="w-full border-b border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-zinc-700"
        />
        <ul className="max-h-80 overflow-y-auto py-1">
          {results.map(({ tool, loc }, i) => (
            <li key={tool.slug}>
              <button
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(tool.slug)}
                className={`flex w-full flex-col items-start px-4 py-2 text-left ${
                  i === idx
                    ? "bg-indigo-50 dark:bg-indigo-600/20"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {loc.name}
                </span>
                <span className="text-xs text-zinc-500">{loc.description}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-zinc-500">{t("noResult")}</li>
          )}
        </ul>
        <div className="border-t border-zinc-200 px-4 py-2 text-xs text-zinc-400 dark:border-zinc-700">
          {t("paletteHint")}
        </div>
      </div>
    </div>
  );
}
