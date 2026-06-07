import { useState } from "react";
import { Field, TextInput, Stat, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "부하 토크와 가감속 토크를 합산해 필요 모터 토크·출력을 추정합니다.",
    loadTorque: "부하 토크 (N·m)",
    inertia: "부하 관성 J (kg·m²)",
    speed: "목표 회전수 (rpm)",
    accelTime: "가속 시간 (s)",
    safety: "안전율",
    accelTorque: "가속 토크",
    totalTorque: "필요 토크",
    angAccel: "각가속도",
    power: "필요 출력",
    rated: "추천 정격(안전율 적용)",
  },
  en: {
    intro: "Sum load torque and accel torque to estimate required motor torque & power.",
    loadTorque: "Load torque (N·m)",
    inertia: "Load inertia J (kg·m²)",
    speed: "Target speed (rpm)",
    accelTime: "Accel time (s)",
    safety: "Safety factor",
    accelTorque: "Accel torque",
    totalTorque: "Required torque",
    angAccel: "Angular accel",
    power: "Required power",
    rated: "Recommended rating (w/ SF)",
  },
  zh: {
    intro: "将负载转矩与加减速转矩相加，估算所需电机转矩和功率。",
    loadTorque: "负载转矩 (N·m)",
    inertia: "负载惯量 J (kg·m²)",
    speed: "目标转速 (rpm)",
    accelTime: "加速时间 (s)",
    safety: "安全系数",
    accelTorque: "加速转矩",
    totalTorque: "所需转矩",
    angAccel: "角加速度",
    power: "所需功率",
    rated: "推荐额定(含安全系数)",
  },
} as const;

export default function MotorSizingTool() {
  const t = TEXT[useLang()];
  const [tl, setTl] = useState("2");
  const [j, setJ] = useState("0.01");
  const [rpm, setRpm] = useState("1500");
  const [ta, setTa] = useState("0.2");
  const [sf, setSf] = useState("1.5");

  const n = Number(rpm);
  const omega = (n * 2 * Math.PI) / 60; // rad/s
  const alpha = Number(ta) > 0 ? omega / Number(ta) : 0; // rad/s²
  const accelTorque = Number(j) * alpha;
  const total = Number(tl) + accelTorque;
  const power = total * omega; // W (peak at speed)
  const rated = power * Number(sf);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.loadTorque}>
          <TextInput mono inputMode="decimal" value={tl} onChange={(e) => setTl(e.target.value)} />
        </Field>
        <Field label={t.inertia}>
          <TextInput mono inputMode="decimal" value={j} onChange={(e) => setJ(e.target.value)} />
        </Field>
        <Field label={t.speed}>
          <TextInput mono inputMode="decimal" value={rpm} onChange={(e) => setRpm(e.target.value)} />
        </Field>
        <Field label={t.accelTime}>
          <TextInput mono inputMode="decimal" value={ta} onChange={(e) => setTa(e.target.value)} />
        </Field>
        <Field label={t.safety}>
          <TextInput mono inputMode="decimal" value={sf} onChange={(e) => setSf(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label={t.angAccel} value={fmtNum(alpha, 2)} unit="rad/s²" />
        <Stat label={t.accelTorque} value={fmtNum(accelTorque, 3)} unit="N·m" />
        <Stat label={t.totalTorque} value={fmtNum(total, 3)} unit="N·m" accent />
        <Stat label={t.power} value={fmtNum(power, 1)} unit="W" />
        <Stat label={t.power} value={fmtNum(power / 1000, 3)} unit="kW" />
        <Stat label={t.rated} value={fmtNum(rated, 1)} unit="W" accent />
      </div>
    </div>
  );
}
