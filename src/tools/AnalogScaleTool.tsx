import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { LineChart, PALETTE } from "../components/charts";
import { useLang } from "../components/i18n";

const PRESETS: Record<string, [number, number, string]> = {
  "4-20mA": [4, 20, "mA"],
  "0-20mA": [0, 20, "mA"],
  "0-10V": [0, 10, "V"],
  "1-5V": [1, 5, "V"],
  "0-5V": [0, 5, "V"],
  직접입력: [0, 100, ""],
};

const TEXT = {
  ko: {
    signalType: "신호 종류",
    rawMin: "신호 최소 (Raw Min)",
    rawMax: "신호 최대 (Raw Max)",
    euMin: "측정값 최소 (EU Min)",
    euMax: "측정값 최대 (EU Max)",
    sigToEu: "신호 → 측정값",
    currentSignal: "현재 신호값",
    measuredEu: "측정값 (EU)",
    rangeRatio: "범위 비율",
    linearMapping: "선형 매핑",
    currentSignalLabel: "현재 신호",
    xSignal: "신호",
    yMeasured: "측정값(EU)",
    euToSig: "측정값 → 신호 (역산)",
    targetEu: "목표 측정값 (EU)",
    targetEuPlaceholder: "예: 50",
    neededSignal: "필요 신호값",
  },
  en: {
    signalType: "Signal type",
    rawMin: "Signal min (Raw Min)",
    rawMax: "Signal max (Raw Max)",
    euMin: "Value min (EU Min)",
    euMax: "Value max (EU Max)",
    sigToEu: "Signal → Value",
    currentSignal: "Current signal",
    measuredEu: "Value (EU)",
    rangeRatio: "Range ratio",
    linearMapping: "Linear mapping",
    currentSignalLabel: "Current signal",
    xSignal: "Signal",
    yMeasured: "Value (EU)",
    euToSig: "Value → Signal (inverse)",
    targetEu: "Target value (EU)",
    targetEuPlaceholder: "e.g. 50",
    neededSignal: "Required signal",
  },
  zh: {
    signalType: "信号类型",
    rawMin: "信号最小 (Raw Min)",
    rawMax: "信号最大 (Raw Max)",
    euMin: "测量值最小 (EU Min)",
    euMax: "测量值最大 (EU Max)",
    sigToEu: "信号 → 测量值",
    currentSignal: "当前信号值",
    measuredEu: "测量值 (EU)",
    rangeRatio: "量程比例",
    linearMapping: "线性映射",
    currentSignalLabel: "当前信号",
    xSignal: "信号",
    yMeasured: "测量值(EU)",
    euToSig: "测量值 → 信号 (反算)",
    targetEu: "目标测量值 (EU)",
    targetEuPlaceholder: "例: 50",
    neededSignal: "所需信号值",
  },
} as const;

export default function AnalogScaleTool() {
  const t = TEXT[useLang()];
  const [preset, setPreset] = useState("4-20mA");
  const [rawMin, setRawMin] = useState("4");
  const [rawMax, setRawMax] = useState("20");
  const [euMin, setEuMin] = useState("0");
  const [euMax, setEuMax] = useState("100");
  const [signal, setSignal] = useState("12");
  const [eu, setEu] = useState("");

  function applyPreset(name: string) {
    setPreset(name);
    const [lo, hi] = PRESETS[name];
    setRawMin(String(lo));
    setRawMax(String(hi));
  }

  const rMin = Number(rawMin);
  const rMax = Number(rawMax);
  const eMin = Number(euMin);
  const eMax = Number(euMax);
  const span = rMax - rMin;

  // 신호 → 측정값
  const sig = Number(signal);
  const ratio = span === 0 ? 0 : (sig - rMin) / span;
  const calcEu = eMin + ratio * (eMax - eMin);
  const pct = ratio * 100;

  // 측정값 → 신호 (역산)
  const euVal = Number(eu);
  const backRatio = eMax - eMin === 0 ? 0 : (euVal - eMin) / (eMax - eMin);
  const backSignal = rMin + backRatio * span;

  return (
    <div className="space-y-5">
      <Field label={t.signalType}>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                p === preset
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.rawMin}>
          <TextInput
            mono
            value={rawMin}
            onChange={(e) => setRawMin(e.target.value)}
          />
        </Field>
        <Field label={t.rawMax}>
          <TextInput
            mono
            value={rawMax}
            onChange={(e) => setRawMax(e.target.value)}
          />
        </Field>
        <Field label={t.euMin}>
          <TextInput
            mono
            value={euMin}
            onChange={(e) => setEuMin(e.target.value)}
          />
        </Field>
        <Field label={t.euMax}>
          <TextInput
            mono
            value={euMax}
            onChange={(e) => setEuMax(e.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {t.sigToEu}
        </div>
        <Field label={t.currentSignal}>
          <TextInput
            mono
            value={signal}
            onChange={(e) => setSignal(e.target.value)}
          />
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat label={t.measuredEu} value={fmtNum(calcEu)} accent />
          <Stat label={t.rangeRatio} value={fmtNum(pct, 2)} unit="%" />
        </div>
        <div className="mt-3">
          <LineChart
            series={[
              {
                points: [
                  { x: rMin, y: eMin },
                  { x: rMax, y: eMax },
                ],
                color: PALETTE.indigo,
                label: t.linearMapping,
              },
              {
                points: [
                  { x: sig, y: eMin },
                  { x: sig, y: calcEu },
                ],
                color: PALETTE.rose,
                label: t.currentSignalLabel,
                dashed: true,
              },
            ]}
            xMin={Math.min(rMin, rMax)}
            xMax={Math.max(rMin, rMax)}
            markerX={sig}
            xUnit={t.xSignal}
            yUnit={t.yMeasured}
            height={220}
          />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {t.euToSig}
        </div>
        <Field label={t.targetEu}>
          <TextInput
            mono
            value={eu}
            onChange={(e) => setEu(e.target.value)}
            placeholder={t.targetEuPlaceholder}
          />
        </Field>
        <div className="mt-3">
          <Stat
            label={t.neededSignal}
            value={eu === "" ? "—" : fmtNum(backSignal)}
            accent
          />
        </div>
      </div>
    </div>
  );
}
