import { useEffect, useRef, useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { Bars, PALETTE } from "../components/charts";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    bore: "실린더 보어경 (내경)",
    rod: "로드경",
    supplyPressure: "공급압력",
    pressureUnit: "압력 단위",
    loadFactor: "부하율 (효율)",
    loadFactorHint: "% — 보통 50~70 적용",
    pushThrust: "전진 추력 (Push)",
    pushThrustKgf: "전진 추력",
    pullThrust: "후진 추력 (Pull)",
    pullThrustKgf: "후진 추력",
    motion: "동작 (왕복)",
    thrustCompare: "추력 비교",
    barPush: "전진 Push",
    barPull: "후진 Pull",
    note: "Push = P × (π/4 × 보어²) × 부하율. Pull 은 로드 단면적 제외. P 는 MPa(= N/mm²) 환산값 적용.",
  },
  en: {
    bore: "Cylinder bore (ID)",
    rod: "Rod diameter",
    supplyPressure: "Supply pressure",
    pressureUnit: "Pressure unit",
    loadFactor: "Load factor (efficiency)",
    loadFactorHint: "% — typically 50~70 applied",
    pushThrust: "Extend thrust (Push)",
    pushThrustKgf: "Extend thrust",
    pullThrust: "Retract thrust (Pull)",
    pullThrustKgf: "Retract thrust",
    motion: "Motion (reciprocating)",
    thrustCompare: "Thrust comparison",
    barPush: "Extend Push",
    barPull: "Retract Pull",
    note: "Push = P × (π/4 × bore²) × load factor. Pull excludes rod cross-section. P uses the MPa (= N/mm²) converted value.",
  },
  zh: {
    bore: "气缸缸径 (内径)",
    rod: "活塞杆径",
    supplyPressure: "供给压力",
    pressureUnit: "压力单位",
    loadFactor: "负载率 (效率)",
    loadFactorHint: "% — 通常取 50~70",
    pushThrust: "前进推力 (Push)",
    pushThrustKgf: "前进推力",
    pullThrust: "后退推力 (Pull)",
    pullThrustKgf: "后退推力",
    motion: "动作 (往复)",
    thrustCompare: "推力对比",
    barPush: "前进 Push",
    barPull: "后退 Pull",
    note: "Push = P × (π/4 × 缸径²) × 负载率。Pull 不含活塞杆截面积。P 采用 MPa(= N/mm²) 换算值。",
  },
} as const;

export default function CylinderForceTool() {
  const tr = TEXT[useLang()];
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
        <Field label={tr.bore} hint="mm">
          <TextInput
            mono
            value={bore}
            onChange={(e) => setBore(e.target.value)}
          />
        </Field>
        <Field label={tr.rod} hint="mm">
          <TextInput mono value={rod} onChange={(e) => setRod(e.target.value)} />
        </Field>
        <Field label={tr.supplyPressure}>
          <TextInput
            mono
            value={pressure}
            onChange={(e) => setPressure(e.target.value)}
          />
        </Field>
        <Field label={tr.pressureUnit}>
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
        <Field label={tr.loadFactor} hint={tr.loadFactorHint}>
          <TextInput
            mono
            value={eff}
            onChange={(e) => setEff(e.target.value)}
            className="w-32"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label={tr.pushThrust} value={fmtNum(pushN, 1)} unit="N" accent />
        <Stat label={tr.pushThrustKgf} value={fmtNum(toKgf(pushN), 2)} unit="kgf" />
        <Stat label={tr.pullThrust} value={fmtNum(pullN, 1)} unit="N" accent />
        <Stat label={tr.pullThrustKgf} value={fmtNum(toKgf(pullN), 2)} unit="kgf" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {tr.motion}
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
            {tr.thrustCompare}
          </div>
          <Bars
            items={[
              { label: tr.barPush, value: pushN, display: fmtNum(pushN, 0) + " N", color: PALETTE.indigo },
              { label: tr.barPull, value: pullN, display: fmtNum(pullN, 0) + " N", color: PALETTE.emerald },
            ]}
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500">{tr.note}</p>
    </div>
  );
}
