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

// ── 사다리타기 ───────────────────────────────────────────

/**
 * rungs[row] = 그 줄에서 가로대가 걸린 왼쪽 기둥 인덱스들 (col ↔ col+1 연결).
 * 같은 줄에 인접한 가로대는 만들지 않는다 (교차 금지).
 * 가로대가 하나도 없는 기둥 사이엔 하나를 강제로 넣어 밋밋함 방지.
 */
export function makeLadder(
  cols: number,
  rows: number,
  rng: () => number = Math.random,
): number[][] {
  let rungs: number[][] = [];
  // 빈 기둥이 나오면 통째로 다시 생성 — 확률상 몇 번 안에 끝난다
  for (let attempt = 0; attempt < 50; attempt++) {
    rungs = Array.from({ length: rows }, () => []);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const row = rungs[r];
        if (row[row.length - 1] === c - 1) continue; // 인접 금지
        if (rng() < 0.42) row.push(c);
      }
    }
    const ok = Array.from({ length: cols - 1 }, (_, c) => c).every((c) =>
      rungs.some((row) => row.includes(c)),
    );
    if (ok) return rungs;
  }
  // ponytail: 50회 실패는 사실상 불가능 — 최악에도 순열 불변식은 유지되므로 그대로 반환
  return rungs;
}

/** start 기둥에서 출발해 내려간 결과. path 는 (row, col) 궤적 — 애니메이션용 */
export function traceLadder(
  rungs: number[][],
  start: number,
): { end: number; path: [number, number][] } {
  let col = start;
  const path: [number, number][] = [[0, col]];
  rungs.forEach((row, r) => {
    if (row.includes(col)) col++;
    else if (row.includes(col - 1)) col--;
    path.push([r + 1, col]);
  });
  return { end: col, path };
}

// ── 돌림판 ───────────────────────────────────────────────

/**
 * 조각 0이 12시 방향에서 시계방향으로 배치된 원판을 rotation(도)만큼
 * 시계방향으로 돌렸을 때, 12시 포인터가 가리키는 조각 인덱스.
 */
export function wheelWinner(rotation: number, n: number): number {
  const a = (((360 - rotation) % 360) + 360) % 360;
  return Math.floor(a / (360 / n)) % n;
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
