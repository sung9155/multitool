/** 두 게임의 순수 규칙 계산 (렌더링과 분리 → node 로 검증 가능) */

export type Span = { x: number; w: number };

export type Slice =
  | { hit: false }
  | {
      hit: true;
      perfect: boolean;
      /** 남는 블록 */
      x: number;
      w: number;
      /** 잘려나가 떨어지는 조각 (퍼펙트면 null) */
      cut: Span | null;
    };

/** 스택: 떨어뜨린 블록 cur 를 prev 위에 겹쳐 자른 결과. x 는 좌측 끝. */
export function sliceBlock(prev: Span, cur: Span, tol = 4): Slice {
  const delta = cur.x - prev.x;
  const overlap = prev.w - Math.abs(delta);
  if (overlap <= 0) return { hit: false };
  if (Math.abs(delta) < tol) {
    return { hit: true, perfect: true, x: prev.x, w: prev.w, cut: null };
  }
  return {
    hit: true,
    perfect: false,
    x: delta > 0 ? cur.x : prev.x,
    w: overlap,
    cut: { x: delta > 0 ? prev.x + prev.w : cur.x, w: Math.abs(delta) },
  };
}

/** 결정적 난수 (배경/발판이 스크롤해도 흔들리지 않게) */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

// ───── 점프점프 (아이소메트릭) ─────
/** 발판 종류: 앞 4개는 정육면체, 뒤 4개는 원통. 형상 자체가 스킨이다. */
export const PAD_SKINS = [
  "hanok", // 기와 얹은 한옥 큐브
  "apart", // 아파트 동
  "store", // 편의점
  "dice", // 주사위
  "can", // 음료 캔
  "drum", // 북(소고)
  "cup", // 테이크아웃 컵
  "jar", // 장독
] as const;
export type PadSkin = (typeof PAD_SKINS)[number];
export const PAD_KINDS = PAD_SKINS.length;
/** 원통형 스킨 (나머지는 정육면체) */
const CYLINDERS: PadSkin[] = ["can", "drum", "cup", "jar"];
export const isCylinder = (kind: number) =>
  CYLINDERS.includes(PAD_SKINS[kind]);
export const GAP_MIN = 70;
export const GAP_MAX = 150;
export const R_MIN = 24;
export const R_MAX = 36;
export const MIN_JUMP = 30;
export const MAX_JUMP = 210;
/** 정중앙 판정 반경 */
export const CENTER_TOL = 9;
/** 발판 가장자리 이 폭 안쪽에 서면 균형을 잃고 넘어진다 */
export const EDGE_TOL = 5;

/** 발판: 지면 평면의 정사각형 (중심 x,y · 반경 r). dir 은 직전 발판에서 온 방향 (0: +x, 1: +y) */
export type Pad = { x: number; y: number; r: number; kind: number; dir: 0 | 1 };

export function nextPad(prev: Pad, seed: number): Pad {
  const dir: 0 | 1 = hash(seed * 5.3) < 0.5 ? 0 : 1;
  const r = R_MIN + hash(seed * 3.7) * (R_MAX - R_MIN);
  const gap = GAP_MIN + hash(seed * 9.1) * (GAP_MAX - GAP_MIN);
  return {
    x: prev.x + (dir === 0 ? gap : 0),
    y: prev.y + (dir === 1 ? gap : 0),
    r,
    kind: Math.floor(hash(seed * 4.7 + 11.3) * PAD_KINDS) % PAD_KINDS,
    dir,
  };
}

/** 발판 중심에서 (x,y) 까지 봤을 때 가장자리까지 남은 거리. 음수면 발판 밖. */
export function edgeMargin(p: Pad, x: number, y: number): number {
  const dx = x - p.x;
  const dy = y - p.y;
  return isCylinder(p.kind)
    ? p.r - Math.hypot(dx, dy) // 원통: 원형 바닥
    : Math.min(p.r - Math.abs(dx), p.r - Math.abs(dy)); // 정육면체: 정사각 바닥
}

/** 착지한 발판 index (없으면 -1) */
export function landOn(pads: Pad[], x: number, y: number): number {
  return pads.findIndex((p) => edgeMargin(p, x, y) >= 0);
}

export type Landing =
  | { kind: "miss" }
  /** 가장자리를 밟아 바깥으로 넘어짐. axis 0:x, 1:y / away 는 그 축의 바깥 방향 */
  | { kind: "topple"; index: number; axis: 0 | 1; away: -1 | 1 }
  | { kind: "land"; index: number; centered: boolean };

/** 착지 지점 판정: 헛디딤 / 가장자리 넘어짐 / 착지(정중앙 여부) */
export function resolveLanding(pads: Pad[], x: number, y: number): Landing {
  const index = landOn(pads, x, y);
  if (index < 0) return { kind: "miss" };
  const p = pads[index];
  const dx = x - p.x;
  const dy = y - p.y;
  if (edgeMargin(p, x, y) < EDGE_TOL) {
    // 중심에서 더 많이 벗어난 축 바깥으로 넘어진다
    const axis: 0 | 1 = Math.abs(dx) >= Math.abs(dy) ? 0 : 1;
    const away: -1 | 1 = (axis === 0 ? dx : dy) >= 0 ? 1 : -1;
    return { kind: "topple", index, axis, away };
  }
  return { kind: "land", index, centered: Math.hypot(dx, dy) < CENTER_TOL };
}

/** 충전량(0~1) → 점프 거리 */
export function jumpDist(power: number): number {
  return MIN_JUMP + Math.min(1, Math.max(0, power)) * (MAX_JUMP - MIN_JUMP);
}
