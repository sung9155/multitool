import { useState } from "react";
import { Field, TextInput, Stat, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "제어반 내부 발열과 허용 온도상승으로 필요 냉각 용량·팬 풍량을 추정합니다.",
    heat: "내부 발열량 (W)",
    area: "방열 표면적 (m²)",
    dt: "허용 온도차 ΔT (K)",
    ambient: "외기 온도 (℃)",
    k: "방열계수 k (W/m²K)",
    natural: "자연 방열량",
    needCool: "필요 추가 냉각",
    fanFlow: "필요 팬 풍량",
    verdict: "판정",
    okNatural: "자연방열로 충분",
    needFan: "팬/쿨러 필요",
  },
  en: {
    intro: "Estimate required cooling capacity & fan airflow from internal heat and allowed temp rise.",
    heat: "Internal heat (W)",
    area: "Dissipating area (m²)",
    dt: "Allowed ΔT (K)",
    ambient: "Ambient temp (℃)",
    k: "Heat coeff k (W/m²K)",
    natural: "Natural dissipation",
    needCool: "Extra cooling needed",
    fanFlow: "Required fan airflow",
    verdict: "Verdict",
    okNatural: "Natural cooling is enough",
    needFan: "Fan/cooler required",
  },
  zh: {
    intro: "根据内部发热和允许温升估算所需冷却容量和风扇风量。",
    heat: "内部发热 (W)",
    area: "散热表面积 (m²)",
    dt: "允许温差 ΔT (K)",
    ambient: "环境温度 (℃)",
    k: "散热系数 k (W/m²K)",
    natural: "自然散热量",
    needCool: "需额外冷却",
    fanFlow: "所需风扇风量",
    verdict: "判定",
    okNatural: "自然散热即可",
    needFan: "需要风扇/冷却器",
  },
} as const;

export default function PanelCoolingTool() {
  const t = TEXT[useLang()];
  const [heat, setHeat] = useState("300");
  const [area, setArea] = useState("2");
  const [dt, setDt] = useState("15");
  const [k, setK] = useState("5.5");

  const natural = Number(k) * Number(area) * Number(dt); // W
  const needCool = Math.max(0, Number(heat) - natural);
  // 공기 비열로 풍량 환산: Q = P / (ρ·cp·ΔT) → m³/s, ρcp≈1.2 kJ/m³K
  const flow_m3s = Number(dt) > 0 ? needCool / (1200 * Number(dt)) : 0;
  const flow_m3h = flow_m3s * 3600;
  const ok = needCool <= 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.heat}>
          <TextInput mono inputMode="decimal" value={heat} onChange={(e) => setHeat(e.target.value)} />
        </Field>
        <Field label={t.area}>
          <TextInput mono inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} />
        </Field>
        <Field label={t.dt}>
          <TextInput mono inputMode="decimal" value={dt} onChange={(e) => setDt(e.target.value)} />
        </Field>
        <Field label={t.k}>
          <TextInput mono inputMode="decimal" value={k} onChange={(e) => setK(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label={t.natural} value={fmtNum(natural, 1)} unit="W" />
        <Stat label={t.needCool} value={fmtNum(needCool, 1)} unit="W" accent />
        <Stat label={t.fanFlow} value={fmtNum(flow_m3h, 1)} unit="m³/h" accent />
      </div>
      <div
        className={`rounded-md border p-3 text-sm font-medium ${
          ok
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        }`}
      >
        {t.verdict}: {ok ? t.okNatural : t.needFan}
      </div>
    </div>
  );
}
