import type { ReactNode } from "react";

export interface Pt {
  x: number;
  y: number;
}
export interface Series {
  points: Pt[];
  color: string; // stroke 색 (hex/이름) — 두 테마 공통 잘 보이는 색
  label?: string;
  dashed?: boolean;
}

const PALETTE = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
};

/** 가벼운 SVG 라인차트 — 반응형, 다크/라이트 테마 대응 */
export function LineChart({
  series,
  xMin,
  xMax,
  yMin,
  yMax,
  markerX,
  refLines,
  xUnit,
  yUnit,
  height = 280,
}: {
  series: Series[];
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  markerX?: number | null;
  refLines?: { x: number; color: string; label?: string }[];
  xUnit?: string;
  yUnit?: string;
  height?: number;
}) {
  // 비유한값(NaN/Infinity) 포인트 제거 — 잘못된 입력에도 SVG 깨지지 않도록
  series = series.map((s) => ({
    ...s,
    points: s.points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
  }));
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const x0 = xMin ?? Math.min(...xs, 0);
  const x1 = xMax ?? Math.max(...xs, 1);
  let y0 = yMin ?? Math.min(...ys);
  let y1 = yMax ?? Math.max(...ys);
  if (!Number.isFinite(y0)) y0 = 0;
  if (!Number.isFinite(y1)) y1 = 1;
  if (y0 === y1) {
    y0 -= 1;
    y1 += 1;
  }
  const pad = (y1 - y0) * 0.08;
  y0 -= pad;
  y1 += pad;

  const W = 620;
  const H = 320;
  const L = 46;
  const R = 14;
  const T = 14;
  const B = 34;
  const pw = W - L - R;
  const ph = H - T - B;

  const sx = (x: number) => L + ((x - x0) / (x1 - x0 || 1)) * pw;
  const sy = (y: number) => T + (1 - (y - y0) / (y1 - y0 || 1)) * ph;

  const yTicks = 4;
  const xTicks = 5;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 가로 그리드 + y 라벨 */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const yv = y0 + ((y1 - y0) * i) / yTicks;
          const py = sy(yv);
          return (
            <g key={`y${i}`}>
              <line
                x1={L}
                y1={py}
                x2={W - R}
                y2={py}
                className="stroke-zinc-200 dark:stroke-zinc-700"
                strokeWidth={1}
              />
              <text
                x={L - 6}
                y={py + 4}
                textAnchor="end"
                className="fill-zinc-500 text-[11px]"
              >
                {fmtTick(yv)}
              </text>
            </g>
          );
        })}
        {/* 세로 x 라벨 */}
        {Array.from({ length: xTicks + 1 }, (_, i) => {
          const xv = x0 + ((x1 - x0) * i) / xTicks;
          const px = sx(xv);
          return (
            <text
              key={`x${i}`}
              x={px}
              y={H - 12}
              textAnchor="middle"
              className="fill-zinc-500 text-[11px]"
            >
              {fmtTick(xv)}
            </text>
          );
        })}

        {/* 정적 기준선 (예: 외란 주입 시각) */}
        {refLines?.map((r, i) => (
          <g key={`ref${i}`}>
            <line
              x1={sx(r.x)}
              y1={T}
              x2={sx(r.x)}
              y2={T + ph}
              stroke={r.color}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            {r.label && (
              <text
                x={sx(r.x) + 4}
                y={T + 12}
                fill={r.color}
                className="text-[11px]"
              >
                {r.label}
              </text>
            )}
          </g>
        ))}

        {/* 마커 (애니메이션 위치) */}
        {markerX != null && (
          <line
            x1={sx(markerX)}
            y1={T}
            x2={sx(markerX)}
            y2={T + ph}
            className="stroke-zinc-400 dark:stroke-zinc-500"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {/* 시리즈 */}
        {series.map((s, i) => (
          <polyline
            key={i}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 4" : undefined}
            points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
          />
        ))}

        {/* 마커 위 점 */}
        {markerX != null &&
          series.map((s, i) => {
            const p = nearest(s.points, markerX);
            if (!p) return null;
            return (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} fill={s.color} />
            );
          })}
      </svg>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 px-2 pb-1 pt-1">
        {series
          .filter((s) => s.label)
          .map((s, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
          ))}
        {(xUnit || yUnit) && (
          <span className="ml-auto text-xs text-zinc-400">
            {yUnit && `세로: ${yUnit}`} {xUnit && `· 가로: ${xUnit}`}
          </span>
        )}
      </div>
    </div>
  );
}

