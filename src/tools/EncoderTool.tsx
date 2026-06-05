import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";

type Mode = "rotary" | "pulley" | "screw";

const TEXT = {
  ko: {
    pprLabel: "엔코더 PPR",
    pprHint: "기본 펄스/회전",
    multLabel: "체배 (逓倍)",
    multHint: "A/B 직교 = 4",
    multSuffix: "체배",
    countsResolution: "체배 후 분해능",
    countsUnit: "counts/회전",
    angResolution: "각도 분해능",
    maxRpm: "최대 회전수",
    linearSection: "선형 환산 (옵션)",
    measureMode: "측정 방식",
    modeRotary: "회전만",
    modePulley: "풀리/롤러 (외경)",
    modeScrew: "볼스크류 (리드)",
    pulleyDim: "풀리/롤러 외경",
    screwDim: "볼스크류 리드",
    linResolution: "선형 분해능",
    travelPerRev: "1회전 이송",
    maxFreqLabel: "카운터 최대 응답주파수",
    maxFreqHint: "kHz (체배 후 기준)",
    note: "분해능 = PPR × 체배. 각도 = 360 ÷ 분해능. 선형 = 1회전이송 ÷ 분해능. 최대회전수 = 응답주파수 × 60 ÷ 분해능.",
  },
  en: {
    pprLabel: "Encoder PPR",
    pprHint: "base pulses/rev",
    multLabel: "Multiplier",
    multHint: "A/B quadrature = 4",
    multSuffix: "×",
    countsResolution: "Resolution after multiplier",
    countsUnit: "counts/rev",
    angResolution: "Angular resolution",
    maxRpm: "Max speed",
    linearSection: "Linear conversion (optional)",
    measureMode: "Measurement type",
    modeRotary: "Rotary only",
    modePulley: "Pulley/roller (OD)",
    modeScrew: "Ballscrew (lead)",
    pulleyDim: "Pulley/roller OD",
    screwDim: "Ballscrew lead",
    linResolution: "Linear resolution",
    travelPerRev: "Travel per rev",
    maxFreqLabel: "Counter max response frequency",
    maxFreqHint: "kHz (after multiplier)",
    note: "Resolution = PPR × multiplier. Angle = 360 ÷ resolution. Linear = travel per rev ÷ resolution. Max speed = response frequency × 60 ÷ resolution.",
  },
  zh: {
    pprLabel: "编码器 PPR",
    pprHint: "基本脉冲/转",
    multLabel: "倍频 (逓倍)",
    multHint: "A/B 正交 = 4",
    multSuffix: "倍频",
    countsResolution: "倍频后分辨率",
    countsUnit: "counts/转",
    angResolution: "角度分辨率",
    maxRpm: "最大转速",
    linearSection: "线性换算 (可选)",
    measureMode: "测量方式",
    modeRotary: "仅旋转",
    modePulley: "皮带轮/滚轮 (外径)",
    modeScrew: "滚珠丝杠 (导程)",
    pulleyDim: "皮带轮/滚轮外径",
    screwDim: "滚珠丝杠导程",
    linResolution: "线性分辨率",
    travelPerRev: "每转进给",
    maxFreqLabel: "计数器最大响应频率",
    maxFreqHint: "kHz (以倍频后为准)",
    note: "分辨率 = PPR × 倍频。角度 = 360 ÷ 分辨率。线性 = 每转进给 ÷ 分辨率。最大转速 = 响应频率 × 60 ÷ 分辨率。",
  },
} as const;

export default function EncoderTool() {
  const t = TEXT[useLang()];
  const [ppr, setPpr] = useState("2500"); // 엔코더 기본 PPR
  const [mult, setMult] = useState<1 | 2 | 4>(4); // 체배 (A/B 직교 4체배)
  const [mode, setMode] = useState<Mode>("rotary");
  const [dim, setDim] = useState("60"); // 풀리경 또는 리드 mm
  const [maxFreq, setMaxFreq] = useState("200"); // 카운터 최대 응답 kHz

  const P = Number(ppr);
  const counts = P * mult; // 체배 후 카운트/회전
  const degPerCount = counts === 0 ? 0 : 360 / counts;
  const arcsec = degPerCount * 3600;

  // 선형 1회전 이송거리 mm
  const travelPerRev =
    mode === "pulley" ? Math.PI * Number(dim) : Number(dim); // screw=lead
  const mmPerCount = counts === 0 ? 0 : travelPerRev / counts;

  // 최대 회전수: freq = rpm/60 × counts → rpm = freq×60/counts
  const fHz = Number(maxFreq) * 1000;
  const maxRpm = counts === 0 ? 0 : (fHz * 60) / counts;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.pprLabel} hint={t.pprHint}>
          <TextInput mono value={ppr} onChange={(e) => setPpr(e.target.value)} />
        </Field>
        <Field label={t.multLabel} hint={t.multHint}>
          <div className="flex gap-2">
            {([1, 2, 4] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMult(m)}
                className={`rounded-md px-4 py-2 text-sm ${
                  m === mult
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {m}
                {t.multSuffix}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label={t.countsResolution}
          value={fmtNum(counts, 0)}
          unit={t.countsUnit}
          accent
        />
        <Stat label={t.angResolution} value={fmtNum(degPerCount, 5)} unit="°/count" />
        <Stat label={t.angResolution} value={fmtNum(arcsec, 2)} unit="arc-sec" />
        <Stat
          label={t.maxRpm}
          value={fmtNum(maxRpm, 0)}
          unit="rpm"
          accent
        />
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {t.linearSection}
        </div>
        <Field label={t.measureMode}>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["rotary", t.modeRotary],
                ["pulley", t.modePulley],
                ["screw", t.modeScrew],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-sm ${
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

        {mode !== "rotary" && (
          <div className="mt-3 space-y-3">
            <Field
              label={mode === "pulley" ? t.pulleyDim : t.screwDim}
              hint="mm"
            >
              <TextInput
                mono
                value={dim}
                onChange={(e) => setDim(e.target.value)}
                className="w-40"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat
                label={t.linResolution}
                value={fmtNum(mmPerCount * 1000, 3)}
                unit="µm/count"
                accent
              />
              <Stat
                label={t.travelPerRev}
                value={fmtNum(travelPerRev, 3)}
                unit="mm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <Field label={t.maxFreqLabel} hint={t.maxFreqHint}>
          <TextInput
            mono
            value={maxFreq}
            onChange={(e) => setMaxFreq(e.target.value)}
            className="w-40"
          />
        </Field>
      </div>

      <p className="text-xs text-zinc-500">{t.note}</p>
    </div>
  );
}
