import { useEffect, useRef, useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { Bars, PALETTE } from "../components/charts";

export default function CylinderForceTool() {
  const [bore, setBore] = useState("32"); // mm
  const [rod, setRod] = useState("12"); // mm
  const [pressure, setPressure] = useState("0.5"); // MPa
  const [unit, setUnit] = useState<"MPa" | "bar">("MPa");
  const [eff, setEff] = useState("100"); // 부하율 %

  // 피스톤 왕복 애니메이션 (0=후진, 1=전진)
  const [s, setS] = useState(0);
  const raf = useRef(0);
  const t = useRef(0);
  useEffect(() => {
    const tick = () => {
      t.current += 0.02;
      setS((Math.sin(t.current) + 1) / 2); // 0~1 왕복
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const D = Number(bore);
  const d = Number(rod);
  const pMPa = unit === "MPa" ? Number(pressure) : Number(pressure) * 0.1;
  const k = Number(eff) / 100;

  const areaBore = (Math.PI / 4) * D * D; // mm²
  const areaRod = (Math.PI / 4) * d * d;
  const areaAnnulus = areaBore - areaRod;

  // P[MPa]=N/mm² → F[N] = P * Area
  const pushN = pMPa * areaBore * k;
  const pullN = pMPa * areaAnnulus * k;
  const toKgf = (n: number) => n / 9.80665;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="실린더 보어경 (내경)" hint="mm">
          <TextInput
            mono
            value={bore}
            onChange={(e) => setBore(e.target.value)}
          />
        </Field>
        <Field label="로드경" hint="mm">
          <TextInput mono value={rod} onChange={(e) => setRod(e.target.value)} />
        </Field>
        <Field label="공급압력">
          <TextInput
            mono
            value={pressure}
            onChange={(e) => setPressure(e.target.value)}
          />
        </Field>
        <Field label="압력 단위">
          <div className="flex gap-2">
            {(["MPa", "bar"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`rounded-md px-3 py-2 text-sm ${
                  u === unit
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Field>
        <Field label="부하율 (효율)" hint="% — 보통 50~70 적용">
          <TextInput
            mono
            value={eff}
            onChange={(e) => setEff(e.target.value)}
            className="w-32"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="전진 추력 (Push)" value={fmtNum(pushN, 1)} unit="N" accent />
        <Stat label="전진 추력" value={fmtNum(toKgf(pushN), 2)} unit="kgf" />
        <Stat label="후진 추력 (Pull)" value={fmtNum(pullN, 1)} unit="N" accent />
        <Stat label="후진 추력" value={fmtNum(toKgf(pullN), 2)} unit="kgf" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            동작 (왕복)
          </div>
          {(() => {
            // 보어/로드 비율을 시각 반영
            const dRatio = D > 0 ? Math.min(1, d / D) : 0.3;
            const barH = 46;
            const rodH = barH * dRatio;
            const cy = 50;
            const strokeX = 70 + s * 150; // 피스톤 위치
            return (
              <svg viewBox="0 0 320 100" width="100%" height={100}>
                {/* 실린더 배럴 */}
                <rect
                  x={60}
                  y={cy - barH / 2}
                  width={170}
                  height={barH}
                  rx={4}
                  className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-800 dark:stroke-zinc-600"
                  strokeWidth={2}
                />
                {/* 압력 채움 (피스톤 왼쪽) */}
                <rect
                  x={62}
                  y={cy - barH / 2 + 2}
                  width={strokeX - 62}
                  height={barH - 4}
                  fill={PALETTE.sky}
                  opacity={0.25}
                />
                {/* 피스톤 */}
                <rect
                  x={strokeX - 8}
                  y={cy - barH / 2 + 2}
                  width={8}
                  height={barH - 4}
                  className="fill-zinc-500 dark:fill-zinc-400"
                />
                {/* 로드 */}
                <rect
                  x={strokeX}
                  y={cy - rodH / 2}
                  width={300 - strokeX}
                  height={rodH}
                  className="fill-zinc-400 dark:fill-zinc-500"
                />
                {/* 추력 화살표 */}
                <line
                  x1={300}
                  y1={cy}
                  x2={312}
                  y2={cy}
                  stroke={PALETTE.rose}
                  strokeWidth={3}
                />
                <polygon points={`312,${cy - 5} 320,${cy} 312,${cy + 5}`} fill={PALETTE.rose} />
              </svg>
            );
          })()}
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            추력 비교
          </div>
          <Bars
            items={[
              { label: "전진 Push", value: pushN, display: fmtNum(pushN, 0) + " N", color: PALETTE.indigo },
              { label: "후진 Pull", value: pullN, display: fmtNum(pullN, 0) + " N", color: PALETTE.emerald },
            ]}
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Push = P × (π/4 × 보어²) × 부하율. Pull 은 로드 단면적 제외. P 는 MPa(=
        N/mm²) 환산값 적용.
      </p>
    </div>
  );
}
