import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";

const R3 = Math.sqrt(3);

export default function ThreePhaseTool() {
  const [mode, setMode] = useState<"i2p" | "p2i">("i2p");
  const [volt, setVolt] = useState("380"); // 선간전압 V
  const [pf, setPf] = useState("0.85"); // 역률
  const [current, setCurrent] = useState("10"); // A
  const [power, setPower] = useState("5"); // kW

  const V = Number(volt);
  const cos = Number(pf);

  let I: number, Pw: number;
  if (mode === "i2p") {
    I = Number(current);
    Pw = (R3 * V * I * cos) / 1000; // kW
  } else {
    Pw = Number(power);
    I = V * cos === 0 ? 0 : (Pw * 1000) / (R3 * V * cos);
  }
  const S = (R3 * V * I) / 1000; // kVA
  const Q = Math.sqrt(Math.max(0, S * S - Pw * Pw)); // kVAR

  return (
    <div className="space-y-5">
      <Field label="계산 방향">
        <div className="flex gap-2">
          {(
            [
              ["i2p", "전류 → 전력"],
              ["p2i", "전력 → 전류"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-2 text-sm ${
                m === mode
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="선간전압" hint="V">
          <TextInput
            mono
            value={volt}
            onChange={(e) => setVolt(e.target.value)}
          />
        </Field>
        <Field label="역률 (cosθ)">
          <TextInput mono value={pf} onChange={(e) => setPf(e.target.value)} />
        </Field>
        {mode === "i2p" ? (
          <Field label="선전류" hint="A">
            <TextInput
              mono
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
        ) : (
          <Field label="유효전력" hint="kW">
            <TextInput
              mono
              value={power}
              onChange={(e) => setPower(e.target.value)}
            />
          </Field>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {mode === "i2p" ? (
          <Stat label="유효전력 P" value={fmtNum(Pw, 3)} unit="kW" accent />
        ) : (
          <Stat label="선전류 I" value={fmtNum(I, 2)} unit="A" accent />
        )}
        <Stat label="피상전력 S" value={fmtNum(S, 3)} unit="kVA" />
        <Stat label="무효전력 Q" value={fmtNum(Q, 3)} unit="kVAR" />
        <Stat label="마력 환산" value={fmtNum(Pw / 0.7457, 2)} unit="HP" />
      </div>

      <p className="text-xs text-zinc-500">
        3상: P = √3 × V<sub>line</sub> × I × cosθ. S = √3 × V × I.
      </p>
    </div>
  );
}
