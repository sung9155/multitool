import { useState } from "react";
import { Field, TextInput, Stat, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "구동/종동 풀리경과 축간거리로 벨트 길이·속도비·벨트속도를 계산합니다.",
    d1: "구동 풀리경 D1 (mm)",
    d2: "종동 풀리경 D2 (mm)",
    center: "축간거리 C (mm)",
    rpm: "구동 회전수 (rpm)",
    beltLen: "벨트 길이",
    ratio: "속도비",
    drivenRpm: "종동 회전수",
    beltSpeed: "벨트 속도",
    wrap: "접촉각(구동)",
  },
  en: {
    intro: "Compute belt length, speed ratio & belt speed from pulley diameters and center distance.",
    d1: "Driver pulley D1 (mm)",
    d2: "Driven pulley D2 (mm)",
    center: "Center distance C (mm)",
    rpm: "Driver speed (rpm)",
    beltLen: "Belt length",
    ratio: "Speed ratio",
    drivenRpm: "Driven speed",
    beltSpeed: "Belt speed",
    wrap: "Wrap angle (driver)",
  },
  zh: {
    intro: "根据主/从动轮直径和中心距计算皮带长度、速比和皮带速度。",
    d1: "主动轮 D1 (mm)",
    d2: "从动轮 D2 (mm)",
    center: "中心距 C (mm)",
    rpm: "主动转速 (rpm)",
    beltLen: "皮带长度",
    ratio: "速比",
    drivenRpm: "从动转速",
    beltSpeed: "皮带速度",
    wrap: "包角(主动)",
  },
} as const;

export default function BeltPulleyTool() {
  const t = TEXT[useLang()];
  const [d1, setD1] = useState("100");
  const [d2, setD2] = useState("200");
  const [c, setC] = useState("400");
  const [rpm, setRpm] = useState("1450");

  const D1 = Number(d1), D2 = Number(d2), C = Number(c);
  const beltLen = 2 * C + (Math.PI / 2) * (D1 + D2) + ((D2 - D1) ** 2) / (4 * C);
  const ratio = D1 !== 0 ? D2 / D1 : 0;
  const drivenRpm = ratio !== 0 ? Number(rpm) / ratio : 0;
  const beltSpeed = (Math.PI * D1 * Number(rpm)) / 60000; // m/s (D mm)
  const wrap = 180 - 2 * (Math.asin((D2 - D1) / (2 * C)) * 180) / Math.PI;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.d1}>
          <TextInput mono inputMode="decimal" value={d1} onChange={(e) => setD1(e.target.value)} />
        </Field>
        <Field label={t.d2}>
          <TextInput mono inputMode="decimal" value={d2} onChange={(e) => setD2(e.target.value)} />
        </Field>
        <Field label={t.center}>
          <TextInput mono inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} />
        </Field>
        <Field label={t.rpm}>
          <TextInput mono inputMode="decimal" value={rpm} onChange={(e) => setRpm(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label={t.beltLen} value={fmtNum(beltLen, 1)} unit="mm" accent />
        <Stat label={t.ratio} value={`${fmtNum(ratio, 3)} : 1`} />
        <Stat label={t.drivenRpm} value={fmtNum(drivenRpm, 1)} unit="rpm" accent />
        <Stat label={t.beltSpeed} value={fmtNum(beltSpeed, 2)} unit="m/s" />
        <Stat label={t.wrap} value={fmtNum(wrap, 1)} unit="°" />
      </div>
    </div>
  );
}
