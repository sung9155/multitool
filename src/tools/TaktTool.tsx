import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { Bars, PALETTE } from "../components/charts";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    cycleTime: "사이클타임 (CT)",
    secPerEa: "초/개",
    operatingTime: "가동시간",
    hPerDay: "시간/일",
    availability: "가동률",
    eaPerH: "개/h",
    eaPerDay: "개/일",
    theoUph: "이론 UPH",
    realUph: "실 UPH (가동률)",
    dailyOutput: "일 생산량",
    targetToTakt: "목표 수량 → 필요 택트타임",
    targetQty: "목표 수량",
    allowedTakt: "허용 택트타임",
    ctMargin: "현재 CT 여유",
    meet: "충족 ✓",
    short: "부족 ✗",
    cycleTimeCt: "사이클타임 CT",
    allowedTaktShort: "허용 택트",
    desc: "UPH = 3600 ÷ CT × 가동률. 허용택트 = (가동시간 × 가동률) ÷ 목표수량.",
  },
  en: {
    cycleTime: "Cycle time (CT)",
    secPerEa: "s/ea",
    operatingTime: "Operating time",
    hPerDay: "h/day",
    availability: "Availability",
    eaPerH: "ea/h",
    eaPerDay: "ea/day",
    theoUph: "Theoretical UPH",
    realUph: "Actual UPH (availability)",
    dailyOutput: "Daily output",
    targetToTakt: "Target qty → required takt time",
    targetQty: "Target quantity",
    allowedTakt: "Allowed takt time",
    ctMargin: "Current CT margin",
    meet: "Met ✓",
    short: "Short ✗",
    cycleTimeCt: "Cycle time CT",
    allowedTaktShort: "Allowed takt",
    desc: "UPH = 3600 ÷ CT × availability. Allowed takt = (operating time × availability) ÷ target qty.",
  },
  zh: {
    cycleTime: "节拍 (CT)",
    secPerEa: "秒/个",
    operatingTime: "运行时间",
    hPerDay: "小时/天",
    availability: "稼动率",
    eaPerH: "个/h",
    eaPerDay: "个/天",
    theoUph: "理论 UPH",
    realUph: "实际 UPH (稼动率)",
    dailyOutput: "日产量",
    targetToTakt: "目标数量 → 所需节拍时间",
    targetQty: "目标数量",
    allowedTakt: "允许节拍时间",
    ctMargin: "当前 CT 余量",
    meet: "满足 ✓",
    short: "不足 ✗",
    cycleTimeCt: "节拍 CT",
    allowedTaktShort: "允许节拍",
    desc: "UPH = 3600 ÷ CT × 稼动率。允许节拍 = (运行时间 × 稼动率) ÷ 目标数量。",
  },
} as const;

export default function TaktTool() {
  const t = TEXT[useLang()];
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
        <Field label={t.cycleTime} hint={t.secPerEa}>
          <TextInput mono value={ct} onChange={(e) => setCt(e.target.value)} />
        </Field>
        <Field label={t.operatingTime} hint={t.hPerDay}>
          <TextInput
            mono
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </Field>
        <Field label={t.availability} hint="%">
          <TextInput
            mono
            value={avail}
            onChange={(e) => setAvail(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t.theoUph} value={fmtNum(uphTheo, 1)} unit={t.eaPerH} />
        <Stat label={t.realUph} value={fmtNum(uphReal, 1)} unit={t.eaPerH} accent />
        <Stat label={t.dailyOutput} value={fmtNum(dailyOut, 0)} unit={t.eaPerDay} accent />
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {t.targetToTakt}
        </div>
        <Field label={t.targetQty} hint={t.eaPerDay}>
          <TextInput
            mono
            value={demand}
            onChange={(e) => setDemand(e.target.value)}
          />
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat
            label={t.allowedTakt}
            value={fmtNum(taktNeeded, 2)}
            unit={t.secPerEa}
            accent
          />
          <Stat
            label={t.ctMargin}
            value={CT <= taktNeeded ? t.meet : t.short}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Bars
            items={[
              { label: t.cycleTimeCt, value: CT, display: fmtNum(CT, 2) + "s", color: CT <= taktNeeded ? PALETTE.emerald : PALETTE.rose },
              { label: t.allowedTaktShort, value: taktNeeded, display: fmtNum(taktNeeded, 2) + "s", color: PALETTE.indigo },
            ]}
          />
          <Bars
            items={[
              { label: t.dailyOutput, value: dailyOut, display: fmtNum(dailyOut, 0), color: dailyOut >= D ? PALETTE.emerald : PALETTE.rose },
              { label: t.targetQty, value: D, display: fmtNum(D, 0), color: PALETTE.indigo },
            ]}
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500">{t.desc}</p>
    </div>
  );
}
