import type { ComponentType } from "react";
import type { Lang } from "../components/i18n";
import StackGame from "./StackGame";
import JumpGame from "./JumpGame";
import LottoGame from "./LottoGame";

export interface Game {
  /** URL 경로 (/g/<slug>) 와 고유 키 */
  slug: string;
  name: string;
  description: string;
  emoji: string;
  i18n: Record<
    Exclude<Lang, "ko">,
    { name: string; description: string }
  >;
  component: ComponentType;
}

export const games: Game[] = [
  {
    slug: "lotto",
    name: "로또 시뮬레이터",
    description: "로또 6/45 가상 추첨 — 수십 년치 인생 시뮬레이션으로 현실 체험",
    emoji: "🎱",
    i18n: {
      en: {
        name: "Lotto Simulator",
        description: "Virtual Lotto 6/45 draws — simulate decades of playing for a reality check",
      },
      zh: {
        name: "乐透模拟器",
        description: "6/45 乐透虚拟开奖 — 模拟买几十年，体验现实",
      },
    },
    component: LottoGame,
  },
  {
    slug: "stack",
    name: "스택",
    description: "움직이는 블록을 겹쳐 쌓기 — 어긋난 만큼 잘려나간다",
    emoji: "🧱",
    i18n: {
      en: {
        name: "Stack",
        description: "Drop moving blocks to stack a tower — misses get sliced off",
      },
      zh: {
        name: "叠塔",
        description: "把移动的方块叠起来 — 没对齐的部分会被切掉",
      },
    },
    component: StackGame,
  },
  {
    slug: "jump",
    name: "점프점프",
    description: "길게 눌러 힘을 모아 다음 발판으로 점프 — 서울 도심을 건너뛴다",
    emoji: "🏯",
    i18n: {
      en: {
        name: "Jump Jump",
        description: "Hold to charge, leap across an isometric Seoul skyline — center lands combo",
      },
      zh: {
        name: "跳一跳",
        description: "长按蓄力跳向下一个台阶，穿越首尔街景 — 踩正中心有连击奖励",
      },
    },
    component: JumpGame,
  },
];

export function findGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

export function localizeGame(game: Game, lang: Lang) {
  if (lang === "ko") return { name: game.name, description: game.description };
  return game.i18n[lang] ?? { name: game.name, description: game.description };
}

/** 최고 점수 (localStorage) */
export function getBest(slug: string): number {
  try {
    return Number(localStorage.getItem(`best:${slug}`)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(slug: string, score: number): number {
  const best = getBest(slug);
  if (score <= best) return best;
  try {
    localStorage.setItem(`best:${slug}`, String(score));
  } catch {
    /* 저장 실패 무시 */
  }
  return score;
}
