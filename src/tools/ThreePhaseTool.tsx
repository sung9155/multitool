import { useEffect, useRef, useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { LineChart, PowerTriangle, PALETTE, type Pt } from "../components/charts";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    direction: "계산 방향",
    i2p: "전류 → 전력",
    p2i: "전력 → 전류",
    lineVoltage: "선간전압",
    powerFactor: "역률 (cosθ)",
    lineCurrent: "선전류",
    activePower: "유효전력",
    activePowerP: "유효전력 P",
    lineCurrentI: "선전류 I",
    apparentPowerS: "피상전력 S",
    reactivePowerQ: "무효전력 Q",
    horsepower: "마력 환산",
    waveTitle: "3상 전압 파형 (위상차 120°)",
    phaseR: "R상",
    phaseS: "S상",
    phaseT: "T상",
    phaseUnit: "위상(°)",
    triangleTitle: "전력 삼각형",
  },
  en: {
    direction: "Calculation direction",
    i2p: "Current → Power",
    p2i: "Power → Current",
    lineVoltage: "Line voltage",
    powerFactor: "Power factor (cosθ)",
    lineCurrent: "Line current",
    activePower: "Active power",
    activePowerP: "Active power P",
    lineCurrentI: "Line current I",
    apparentPowerS: "Apparent power S",
    reactivePowerQ: "Reactive power Q",
    horsepower: "Horsepower",
    waveTitle: "3-phase voltage waveform (120° apart)",
    phaseR: "Phase R",
    phaseS: "Phase S",
    phaseT: "Phase T",
    phaseUnit: "Phase(°)",
    triangleTitle: "Power triangle",
  },
  zh: {
    direction: "计算方向",
    i2p: "电流 → 功率",
    p2i: "功率 → 电流",
    lineVoltage: "线电压",
    powerFactor: "功率因数 (cosθ)",
    lineCurrent: "线电流",
    activePower: "有功功率",
    activePowerP: "有功功率 P",
    lineCurrentI: "线电流 I",
    apparentPowerS: "视在功率 S",
    reactivePowerQ: "无功功率 Q",
    horsepower: "马力换算",
    waveTitle: "三相电压波形 (相差 120°)",
    phaseR: "R相",
    phaseS: "S相",
    phaseT: "T相",
    phaseUnit: "相位(°)",
    triangleTitle: "功率三角形",
  },
} as const;

const R3 = Math.sqrt(3);

// 3φ 정현파 생성 (x: 0~720°, phase: 애니메이션 오프셋)
function wave(offsetDeg: number, phase: number): Pt[] {
  const pts: Pt[] = [];
  for (let x = 0; x <= 720; x += 8) {
    const rad = ((x + phase + offsetDeg) * Math.PI) / 180;
    pts.push({ x, y: Math.sin(rad) });
  }
  return pts;
}

export default function ThreePhaseTool() {
  const t = TEXT[useLang()];
  const [mode, setMode] = useToolState<"i2p" | "p2i">("mode", "i2p");
  const [volt, setVolt] = useToolState("volt", "380"); // 선간전압 V
  const [pf, setPf] = useToolState("pf", "0.85"); // 역률
  const [current, setCurrent] = useToolState("current", "10"); // A
  const [power, setPower] = useToolState("power", "5"); // kW

  // 파형 애니메이션 위상
  const [phase, setPhase] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const tick = () => {
      setPhase((p) => (p + 3) % 360);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const V = Number(volt);
  const cos = Number(pf);

  let I: number, Pw: number;
  if (mode === "i2p") {
    I = Number(current);
    Pw = (R3 * V * I * cos) / 1000; // kW
  } else {
    Pw = Number(power);
    I = V * cos === 0 ? 0 : (Pw * 1000) / (R3 * V * cos);
  }
  const S = (R3 * V * I) / 1000; // kVA
  const Q = Math.sqrt(Math.max(0, S * S - Pw * Pw)); // kVAR

  return (
    <div className="space-y-5">
      <Field label={t.direction}>
        <div className="flex gap-2">
          {(
            [
              ["i2p", t.i2p],
              ["p2i", t.p2i],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-2 text-sm ${
                m === mode
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t.lineVoltage} hint="V">
          <TextInput
            mono
            value={volt}
            onChange={(e) => setVolt(e.target.value)}
          />
        </Field>
        <Field label={t.powerFactor}>
          <TextInput mono value={pf} onChange={(e) => setPf(e.target.value)} />
        </Field>
        {mode === "i2p" ? (
          <Field label={t.lineCurrent} hint="A">
            <TextInput
              mono
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
        ) : (
          <Field label={t.activePower} hint="kW">
            <TextInput
              mono
              value={power}
              onChange={(e) => setPower(e.target.value)}
            />
          </Field>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {mode === "i2p" ? (
          <Stat label={t.activePowerP} value={fmtNum(Pw, 3)} unit="kW" accent />
        ) : (
          <Stat label={t.lineCurrentI} value={fmtNum(I, 2)} unit="A" accent />
        )}
        <Stat label={t.apparentPowerS} value={fmtNum(S, 3)} unit="kVA" />
        <Stat label={t.reactivePowerQ} value={fmtNum(Q, 3)} unit="kVAR" />
        <Stat label={t.horsepower} value={fmtNum(Pw / 0.7457, 2)} unit="HP" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {t.waveTitle}
          </div>
          <LineChart
            series={[
              { points: wave(0, phase), color: PALETTE.indigo, label: t.phaseR },
              { points: wave(-120, phase), color: PALETTE.emerald, label: t.phaseS },
              { points: wave(120, phase), color: PALETTE.amber, label: t.phaseT },
            ]}
            xMin={0}
            xMax={720}
            yMin={-1.2}
            yMax={1.2}
            xUnit={t.phaseUnit}
            height={200}
          />
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {t.triangleTitle}
          </div>
          <PowerTriangle P={Pw} Q={Q} S={S} />
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        3상: P = √3 × V<sub>line</sub> × I × cosθ. S = √3 × V × I.
      </p>
    </div>
  );
}
