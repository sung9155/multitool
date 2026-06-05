import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";

type Mode = "rotary" | "pulley" | "screw";

export default function EncoderTool() {
  const [ppr, setPpr] = useState("2500"); // 엔코더 기본 PPR
  const [mult, setMult] = useState<1 | 2 | 4>(4); // 체배 (A/B 직교 4체배)
  const [mode, setMode] = useState<Mode>("rotary");
  const [dim, setDim] = useState("60"); // 풀리경 또는 리드 mm
  const [maxFreq, setMaxFreq] = useState("200"); // 카운터 최대 응답 kHz

  const P = Number(ppr);
  const counts = P * mult; // 체배 후 카운트/회전
  const degPerCount = counts === 0 ? 0 : 360 / counts;
  const arcsec = degPerCount * 3600;

  // 선형 1회전 이송거리 mm
  const travelPerRev =
    mode === "pulley" ? Math.PI * Number(dim) : Number(dim); // screw=lead
  const mmPerCount = counts === 0 ? 0 : travelPerRev / counts;

  // 최대 회전수: freq = rpm/60 × counts → rpm = freq×60/counts
  const fHz = Number(maxFreq) * 1000;
  const maxRpm = counts === 0 ? 0 : (fHz * 60) / counts;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="엔코더 PPR" hint="기본 펄스/회전">
          <TextInput mono value={ppr} onChange={(e) => setPpr(e.target.value)} />
        </Field>
        <Field label="체배 (逓倍)" hint="A/B 직교 = 4">
          <div className="flex gap-2">
            {([1, 2, 4] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMult(m)}
                className={`rounded-md px-4 py-2 text-sm ${
                  m === mult
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {m}체배
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label="체배 후 분해능"
          value={fmtNum(counts, 0)}
          unit="counts/회전"
          accent
        />
        <Stat label="각도 분해능" value={fmtNum(degPerCount, 5)} unit="°/count" />
        <Stat label="각도 분해능" value={fmtNum(arcsec, 2)} unit="arc-sec" />
        <Stat
          label="최대 회전수"
          value={fmtNum(maxRpm, 0)}
          unit="rpm"
          accent
        />
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          선형 환산 (옵션)
        </div>
        <Field label="측정 방식">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["rotary", "회전만"],
                ["pulley", "풀리/롤러 (외경)"],
                ["screw", "볼스크류 (리드)"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-sm ${
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

        {mode !== "rotary" && (
          <div className="mt-3 space-y-3">
            <Field
              label={mode === "pulley" ? "풀리/롤러 외경" : "볼스크류 리드"}
              hint="mm"
            >
              <TextInput
                mono
                value={dim}
                onChange={(e) => setDim(e.target.value)}
                className="w-40"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat
                label="선형 분해능"
                value={fmtNum(mmPerCount * 1000, 3)}
                unit="µm/count"
                accent
              />
              <Stat
                label="1회전 이송"
                value={fmtNum(travelPerRev, 3)}
                unit="mm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <Field label="카운터 최대 응답주파수" hint="kHz (체배 후 기준)">
          <TextInput
            mono
            value={maxFreq}
            onChange={(e) => setMaxFreq(e.target.value)}
            className="w-40"
          />
        </Field>
      </div>

      <p className="text-xs text-zinc-500">
        분해능 = PPR × 체배. 각도 = 360 ÷ 분해능. 선형 = 1회전이송 ÷ 분해능.
        최대회전수 = 응답주파수 × 60 ÷ 분해능.
      </p>
    </div>
  );
}