/** 반원 게이지 (0~100%) */
export function Gauge({
  value,
  label,
  color = PALETTE.indigo,
}: {
  value: number; // 0~100
  label?: string;
  color?: string;
}) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const R = 80;
  const cx = 100;
  const cy = 100;
  const a0 = Math.PI; // 180°
  const a1 = Math.PI - (v / 100) * Math.PI;
  const arc = (a: number) => `${cx + R * Math.cos(a)},${cy - R * Math.sin(a)}`;
  const large = 0;
  return (
    <div className="flex flex-col items-center rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <svg viewBox="0 0 200 120" width="100%" height={130}>
        <path
          d={`M ${arc(Math.PI)} A ${R} ${R} 0 0 1 ${arc(0)}`}
          fill="none"
          className="stroke-zinc-200 dark:stroke-zinc-700"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M ${arc(a0)} A ${R} ${R} 0 ${large} 1 ${arc(a1)}`}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-zinc-900 text-[28px] font-bold dark:fill-zinc-100"
        >
          {v.toFixed(1)}%
        </text>
      </svg>
      {label && (
        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </div>
      )}
    </div>
  );
}

/** 가로 막대 비교 */
export function Bars({
  items,
}: {
  items: { label: string; value: number; color?: string; display?: string }[];
}) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1e-9);
  const colors = [
    PALETTE.indigo,
    PALETTE.emerald,
    PALETTE.amber,
    PALETTE.sky,
    PALETTE.rose,
  ];
  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      {items.map((it, i) => (
        <div key={it.label}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">{it.label}</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {it.display ?? it.value}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(Math.abs(it.value) / max) * 100}%`,
                background: it.color ?? colors[i % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 전력 삼각형 (P 가로, Q 세로, S 빗변) */
export function PowerTriangle({
  P,
  Q,
  S,
  unitP = "kW",
  unitQ = "kVAR",
  unitS = "kVA",
}: {
  P: number;
  Q: number;
  S: number;
  unitP?: string;
  unitQ?: string;
  unitS?: string;
}) {
  const W = 320;
  const H = 200;
  const ox = 40;
  const oy = H - 30;
  const maxLen = Math.max(S, 1e-9);
  const scale = (W - 90) / maxLen;
  const px = ox + P * scale;
  const qy = oy - Q * scale;
  const deg = ((Math.atan2(Q, P) * 180) / Math.PI).toFixed(1);
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={190}>
        {/* P (가로) */}
        <line x1={ox} y1={oy} x2={px} y2={oy} stroke={PALETTE.indigo} strokeWidth={3} />
        {/* Q (세로) */}
        <line x1={px} y1={oy} x2={px} y2={qy} stroke={PALETTE.amber} strokeWidth={3} />
        {/* S (빗변) */}
        <line x1={ox} y1={oy} x2={px} y2={qy} stroke={PALETTE.rose} strokeWidth={3} />
        <circle cx={ox} cy={oy} r={3} className="fill-zinc-500" />
        <text x={(ox + px) / 2} y={oy + 18} textAnchor="middle" fill={PALETTE.indigo} className="text-[12px] font-medium">
          P {P.toFixed(2)} {unitP}
        </text>
        <text x={px + 6} y={(oy + qy) / 2} fill={PALETTE.amber} className="text-[12px] font-medium">
          Q {Q.toFixed(2)} {unitQ}
        </text>
        <text x={(ox + px) / 2 - 10} y={(oy + qy) / 2 - 6} fill={PALETTE.rose} className="text-[12px] font-medium">
          S {S.toFixed(2)} {unitS}
        </text>
        <text x={ox + 26} y={oy - 6} className="fill-zinc-500 text-[11px]">
          θ {deg}°
        </text>
      </svg>
    </div>
  );
}

export function ChartCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {title && (
        <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export { PALETTE };

function fmtTick(n: number): string {
  const a = Math.abs(n);
  if (a !== 0 && (a < 0.01 || a >= 100000))
    return n.toExponential(0).replace("+", "");
  return Number(n.toFixed(2)).toLocaleString("en-US");
}

function nearest(points: Pt[], x: number): Pt | null {
  if (!points.length) return null;
  let best = points[0];
  let bd = Math.abs(points[0].x - x);
  for (const p of points) {
    const d = Math.abs(p.x - x);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best;
}
