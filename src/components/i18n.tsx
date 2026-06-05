import { useEffect, useState } from "react";
import { toolI18n } from "../tools/toolI18n";
import type { Tool } from "../tools/types";

export type Lang = "ko" | "en" | "zh";
export const LANGS: { code: Lang; label: string }[] = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
];

type Dict = Record<string, string>;

const UI: Record<Lang, Dict> = {
  ko: {
    subtitle: "일상 · 개발 도구 모음",
    search: "도구 검색…",
    favorites: "★ 즐겨찾기",
    recent: "🕘 최근 사용",
    homeTitle: "일상 · 개발 도구 모음",
    homeSub: "자주 쓰는 유틸을 한곳에. 별(★)로 즐겨찾기하면 위로 고정.",
    notFound: "도구를 찾을 수 없음",
    back: "← 홈으로",
    noResult: "결과 없음",
    cat_자동화: "자동화",
    cat_금융: "금융",
    cat_계산: "계산",
    cat_변환: "변환",
    cat_건강: "건강",
    cat_일상: "일상",
    cat_인코딩: "인코딩",
    cat_생성: "생성",
    cat_텍스트: "텍스트",
  },
  en: {
    subtitle: "Daily · Dev tool collection",
    search: "Search tools…",
    favorites: "★ Favorites",
    recent: "🕘 Recent",
    homeTitle: "Daily · Dev Tools",
    homeSub: "Handy utilities in one place. Star (★) to pin to top.",
    notFound: "Tool not found",
    back: "← Home",
    noResult: "No results",
    cat_자동화: "Automation",
    cat_금융: "Finance",
    cat_계산: "Calc",
    cat_변환: "Convert",
    cat_건강: "Health",
    cat_일상: "Daily",
    cat_인코딩: "Encoding",
    cat_생성: "Generate",
    cat_텍스트: "Text",
  },
  zh: {
    subtitle: "日常 · 开发工具集",
    search: "搜索工具…",
    favorites: "★ 收藏",
    recent: "🕘 最近使用",
    homeTitle: "日常 · 开发工具",
    homeSub: "常用工具集中一处。点星标（★）置顶。",
    notFound: "未找到工具",
    back: "← 首页",
    noResult: "无结果",
    cat_자동화: "自动化",
    cat_금융: "金融",
    cat_계산: "计算",
    cat_변환: "换算",
    cat_건강: "健康",
    cat_일상: "日常",
    cat_인코딩: "编码",
    cat_생성: "生成",
    cat_텍스트: "文本",
  },
};

const KEY = "lang";

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY) as Lang | null;
    if (v === "ko" || v === "en" || v === "zh") return v;
  } catch {
    /* ignore */
  }
  return "ko";
}

export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("langchange"));
}

export function useLang(): Lang {
  const [lang, setL] = useState<Lang>(getLang);
  useEffect(() => {
    const h = () => setL(getLang());
    window.addEventListener("langchange", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("langchange", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return lang;
}

/** UI 문자열 번역 */
export function useT(): (key: string) => string {
  const lang = useLang();
  return (key: string) => UI[lang][key] ?? UI.ko[key] ?? key;
}

/** 도구 이름/설명 현지화 (없으면 한국어 원본) */
export function localizeTool(tool: Tool, lang: Lang): {
  name: string;
  description: string;
} {
  if (lang === "ko") return { name: tool.name, description: tool.description };
  const tr = toolI18n[tool.slug]?.[lang];
  return tr ?? { name: tool.name, description: tool.description };
}

/** 언어 선택 드롭다운 */
export function LangSwitcher() {
  const lang = useLang();
  return (
    <select
      aria-label="언어 선택"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
