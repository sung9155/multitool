import { useState } from "react";
import { Field, Stat, TextInput } from "../components/ui";
import { Bars, PALETTE } from "../components/charts";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    totalLabel: "총액 (원)",
    people: "인원수",
    tip: (p: number) => `팁 (${p}%)`,
    tipAmount: "팁 금액",
    grandTotal: "총 지불액",
    perPerson: (p: number) => `1인당 (${p}명)`,
    perPersonBar: "1인당 금액",
    grandTotalBar: "총 지불액",
    currency: " 원",
    locale: "ko-KR",
  },
  en: {
    totalLabel: "Total (KRW)",
    people: "People",
    tip: (p: number) => `Tip (${p}%)`,
    tipAmount: "Tip amount",
    grandTotal: "Grand total",
    perPerson: (p: number) => `Per person (${p})`,
    perPersonBar: "Per person",
    grandTotalBar: "Grand total",
    currency: " KRW",
    locale: "en-US",
  },
  zh: {
    totalLabel: "总额 (元)",
    people: "人数",
    tip: (p: number) => `小费 (${p}%)`,
    tipAmount: "小费金额",
    grandTotal: "总支付额",
    perPerson: (p: number) => `每人 (${p}人)`,
    perPersonBar: "每人金额",
    grandTotalBar: "总支付额",
    currency: " 元",
    locale: "zh-CN",
  },
} as const;

export default function SplitBillTool() {
  const t = TEXT[useLang()];
  const won = (n: number) =>
    Number.isFinite(n) ? Math.round(n).toLocaleString(t.locale) + t.currency : "—";

  const [total, setTotal] = useState("80000");
  const [people, setPeople] = useState("4");
  const [tip, setTip] = useState("10");

  const totalV = Number(total.replace(/,/g, ""));
  const peopleV = Math.max(1, Math.floor(Number(people)) || 1);
  const tipV = Number(tip);

  const tipAmount = (totalV * tipV) / 100;
  const grandTotal = totalV + tipAmount;
  const perPerson = grandTotal / peopleV;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t.totalLabel}>
          <TextInput
            mono
            inputMode="numeric"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </Field>
        <Field label={t.people}>
          <TextInput
            mono
            inputMode="numeric"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </Field>
        <Field label={t.tip(tipV || 0)}>
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={Number.isFinite(tipV) ? tipV : 0}
            onChange={(e) => setTip(e.target.value)}
            className="w-full accent-indigo-600"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t.tipAmount} value={won(tipAmount)} />
        <Stat label={t.grandTotal} value={won(grandTotal)} />
        <Stat label={t.perPerson(peopleV)} value={won(perPerson)} accent />
      </div>

      <Bars
        items={[
          {
            label: t.perPersonBar,
            value: perPerson,
            color: PALETTE.indigo,
            display: won(perPerson),
          },
          {
            label: t.grandTotalBar,
            value: grandTotal,
            color: PALETTE.emerald,
            display: won(grandTotal),
          },
        ]}
      />
    </div>
  );
}
