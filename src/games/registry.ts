import type { ComponentType } from "react";
import type { Lang } from "../components/i18n";
import StackGame from "./StackGame";
import JumpGame from "./JumpGame";
import LottoGame from "./LottoGame";
import Game2048 from "./Game2048";
import ReactionGame from "./ReactionGame";
import BaseballGame from "./BaseballGame";

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
  {
    slug: "2048",
    name: "2048",
    description: "타일을 밀어 같은 숫자를 합치기 — 목표는 2048",
    emoji: "🔢",
    i18n: {
      en: {
        name: "2048",
        description: "Slide tiles to merge matching numbers — reach 2048",
      },
      zh: {
        name: "2048",
        description: "滑动方块合并相同数字 — 目标 2048",
      },
    },
    component: Game2048,
  },
  {
    slug: "reaction",
    name: "반응속도",
    description: "초록불이 켜지는 순간 최대한 빨리 탭 — 밀리초 승부",
    emoji: "⚡",
    i18n: {
      en: {
        name: "Reaction Time",
        description: "Tap the instant it turns green — a battle of milliseconds",
      },
      zh: {
        name: "反应速度",
        description: "变绿的瞬间立刻点击 — 毫秒之争",
      },
    },
    component: ReactionGame,
  },
  {
    slug: "baseball",
    name: "숫자야구",
    description: "서로 다른 3자리 숫자를 추리 — 스트라이크와 볼로 좁혀가기",
    emoji: "⚾",
    i18n: {
      en: {
        name: "Bulls & Cows",
        description: "Guess the 3 secret digits — strikes and balls narrow it down",
      },
      zh: {
        name: "猜数字",
        description: "推理 3 个不同数字 — 用好球和坏球缩小范围",
      },
    },
    component: BaseballGame,
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

/** 낮을수록 좋은 기록 (반응속도 ms, 추리 시도 횟수). 0 = 기록 없음 */
export function saveBestLow(slug: string, score: number): number {
  const best = getBest(slug);
  if (best > 0 && score >= best) return best;
  try {
    localStorage.setItem(`best:${slug}`, String(score));
  } catch {
    /* 저장 실패 무시 */
  }
  return score;
}
