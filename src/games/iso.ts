import { hash } from "./logic";

/** 아이소메트릭 투영 계수 (두 게임 공용) */
export const HW = 0.87;
export const HH = 0.5;
export const isoX = (x: number, z: number) => (x - z) * HW;
export const isoY = (x: number, z: number) => -(x + z) * HH;

/** 원경 서울 스카이라인 (남산타워 포함). off 로 시차 스크롤 */
export function drawSkyline(
  ctx: CanvasRenderingContext2D,
  W: number,
  off: number,
  horizon = 300,
) {
  // 남산 능선
  ctx.fillStyle = "rgba(18,26,60,0.45)";
  ctx.beginPath();
  ctx.moveTo(-10, horizon);
  ctx.lineTo(60, horizon - 68);
  ctx.lineTo(120, horizon - 32);
  ctx.lineTo(196, horizon - 95);
  ctx.lineTo(268, horizon - 38);
  ctx.lineTo(330, horizon - 74);
  ctx.lineTo(W + 10, horizon - 32);
  ctx.lineTo(W + 10, horizon + 40);
  ctx.lineTo(-10, horizon + 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(12,18,44,0.72)";
  for (let i = -1; i < 15; i++) {
    const k = i + Math.floor(off / 34);
    const bx = k * 34 - off;
    const bw = 18 + hash(k * 2.1) * 12;
    const bh = 26 + hash(k * 7.7) * 62;
    ctx.fillRect(bx, horizon - bh, bw, bh + 30);
    if (((k % 7) + 7) % 7 === 3) {
      // N서울타워
      ctx.fillRect(bx + bw / 2 - 2, horizon - bh - 46, 4, 46);
      ctx.beginPath();
      ctx.ellipse(bx + bw / 2, horizon - bh - 46, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(bx + bw / 2 - 1, horizon - bh - 66, 2, 20);
    }
  }

  // 한강
  ctx.fillStyle = "rgba(150,196,226,0.16)";
  ctx.fillRect(0, horizon + 30, W, 22);
}

/** 아이소메트릭 상자: 윗면 중심(sx,sy) · 지면 반너비(hx,hz) · 두께 h */
export function drawBox(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  hx: number,
  hz: number,
  h: number,
  top: string,
  right: string,
  left: string,
) {
  const p = (dx: number, dz: number): [number, number] => [
    sx + isoX(dx, dz),
    sy + isoY(dx, dz),
  ];
  const A = p(-hx, -hz); // 앞(아래)
  const B = p(hx, -hz); // 오른쪽
  const C = p(hx, hz); // 뒤(위)
  const D = p(-hx, hz); // 왼쪽
  const face = (pts: [number, number][], fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
  };
  const dn = (q: [number, number]): [number, number] => [q[0], q[1] + h];

  face([A, B, dn(B), dn(A)], right);
  face([D, A, dn(A), dn(D)], left);
  face([A, B, C, D], top);
  return { A, B, C, D };
}
