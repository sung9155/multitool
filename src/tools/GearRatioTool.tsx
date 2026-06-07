import { Field, TextInput, Stat, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";
import { Bars, ChartCard } from "../components/charts";

const TEXT = {
  ko: {
    intro: "입력 회전수·토크와 기어비로 출력측 값을 계산합니다 (효율 반영).",
    inRpm: "입력 회전수 (rpm)",
    inTorque: "입력 토크 (N·m)",
    ratio: "감속비 (i)",
    eff: "효율 (%)",
    outRpm: "출력 회전수",
    outTorque: "출력 토크",
    outPower: "출력 동력",
    speedRatio: "속도비",
    speedCompare: "회전수 비교",
    torqueCompare: "토크 비교",
    inputSide: "입력",
    outputSide: "출력",
  },
  en: {
    intro: "Compute output side from input speed/torque and gear ratio (with efficiency).",
    inRpm: "Input speed (rpm)",
    inTorque: "Input torque (N·m)",
    ratio: "Reduction ratio (i)",
    eff: "Efficiency (%)",
    outRpm: "Output speed",
    outTorque: "Output torque",
    outPower: "Output power",
    speedRatio: "Speed ratio",
    speedCompare: "Speed comparison",
    torqueCompare: "Torque comparison",
    inputSide: "Input",
    outputSide: "Output",
  },
  zh: {
    intro: "根据输入转速/转矩和减速比计算输出侧数值（含效率）。",
    inRpm: "输入转速 (rpm)",
    inTorque: "输入转矩 (N·m)",
    ratio: "减速比 (i)",
    eff: "效率 (%)",
    outRpm: "输出转速",
    outTorque: "输出转矩",
    outPower: "输出功率",
    speedRatio: "速度比",
    speedCompare: "转速对比",
    torqueCompare: "转矩对比",
    inputSide: "输入",
    outputSide: "输出",
  },
} as const;

export default function GearRatioTool() {
  const t = TEXT[useLang()];
  const [rpm, setRpm] = useToolState("rpm", "1800");
  const [torque, setTorque] = useToolState("tq", "1");
  const [ratio, setRatio] = useToolState("i", "10");
  const [eff, setEff] = useToolState("eff", "95");

  const i = Number(ratio);
  const e = Number(eff) / 100;
  const outRpm = i !== 0 ? Number(rpm) / i : 0;
  const outTorque = Number(torque) * i * e;
  const outPower = (outTorque * outRpm * 2 * Math.PI) / 60;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.inRpm}>
          <TextInput mono inputMode="decimal" value={rpm} onChange={(e) => setRpm(e.target.value)} />
        </Field>
        <Field label={t.inTorque}>
          <TextInput mono inputMode="decimal" value={torque} onChange={(e) => setTorque(e.target.value)} />
        </Field>
        <Field label={t.ratio}>
          <TextInput mono inputMode="decimal" value={ratio} onChange={(e) => setRatio(e.target.value)} />
        </Field>
        <Field label={t.eff}>
          <TextInput mono inputMode="decimal" value={eff} onChange={(e) => setEff(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.outRpm} value={fmtNum(outRpm, 2)} unit="rpm" accent />
        <Stat label={t.outTorque} value={fmtNum(outTorque, 3)} unit="N·m" accent />
        <Stat label={t.outPower} value={fmtNum(outPower, 1)} unit="W" />
        <Stat label={t.speedRatio} value={`1 : ${fmtNum(i, 3)}`} />
      </div>
      <ChartCard title={t.speedCompare}>
        <Bars
          items={[
            { label: t.inputSide, value: Number(rpm), display: `${fmtNum(Number(rpm), 1)} rpm` },
            { label: t.outputSide, value: outRpm, display: `${fmtNum(outRpm, 1)} rpm` },
          ]}
        />
      </ChartCard>
      <ChartCard title={t.torqueCompare}>
        <Bars
          items={[
            { label: t.inputSide, value: Number(torque), display: `${fmtNum(Number(torque), 3)} N·m` },
            { label: t.outputSide, value: outTorque, display: `${fmtNum(outTorque, 3)} N·m` },
          ]}
        />
      </ChartCard>
    </div>
  );
}
