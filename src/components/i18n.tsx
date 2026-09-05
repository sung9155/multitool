import { useEffect, useState } from "react";

export type Lang = "ko" | "en" | "zh";
export const LANGS: { code: Lang; label: string }[] = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
];

type Dict = Record<string, string>;

const UI: Record<Lang, Dict> = {
  ko: {
    subtitle: "미니게임 아케이드",
    search: "게임 검색…",
    back: "← 홈으로",
    noResult: "결과 없음",
    palettePlaceholder: "게임 검색 후 Enter로 이동…",
    paletteHint: "↑↓ 이동 · Enter 열기 · Esc 닫기",
    paletteOpen: "빠른 검색",
    nav_games: "🎮 게임",
    homeGames: "게임",
    homeGamesSub: "짧게 즐기는 미니게임. 최고 점수는 브라우저에 저장됩니다.",
    heroTitle: "Multitool Arcade",
    heroSub: "황혼의 능선 위, 오늘도 한 판.",
    playNow: "플레이 →",
    score: "점수",
    best: "최고",
    gameOver: "게임 오버",
    restart: "다시 하기",
    hintTap: "탭 또는 스페이스로 블록 떨어뜨리기 · 딱 맞추면 +2 와 블록 회복",
    hintHold: "길게 눌러 힘을 모으고 놓으면 점프 · 발판 정중앙은 콤보 보너스",
    gameNotFound: "게임을 찾을 수 없음",
    hint2048: "방향키 또는 스와이프로 이동 · 같은 숫자가 만나면 합쳐집니다",
    rxReady: "탭해서 시작",
    rxWait: "초록색이 되면 탭…",
    rxGo: "지금!",
    rxTooSoon: "너무 빨라요! 초록불 전에 탭했어요",
    rxMs: "ms",
    bbHint: "1~9 중 서로 다른 3자리 · 자리+숫자 일치 = S, 숫자만 일치 = B",
    bbPlaceholder: "예: 123",
    bbSubmit: "던지기",
    bbTries: "시도",
    bbWin: "홈런! 🎉",
    bbOut: "아웃",
    bbNew: "새 게임",
  },
  en: {
    subtitle: "Minigame arcade",
    search: "Search games…",
    back: "← Home",
    noResult: "No results",
    palettePlaceholder: "Search games, Enter to open…",
    paletteHint: "↑↓ navigate · Enter open · Esc close",
    paletteOpen: "Quick search",
    nav_games: "🎮 Games",
    homeGames: "Games",
    homeGamesSub: "Quick minigames. Best scores are kept in your browser.",
    heroTitle: "Multitool Arcade",
    heroSub: "One more round, above the dusk ridgeline.",
    playNow: "Play →",
    score: "Score",
    best: "Best",
    gameOver: "Game Over",
    restart: "Play again",
    hintTap: "Tap or press Space to drop · a perfect fit scores +2 and regrows the block",
    hintHold: "Hold to charge, release to jump · dead center gives a combo bonus",
    gameNotFound: "Game not found",
    hint2048: "Arrow keys or swipe to move · matching numbers merge",
    rxReady: "Tap to start",
    rxWait: "Tap when it turns green…",
    rxGo: "NOW!",
    rxTooSoon: "Too soon! You tapped before the green light",
    rxMs: "ms",
    bbHint: "3 distinct digits from 1–9 · right digit & place = S, right digit only = B",
    bbPlaceholder: "e.g. 123",
    bbSubmit: "Pitch",
    bbTries: "Tries",
    bbWin: "Home run! 🎉",
    bbOut: "Out",
    bbNew: "New game",
  },
  zh: {
    subtitle: "小游戏厅",
    search: "搜索游戏…",
    back: "← 首页",
    noResult: "无结果",
    palettePlaceholder: "搜索游戏，回车打开…",
    paletteHint: "↑↓ 选择 · 回车打开 · Esc 关闭",
    paletteOpen: "快速搜索",
    nav_games: "🎮 游戏",
    homeGames: "游戏",
    homeGamesSub: "轻松小游戏。最高分保存在浏览器中。",
    heroTitle: "Multitool Arcade",
    heroSub: "黄昏山脊之上，再来一局。",
    playNow: "开始玩 →",
    score: "分数",
    best: "最高",
    gameOver: "游戏结束",
    restart: "再玩一次",
    hintTap: "点击或按空格放下方块 · 完美对齐 +2 并回复宽度",
    hintHold: "长按蓄力，松开跳跃 · 踩正中心有连击奖励",
    gameNotFound: "未找到游戏",
    hint2048: "方向键或滑动移动 · 相同数字相遇会合并",
    rxReady: "点击开始",
    rxWait: "变绿时立刻点击…",
    rxGo: "就是现在！",
    rxTooSoon: "太快了！绿灯前就点了",
    rxMs: "毫秒",
    bbHint: "1~9 中 3 个不同数字 · 数字和位置都对 = S，只对数字 = B",
    bbPlaceholder: "如 123",
    bbSubmit: "投球",
    bbTries: "次数",
    bbWin: "全中！🎉",
    bbOut: "出局",
    bbNew: "新游戏",
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
