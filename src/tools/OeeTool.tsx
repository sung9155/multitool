import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";

export default function OeeTool() {
  const [planned, setPlanned] = useState("480"); // 계획 가동시간 min
  const [downtime, setDowntime] = useState("30"); // 정지시간 min
  const [idealCt, setIdealCt] = useState("30"); // 이론 CT s/ea
  const [total, setTotal] = useState("780"); // 총 생산수
  const [defect, setDefect] = useState("12"); // 불량수

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
        <Field label="계획 가동시간" hint="분">
          <TextInput
            mono
            value={planned}
            onChange={(e) => setPlanned(e.target.value)}
          />
        </Field>
        <Field label="정지시간 (비계획)" hint="분">
          <TextInput
            mono
            value={downtime}
            onChange={(e) => setDowntime(e.target.value)}
          />
        </Field>
        <Field label="이론 사이클타임" hint="초/개">
          <TextInput
            mono
            value={idealCt}
            onChange={(e) => setIdealCt(e.target.value)}
          />
        </Field>
        <Field label="총 생산수" hint="개">
          <TextInput
            mono
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </Field>
        <Field label="불량수" hint="개">
          <TextInput
            mono
            value={defect}
            onChange={(e) => setDefect(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="가동률 (Availability)" value={pct(availability)} unit="%" />
        <Stat label="성능 (Performance)" value={pct(performance)} unit="%" />
        <Stat label="양품률 (Quality)" value={pct(quality)} unit="%" />
      </div>
      <Stat label="OEE 설비종합효율" value={pct(oee)} unit="%" accent />

      <p className="text-xs text-zinc-500">
        OEE = 가동률 × 성능 × 양품률. 성능 = (이론CT × 생산수) ÷ 실가동시간.
        세계 최고 수준 ≈ 85%.
      </p>
    </div>
  );
}
