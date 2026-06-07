import { useState } from "react";
import { Field, TextInput, Stat, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "유량과 관 내경으로 유속·레이놀즈수·압력손실(Darcy-Weisbach)을 추정합니다. (물 기준)",
    flow: "유량 Q (L/min)",
    dia: "관 내경 (mm)",
    len: "배관 길이 (m)",
    rough: "조도 ε (mm)",
    velocity: "유속",
    area: "단면적",
    reynolds: "레이놀즈수",
    regime: "유동",
    headloss: "수두손실",
    ploss: "압력손실",
    laminar: "층류",
    turbulent: "난류",
    trans: "천이",
  },
  en: {
    intro: "Estimate velocity, Reynolds number & pressure loss (Darcy-Weisbach) from flow and pipe ID. (water)",
    flow: "Flow Q (L/min)",
    dia: "Pipe ID (mm)",
    len: "Pipe length (m)",
    rough: "Roughness ε (mm)",
    velocity: "Velocity",
    area: "Cross-section",
    reynolds: "Reynolds",
    regime: "Regime",
    headloss: "Head loss",
    ploss: "Pressure loss",
    laminar: "Laminar",
    turbulent: "Turbulent",
    trans: "Transitional",
  },
  zh: {
    intro: "根据流量和管内径估算流速、雷诺数和压力损失（Darcy-Weisbach，以水为准）。",
    flow: "流量 Q (L/min)",
    dia: "管内径 (mm)",
    len: "管道长度 (m)",
    rough: "粗糙度 ε (mm)",
    velocity: "流速",
    area: "截面积",
    reynolds: "雷诺数",
    regime: "流态",
    headloss: "水头损失",
    ploss: "压力损失",
    laminar: "层流",
    turbulent: "湍流",
    trans: "过渡",
  },
} as const;

export default function FlowPipeTool() {
  const t = TEXT[useLang()];
  const [q, setQ] = useState("60");
  const [d, setD] = useState("25");
  const [len, setLen] = useState("10");
  const [rough, setRough] = useState("0.045");

  const rho = 998; // kg/m³
  const nu = 1.004e-6; // m²/s @20℃
  const Q = Number(q) / 60000; // m³/s
  const D = Number(d) / 1000; // m
  const area = Math.PI * (D / 2) ** 2;
  const v = area > 0 ? Q / area : 0;
  const Re = nu > 0 && D > 0 ? (v * D) / nu : 0;

  // 마찰계수 f
  let f = 0;
  if (Re > 0 && Re < 2300) f = 64 / Re;
  else if (Re >= 2300) {
    const eps = Number(rough) / 1000 / D;
    // Swamee-Jain
    f = 0.25 / Math.log10(eps / 3.7 + 5.74 / Re ** 0.9) ** 2;
  }
  const hf = D > 0 ? f * (Number(len) / D) * (v * v) / (2 * 9.80665) : 0;
  const dp = hf * rho * 9.80665; // Pa

  const regime =
    Re < 2300 ? t.laminar : Re < 4000 ? t.trans : t.turbulent;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.flow}>
          <TextInput mono inputMode="decimal" value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
        <Field label={t.dia}>
          <TextInput mono inputMode="decimal" value={d} onChange={(e) => setD(e.target.value)} />
        </Field>
        <Field label={t.len}>
          <TextInput mono inputMode="decimal" value={len} onChange={(e) => setLen(e.target.value)} />
        </Field>
        <Field label={t.rough}>
          <TextInput mono inputMode="decimal" value={rough} onChange={(e) => setRough(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label={t.velocity} value={fmtNum(v, 3)} unit="m/s" accent />
        <Stat label={t.area} value={fmtNum(area * 1e6, 1)} unit="mm²" />
        <Stat label={t.reynolds} value={fmtNum(Re, 0)} />
        <Stat label={t.regime} value={regime} />
        <Stat label={t.headloss} value={fmtNum(hf, 3)} unit="m" />
        <Stat label={t.ploss} value={fmtNum(dp / 1000, 2)} unit="kPa" accent />
      </div>
    </div>
  );
}
