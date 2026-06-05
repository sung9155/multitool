import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { LineChart, PALETTE, type Pt } from "../components/charts";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    lead: "볼스크류 리드",
    leadHint: "mm/회전",
    pprLabel: "모터 1회전당 펄스",
    pprHint: "지령분해능 PPR",
    gear: "감속비 i",
    gearHint: "모터:스크류",
    feedSpeed: "목표 이송속도",
    feedHint: "mm/s",
    posResolution: "위치결정 분해능",
    resolution: "분해능",
    motorRpm: "모터 회전수",
    screwRpm: "스크류 회전수",
    pulseFreq: "펄스 주파수",
    chartTitle: "이송속도에 따른 모터 RPM · 펄스주파수",
    motorRpmSeries: "모터 RPM",
    pulseFreqSeries: "펄스주파수 (kHz)",
    xFeed: "이송속도 (mm/s)",
    note: "분해능 = 리드 ÷ (PPR × 감속비). 펄스주파수 = 이송속도 ÷ 분해능. 지령 펄스(전자기어 후) 기준.",
  },
  en: {
    lead: "Ballscrew lead",
    leadHint: "mm/rev",
    pprLabel: "Pulses per motor rev",
    pprHint: "Command resolution PPR",
    gear: "Gear ratio i",
    gearHint: "motor:screw",
    feedSpeed: "Target feed speed",
    feedHint: "mm/s",
    posResolution: "Positioning resolution",
    resolution: "Resolution",
    motorRpm: "Motor speed",
    screwRpm: "Screw speed",
    pulseFreq: "Pulse frequency",
    chartTitle: "Motor RPM · pulse frequency vs feed speed",
    motorRpmSeries: "Motor RPM",
    pulseFreqSeries: "Pulse frequency (kHz)",
    xFeed: "Feed speed (mm/s)",
    note: "Resolution = lead ÷ (PPR × gear ratio). Pulse frequency = feed speed ÷ resolution. Based on command pulses (after electronic gear).",
  },
  zh: {
    lead: "滚珠丝杠导程",
    leadHint: "mm/转",
    pprLabel: "电机每转脉冲数",
    pprHint: "指令分辨率 PPR",
    gear: "减速比 i",
    gearHint: "电机:丝杠",
    feedSpeed: "目标进给速度",
    feedHint: "mm/s",
    posResolution: "定位分辨率",
    resolution: "分辨率",
    motorRpm: "电机转速",
    screwRpm: "丝杠转速",
    pulseFreq: "脉冲频率",
    chartTitle: "随进给速度变化的电机 RPM · 脉冲频率",
    motorRpmSeries: "电机 RPM",
    pulseFreqSeries: "脉冲频率 (kHz)",
    xFeed: "进给速度 (mm/s)",
    note: "分辨率 = 导程 ÷ (PPR × 减速比)。脉冲频率 = 进给速度 ÷ 分辨率。以指令脉冲(电子齿轮后)为准。",
  },
} as const;

export default function BallscrewTool() {
  const t = TEXT[useLang()];
  const [lead, setLead] = useState("10"); // mm/rev (스크류 1회전 이송)
  const [ppr, setPpr] = useState("10000"); // 모터 1회전당 지령 펄스
  const [gear, setGear] = useState("1"); // 기어비 i (모터회전:스크류회전)
  const [speed, setSpeed] = useState("300"); // 목표 이송속도 mm/s

  const L = Number(lead);
  const P = Number(ppr);
  const i = Number(gear);
  const v = Number(speed);

  // 스크류 1회전 = 모터 i 회전 = 펄스 P*i 개, 이송 L mm
  const pulsesPerScrewRev = P * i;
  const resolutionMm = pulsesPerScrewRev === 0 ? 0 : L / pulsesPerScrewRev; // mm/pulse

  const screwRpm = L === 0 ? 0 : (v / L) * 60; // 스크류 회전수
  const motorRpm = screwRpm * i; // 모터 회전수
  const pulseFreq = resolutionMm === 0 ? 0 : v / resolutionMm; // pulse/s (Hz)

  // 속도 vs 모터RPM / 펄스주파수(kHz) 곡선
  const vMax = Math.max(v * 1.5, 100);
  const rpmLine: Pt[] = [];
  const freqLine: Pt[] = [];
  for (let s = 0; s <= vMax; s += vMax / 40) {
    const sRpm = L === 0 ? 0 : (s / L) * 60;
    rpmLine.push({ x: s, y: sRpm * i });
    freqLine.push({ x: s, y: (resolutionMm === 0 ? 0 : s / resolutionMm) / 1000 });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.lead} hint={t.leadHint}>
          <TextInput
            mono
            value={lead}
            onChange={(e) => setLead(e.target.value)}
          />
        </Field>
        <Field label={t.pprLabel} hint={t.pprHint}>
          <TextInput
            mono
            value={ppr}
            onChange={(e) => setPpr(e.target.value)}
          />
        </Field>
        <Field label={t.gear} hint={t.gearHint}>
          <TextInput
            mono
            value={gear}
            onChange={(e) => setGear(e.target.value)}
          />
        </Field>
        <Field label={t.feedSpeed} hint={t.feedHint}>
          <TextInput
            mono
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label={t.posResolution}
          value={fmtNum(resolutionMm * 1000, 4)}
          unit="µm/pulse"
          accent
        />
        <Stat
          label={t.resolution}
          value={fmtNum(resolutionMm, 6)}
          unit="mm/pulse"
        />
        <Stat label={t.motorRpm} value={fmtNum(motorRpm, 1)} unit="rpm" accent />
        <Stat label={t.screwRpm} value={fmtNum(screwRpm, 1)} unit="rpm" />
        <Stat
          label={t.pulseFreq}
          value={fmtNum(pulseFreq / 1000, 2)}
          unit="kHz"
          accent
        />
        <Stat label={t.pulseFreq} value={fmtNum(pulseFreq, 0)} unit="pps" />
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {t.chartTitle}
        </div>
        <LineChart
          series={[
            { points: rpmLine, color: PALETTE.indigo, label: t.motorRpmSeries },
            { points: freqLine, color: PALETTE.emerald, label: t.pulseFreqSeries },
          ]}
          xMin={0}
          xMax={vMax}
          markerX={v}
          xUnit={t.xFeed}
          height={220}
        />
      </div>

      <p className="text-xs text-zinc-500">{t.note}</p>
    </div>
  );
}
