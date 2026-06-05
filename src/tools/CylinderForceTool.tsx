import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";

export default function CylinderForceTool() {
  const [bore, setBore] = useState("32"); // mm
  const [rod, setRod] = useState("12"); // mm
  const [pressure, setPressure] = useState("0.5"); // MPa
  const [unit, setUnit] = useState<"MPa" | "bar">("MPa");
  const [eff, setEff] = useState("100"); // 부하율 %

  const D = Number(bore);
  const d = Number(rod);
  const pMPa = unit === "MPa" ? Number(pressure) : Number(pressure) * 0.1;
  const k = Number(eff) / 100;

  const areaBore = (Math.PI / 4) * D * D; // mm²
  const areaRod = (Math.PI / 4) * d * d;
  const areaAnnulus = areaBore - areaRod;

  // P[MPa]=N/mm² → F[N] = P * Area
  const pushN = pMPa * areaBore * k;
  const pullN = pMPa * areaAnnulus * k;
  const toKgf = (n: number) => n / 9.80665;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="실린더 보어경 (내경)" hint="mm">
          <TextInput
            mono
            value={bore}
            onChange={(e) => setBore(e.target.value)}
          />
        </Field>
        <Field label="로드경" hint="mm">
          <TextInput mono value={rod} onChange={(e) => setRod(e.target.value)} />
        </Field>
        <Field label="공급압력">
          <TextInput
            mono
            value={pressure}
            onChange={(e) => setPressure(e.target.value)}
          />
        </Field>
        <Field label="압력 단위">
          <div className="flex gap-2">
            {(["MPa", "bar"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`rounded-md px-3 py-2 text-sm ${
                  u === unit
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Field>
        <Field label="부하율 (효율)" hint="% — 보통 50~70 적용">
          <TextInput
            mono
            value={eff}
            onChange={(e) => setEff(e.target.value)}
            className="w-32"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="전진 추력 (Push)" value={fmtNum(pushN, 1)} unit="N" accent />
        <Stat label="전진 추력" value={fmtNum(toKgf(pushN), 2)} unit="kgf" />
        <Stat label="후진 추력 (Pull)" value={fmtNum(pullN, 1)} unit="N" accent />
        <Stat label="후진 추력" value={fmtNum(toKgf(pullN), 2)} unit="kgf" />
      </div>

      <p className="text-xs text-zinc-500">
        Push = P × (π/4 × 보어²) × 부하율. Pull 은 로드 단면적 제외. P 는 MPa(=
        N/mm²) 환산값 적용.
      </p>
    </div>
  );
}
