import { useEffect, useState } from "react";

const KEY = "favorites";

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(slug: string): string[] {
  const cur = getFavorites();
  const next = cur.includes(slug)
    ? cur.filter((s) => s !== slug)
    : [...cur, slug];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패 무시 */
  }
  window.dispatchEvent(new CustomEvent("favchange"));
  return next;
}

/** 즐겨찾기 목록 구독 (탭/컴포넌트 간 동기화) */
export function useFavorites(): string[] {
  const [favs, setFavs] = useState<string[]>(getFavorites);
  useEffect(() => {
    const h = () => setFavs(getFavorites());
    window.addEventListener("favchange", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("favchange", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return favs;
}

/** 별 토글 버튼 */
export function StarButton({
  slug,
  size = 20,
}: {
  slug: string;
  size?: number;
}) {
  const favs = useFavorites();
  const on = favs.includes(slug);
  return (
    <button
      aria-label={on ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(slug);
      }}
      className={`rounded-md p-1.5 transition-colors ${
        on
          ? "text-amber-400 hover:text-amber-300"
          : "text-zinc-400 hover:text-amber-400 dark:text-zinc-500"
      }`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.9l-5.8 3.05 1.1-6.45-4.7-4.6 6.5-.95z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
