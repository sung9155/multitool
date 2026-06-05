import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";

export default function TaktTool() {
  const [ct, setCt] = useState("4.5"); // 사이클타임 s/ea
  const [hours, setHours] = useState("20"); // 가동시간 h/day
  const [avail, setAvail] = useState("90"); // 가동률 %
  const [demand, setDemand] = useState("10000"); // 목표 수량 /day

  const CT = Number(ct);
  const H = Number(hours);
  const a = Number(avail) / 100;
  const D = Number(demand);

  const uphTheo = CT === 0 ? 0 : 3600 / CT; // 이론 UPH
  const uphReal = uphTheo * a; // 가동률 반영
  const dailyOut = uphReal * H; // 일 생산량

  // 목표수량 충족 위한 택트타임 (가동시간 내)
  const availSec = H * 3600 * a;
  const taktNeeded = D === 0 ? 0 : availSec / D; // s/ea 허용 택트

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="사이클타임 (CT)" hint="초/개">
          <TextInput mono value={ct} onChange={(e) => setCt(e.target.value)} />
        </Field>
        <Field label="가동시간" hint="시간/일">
          <TextInput
            mono
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </Field>
        <Field label="가동률" hint="%">
          <TextInput
            mono
            value={avail}
            onChange={(e) => setAvail(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="이론 UPH" value={fmtNum(uphTheo, 1)} unit="개/h" />
        <Stat label="실 UPH (가동률)" value={fmtNum(uphReal, 1)} unit="개/h" accent />
        <Stat label="일 생산량" value={fmtNum(dailyOut, 0)} unit="개/일" accent />
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          목표 수량 → 필요 택트타임
        </div>
        <Field label="목표 수량" hint="개/일">
          <TextInput
            mono
            value={demand}
            onChange={(e) => setDemand(e.target.value)}
          />
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat
            label="허용 택트타임"
            value={fmtNum(taktNeeded, 2)}
            unit="초/개"
            accent
          />
          <Stat
            label="현재 CT 여유"
            value={CT <= taktNeeded ? "충족 ✓" : "부족 ✗"}
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        UPH = 3600 ÷ CT × 가동률. 허용택트 = (가동시간 × 가동률) ÷ 목표수량.
      </p>
    </div>
  );
}
