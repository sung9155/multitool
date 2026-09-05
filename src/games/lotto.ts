/** 로또 6/45 순수 로직 — UI 없음, logic.check.ts 에서 점검 */

export const TICKET_PRICE = 1000;

/** 등수별 당첨금. 1~3등은 변동제라 최근 회차 평균 수준의 추정치. */
export const PRIZES: Record<number, number> = {
  1: 2_000_000_000, // ponytail: 변동 당첨금은 평균 추정치 상수, 실데이터 연동은 필요해지면
  2: 55_000_000,
  3: 1_600_000,
  4: 50_000, // 고정
  5: 5_000, // 고정
};

export type Rng = () => number;

/** 1~45 중 중복 없이 n개 (오름차순) */
export function pickUnique(n: number, rng: Rng = Math.random): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  // 부분 Fisher–Yates
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (45 - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).sort((a, b) => a - b);
}

export interface Draw {
  nums: number[]; // 당첨 번호 6개 (오름차순)
  bonus: number;
}

export function draw(rng: Rng = Math.random): Draw {
  const seven = pickUnique(7, rng);
  const bonusIdx = Math.floor(rng() * 7);
  const bonus = seven[bonusIdx];
  const nums = seven.filter((_, i) => i !== bonusIdx);
  return { nums, bonus };
}

/** 등수: 1~5, 낙첨은 0 */
export function rankOf(picks: number[], d: Draw): number {
  const set = new Set(d.nums);
  const hit = picks.filter((n) => set.has(n)).length;
  if (hit === 6) return 1;
  if (hit === 5) return picks.includes(d.bonus) ? 2 : 3;
  if (hit === 4) return 4;
  if (hit === 3) return 5;
  return 0;
}

export interface SimResult {
  rounds: number;
  tickets: number;
  spent: number;
  won: number;
  /** ranks[1..5] = 등수별 당첨 횟수 */
  ranks: [number, number, number, number, number, number];
}

/** 매회 ticketsPerRound장씩 rounds회 자동구매 시뮬레이션 */
export function simulate(
  rounds: number,
  ticketsPerRound: number,
  rng: Rng = Math.random,
): SimResult {
  const ranks: SimResult["ranks"] = [0, 0, 0, 0, 0, 0];
  let won = 0;
  for (let r = 0; r < rounds; r++) {
    const d = draw(rng);
    for (let t = 0; t < ticketsPerRound; t++) {
      const rank = rankOf(pickUnique(6, rng), d);
      if (rank > 0) {
        ranks[rank]++;
        won += PRIZES[rank];
      }
    }
  }
  const tickets = rounds * ticketsPerRound;
  return { rounds, tickets, spent: tickets * TICKET_PRICE, won, ranks };
}

/** 시연용 시드 난수 (mulberry32) — 체크 스크립트에서 재현성 확보 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
