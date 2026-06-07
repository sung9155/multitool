import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { Gauge, Bars, PALETTE } from "../components/charts";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    plannedTime: "계획 가동시간",
    min: "분",
    downtime: "정지시간 (비계획)",
    idealCt: "이론 사이클타임",
    secPerEa: "초/개",
    totalOutput: "총 생산수",
    ea: "개",
    defects: "불량수",
    availability: "가동률 (Availability)",
    performance: "성능 (Performance)",
    quality: "양품률 (Quality)",
    oeeGauge: "OEE 설비종합효율",
    availabilityShort: "가동률",
    performanceShort: "성능",
    qualityShort: "양품률",
    desc1: "OEE = 가동률 × 성능 × 양품률. 성능 = (이론CT × 생산수) ÷ 실가동시간.",
    desc2: "세계 최고 수준 ≈ 85%.",
  },
  en: {
    plannedTime: "Planned operating time",
    min: "min",
    downtime: "Downtime (unplanned)",
    idealCt: "Ideal cycle time",
    secPerEa: "s/ea",
    totalOutput: "Total output",
    ea: "ea",
    defects: "Defects",
    availability: "Availability",
    performance: "Performance",
    quality: "Quality",
    oeeGauge: "OEE Overall Equipment Effectiveness",
    availabilityShort: "Availability",
    performanceShort: "Performance",
    qualityShort: "Quality",
    desc1: "OEE = availability × performance × quality. Performance = (ideal CT × output) ÷ run time.",
    desc2: "World-class ≈ 85%.",
  },
  zh: {
    plannedTime: "计划运行时间",
    min: "分",
    downtime: "停机时间 (非计划)",
    idealCt: "理论节拍",
    secPerEa: "秒/个",
    totalOutput: "总产量",
    ea: "个",
    defects: "不良数",
    availability: "稼动率 (Availability)",
    performance: "性能 (Performance)",
    quality: "良品率 (Quality)",
    oeeGauge: "OEE 设备综合效率",
    availabilityShort: "稼动率",
    performanceShort: "性能",
    qualityShort: "良品率",
    desc1: "OEE = 稼动率 × 性能 × 良品率。性能 = (理论节拍 × 产量) ÷ 实际运行时间。",
    desc2: "世界顶级水平 ≈ 85%。",
  },
} as const;

export default function OeeTool() {
  const t = TEXT[useLang()];
  const [planned, setPlanned] = useToolState("planned", "480"); // 계획 가동시간 min
  const [downtime, setDowntime] = useToolState("downtime", "30"); // 정지시간 min
  const [idealCt, setIdealCt] = useToolState("idealCt", "30"); // 이론 CT s/ea
  const [total, setTotal] = useToolState("total", "780"); // 총 생산수
  const [defect, setDefect] = useToolState("defect", "12"); // 불량수

  const plan = Number(planned);
  const down = Number(downtime);
  const ct = Number(idealCt);
  const tot = Number(total);
  const ng = Number(defect);

  const runTime = plan - down; // 실가동 min
  const availability = plan === 0 ? 0 : runTime / plan;
  // 성능 = (이론CT × 생산수) / 실가동시간
  const performance = runTime === 0 ? 0 : (ct * tot) / (runTime * 60);
  const quality = tot === 0 ? 0 : (tot - ng) / tot;
  const oee = availability * performance * quality;

  const pct = (n: number) => fmtNum(n * 100, 1);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.plannedTime} hint={t.min}>
          <TextInput
            mono
            value={planned}
            onChange={(e) => setPlanned(e.target.value)}
          />
        </Field>
        <Field label={t.downtime} hint={t.min}>
          <TextInput
            mono
            value={downtime}
            onChange={(e) => setDowntime(e.target.value)}
          />
        </Field>
        <Field label={t.idealCt} hint={t.secPerEa}>
          <TextInput
            mono
            value={idealCt}
            onChange={(e) => setIdealCt(e.target.value)}
          />
        </Field>
        <Field label={t.totalOutput} hint={t.ea}>
          <TextInput
            mono
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </Field>
        <Field label={t.defects} hint={t.ea}>
          <TextInput
            mono
            value={defect}
            onChange={(e) => setDefect(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t.availability} value={pct(availability)} unit="%" />
        <Stat label={t.performance} value={pct(performance)} unit="%" />
        <Stat label={t.quality} value={pct(quality)} unit="%" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Gauge
          value={oee * 100}
          label={t.oeeGauge}
          color={oee >= 0.85 ? PALETTE.emerald : oee >= 0.6 ? PALETTE.amber : PALETTE.rose}
        />
        <Bars
          items={[
            { label: t.availabilityShort, value: availability * 100, display: pct(availability) + "%" },
            { label: t.performanceShort, value: performance * 100, display: pct(performance) + "%" },
            { label: t.qualityShort, value: quality * 100, display: pct(quality) + "%" },
            { label: "OEE", value: oee * 100, display: pct(oee) + "%", color: PALETTE.indigo },
          ]}
        />
      </div>

      <p className="text-xs text-zinc-500">
        {t.desc1} {t.desc2}
      </p>
    </div>
  );
}
