import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { LineChart, PALETTE } from "../components/charts";

const PRESETS: Record<string, [number, number, string]> = {
  "4-20mA": [4, 20, "mA"],
  "0-20mA": [0, 20, "mA"],
  "0-10V": [0, 10, "V"],
  "1-5V": [1, 5, "V"],
  "0-5V": [0, 5, "V"],
  직접입력: [0, 100, ""],
};

export default function AnalogScaleTool() {
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
      <Field label="신호 종류">
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
        <Field label="신호 최소 (Raw Min)">
          <TextInput
            mono
            value={rawMin}
            onChange={(e) => setRawMin(e.target.value)}
          />
        </Field>
        <Field label="신호 최대 (Raw Max)">
          <TextInput
            mono
            value={rawMax}
            onChange={(e) => setRawMax(e.target.value)}
          />
        </Field>
        <Field label="측정값 최소 (EU Min)">
          <TextInput
            mono
            value={euMin}
            onChange={(e) => setEuMin(e.target.value)}
          />
        </Field>
        <Field label="측정값 최대 (EU Max)">
          <TextInput
            mono
            value={euMax}
            onChange={(e) => setEuMax(e.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          신호 → 측정값
        </div>
        <Field label="현재 신호값">
          <TextInput
            mono
            value={signal}
            onChange={(e) => setSignal(e.target.value)}
          />
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat label="측정값 (EU)" value={fmtNum(calcEu)} accent />
          <Stat label="범위 비율" value={fmtNum(pct, 2)} unit="%" />
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
                label: "선형 매핑",
              },
              {
                points: [
                  { x: sig, y: eMin },
                  { x: sig, y: calcEu },
                ],
                color: PALETTE.rose,
                label: "현재 신호",
                dashed: true,
              },
            ]}
            xMin={Math.min(rMin, rMax)}
            xMax={Math.max(rMin, rMax)}
            markerX={sig}
            xUnit="신호"
            yUnit="측정값(EU)"
            height={220}
          />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          측정값 → 신호 (역산)
        </div>
        <Field label="목표 측정값 (EU)">
          <TextInput
            mono
            value={eu}
            onChange={(e) => setEu(e.target.value)}
            placeholder="예: 50"
          />
        </Field>
        <div className="mt-3">
          <Stat
            label="필요 신호값"
            value={eu === "" ? "—" : fmtNum(backSignal)}
            accent
          />
        </div>
      </div>
    </div>
  );
}
