/** 2048 · 숫자야구 순수 로직 — UI 없음, logic.check.ts 에서 점검 */

// ── 2048 ─────────────────────────────────────────────────

export type Board = number[][]; // 4×4, 0 = 빈 칸

export const SIZE = 4;

export function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

/** 한 줄을 왼쪽으로 밀며 병합. 같은 타일은 한 번만 합쳐진다. */
export function slideRow(row: number[]): { row: number[]; gained: number } {
  const vals = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2);
      gained += vals[i] * 2;
      i++; // 병합된 쌍은 건너뜀
    } else {
      out.push(vals[i]);
    }
  }
  while (out.length < row.length) out.push(0);
  return { row: out, gained };
}

const transpose = (b: Board): Board =>
  b[0].map((_, c) => b.map((row) => row[c]));
const flip = (b: Board): Board => b.map((row) => [...row].reverse());

export type Dir = "left" | "right" | "up" | "down";

/** 보드 전체 이동. moved=false 면 아무 칸도 안 움직인 것. */
export function moveBoard(
  b: Board,
  dir: Dir,
): { board: Board; gained: number; moved: boolean } {
  // 모든 방향을 "왼쪽 밀기"로 정규화
  let work = b;
  if (dir === "right") work = flip(work);
  else if (dir === "up") work = transpose(work);
  else if (dir === "down") work = flip(transpose(work));

  let gained = 0;
  let slid = work.map((row) => {
    const r = slideRow(row);
    gained += r.gained;
    return r.row;
  });

  if (dir === "right") slid = flip(slid);
  else if (dir === "up") slid = transpose(slid);
  else if (dir === "down") slid = transpose(flip(slid));

  const moved = slid.some((row, r) => row.some((v, c) => v !== b[r][c]));
  return { board: slid, gained, moved };
}

/** 빈 칸에 새 타일(90% 2, 10% 4) 추가. 빈 칸 없으면 그대로. */
export function addTile(b: Board, rng: () => number = Math.random): Board {
  const empty: [number, number][] = [];
  b.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v === 0) empty.push([r, c]);
    }),
  );
  if (empty.length === 0) return b;
  const [r, c] = empty[Math.floor(rng() * empty.length)];
  const next = b.map((row) => [...row]);
  next[r][c] = rng() < 0.9 ? 2 : 4;
  return next;
}

/** 어느 방향으로도 못 움직이면 게임 오버 */
export function canMove(b: Board): boolean {
  return (["left", "right", "up", "down"] as Dir[]).some(
    (d) => moveBoard(b, d).moved,
  );
}

// ── 숫자야구 ─────────────────────────────────────────────

/** 1~9 중 서로 다른 3자리 비밀 숫자 */
export function secretDigits(rng: () => number = Math.random): number[] {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(rng() * (9 - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

/** 스트라이크(자리+숫자 일치) / 볼(숫자만 일치) */
export function judge(
  secret: number[],
  guess: number[],
): { s: number; b: number } {
  let s = 0;
  let b = 0;
  guess.forEach((g, i) => {
    if (secret[i] === g) s++;
    else if (secret.includes(g)) b++;
  });
  return { s, b };
}
