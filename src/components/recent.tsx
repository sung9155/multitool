import { useEffect, useState } from "react";

const KEY = "recent";
const MAX = 6;

export function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** 도구 사용 기록 (최신순, 중복 제거, 최대 6개) */
export function pushRecent(slug: string) {
  const cur = getRecent().filter((s) => s !== slug);
  const next = [slug, ...cur].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("recentchange"));
}

export function useRecent(): string[] {
  const [recent, setR] = useState<string[]>(getRecent);
  useEffect(() => {
    const h = () => setR(getRecent());
    window.addEventListener("recentchange", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("recentchange", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return recent;
}
