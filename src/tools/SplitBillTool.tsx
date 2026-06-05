import { useState } from "react";
import { Field, Stat, TextInput } from "../components/ui";
import { Bars, PALETTE } from "../components/charts";

const won = (n: number) =>
  Number.isFinite(n) ? Math.round(n).toLocaleString("ko-KR") + " 원" : "—";

export default function SplitBillTool() {
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
        <Field label="총액 (원)">
          <TextInput
            mono
            inputMode="numeric"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </Field>
        <Field label="인원수">
          <TextInput
            mono
            inputMode="numeric"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </Field>
        <Field label={`팁 (${tipV || 0}%)`}>
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
        <Stat label="팁 금액" value={won(tipAmount)} />
        <Stat label="총 지불액" value={won(grandTotal)} />
        <Stat label={`1인당 (${peopleV}명)`} value={won(perPerson)} accent />
      </div>

      <Bars
        items={[
          {
            label: "1인당 금액",
            value: perPerson,
            color: PALETTE.indigo,
            display: won(perPerson),
          },
          {
            label: "총 지불액",
            value: grandTotal,
            color: PALETTE.emerald,
            display: won(grandTotal),
          },
        ]}
      />
    </div>
  );
}
