import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";

export default function BallscrewTool() {
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

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="볼스크류 리드" hint="mm/회전">
          <TextInput
            mono
            value={lead}
            onChange={(e) => setLead(e.target.value)}
          />
        </Field>
        <Field label="모터 1회전당 펄스" hint="지령분해능 PPR">
          <TextInput
            mono
            value={ppr}
            onChange={(e) => setPpr(e.target.value)}
          />
        </Field>
        <Field label="감속비 i" hint="모터:스크류">
          <TextInput
            mono
            value={gear}
            onChange={(e) => setGear(e.target.value)}
          />
        </Field>
        <Field label="목표 이송속도" hint="mm/s">
          <TextInput
            mono
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label="위치결정 분해능"
          value={fmtNum(resolutionMm * 1000, 4)}
          unit="µm/pulse"
          accent
        />
        <Stat
          label="분해능"
          value={fmtNum(resolutionMm, 6)}
          unit="mm/pulse"
        />
        <Stat label="모터 회전수" value={fmtNum(motorRpm, 1)} unit="rpm" accent />
        <Stat label="스크류 회전수" value={fmtNum(screwRpm, 1)} unit="rpm" />
        <Stat
          label="펄스 주파수"
          value={fmtNum(pulseFreq / 1000, 2)}
          unit="kHz"
          accent
        />
        <Stat label="펄스 주파수" value={fmtNum(pulseFreq, 0)} unit="pps" />
      </div>

      <p className="text-xs text-zinc-500">
        분해능 = 리드 ÷ (PPR × 감속비). 펄스주파수 = 이송속도 ÷ 분해능. 지령
        펄스(전자기어 후) 기준.
      </p>
    </div>
  );
}
