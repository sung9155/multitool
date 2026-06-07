import { Field, TextInput, Stat, ErrorText, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolStateJSON } from "../components/toolState";

const TEXT = {
  ko: {
    hint: "네 값(V·I·R·P) 중 정확히 2개만 입력하면 나머지를 계산합니다.",
    voltage: "전압 V",
    current: "전류 I",
    resistance: "저항 R",
    power: "전력 P",
    need2: "정확히 2개 값을 입력하세요.",
    bad: "0으로 나눌 수 없습니다 (입력값 확인).",
    summary: "요약",
    quantity: "값",
    valueCol: "결과",
    source: "구분",
    input: "입력",
    computed: "계산됨",
  },
  en: {
    hint: "Enter exactly 2 of the four (V·I·R·P) to compute the rest.",
    voltage: "Voltage V",
    current: "Current I",
    resistance: "Resistance R",
    power: "Power P",
    need2: "Enter exactly 2 values.",
    bad: "Division by zero (check inputs).",
    summary: "Summary",
    quantity: "Quantity",
    valueCol: "Value",
    source: "Source",
    input: "Input",
    computed: "Computed",
  },
  zh: {
    hint: "在 V·I·R·P 四个值中正好输入 2 个即可计算其余。",
    voltage: "电压 V",
    current: "电流 I",
    resistance: "电阻 R",
    power: "功率 P",
    need2: "请正好输入 2 个值。",
    bad: "除数为零（请检查输入）。",
    summary: "汇总",
    quantity: "量",
    valueCol: "数值",
    source: "来源",
    input: "输入",
    computed: "计算",
  },
} as const;

type K = "V" | "I" | "R" | "P";

function solve(v: Partial<Record<K, number>>): Record<K, number> | null {
  let { V, I, R, P } = v;
  // 반복적으로 가능한 식 적용
  for (let i = 0; i < 4; i++) {
    if (V === undefined && I !== undefined && R !== undefined) V = I * R;
    if (V === undefined && P !== undefined && I !== undefined && I !== 0) V = P / I;
    if (V === undefined && P !== undefined && R !== undefined) V = Math.sqrt(P * R);
    if (I === undefined && V !== undefined && R !== undefined && R !== 0) I = V / R;
    if (I === undefined && P !== undefined && V !== undefined && V !== 0) I = P / V;
    if (I === undefined && P !== undefined && R !== undefined && R !== 0) I = Math.sqrt(P / R);
    if (R === undefined && V !== undefined && I !== undefined && I !== 0) R = V / I;
    if (R === undefined && V !== undefined && P !== undefined && P !== 0) R = (V * V) / P;
    if (R === undefined && P !== undefined && I !== undefined && I !== 0) R = P / (I * I);
    if (P === undefined && V !== undefined && I !== undefined) P = V * I;
    if (P === undefined && I !== undefined && R !== undefined) P = I * I * R;
    if (P === undefined && V !== undefined && R !== undefined && R !== 0) P = (V * V) / R;
  }
  if (V === undefined || I === undefined || R === undefined || P === undefined) return null;
  if (![V, I, R, P].every(Number.isFinite)) return null;
  return { V, I, R, P };
}

export default function OhmsLawTool() {
  const t = TEXT[useLang()];
  const [vals, setVals] = useToolStateJSON<Record<K, string>>("vals", { V: "", I: "", R: "", P: "" });

  const parsed: Partial<Record<K, number>> = {};
  (Object.keys(vals) as K[]).forEach((k) => {
    if (vals[k].trim() !== "" && Number.isFinite(Number(vals[k]))) parsed[k] = Number(vals[k]);
  });
  const filled = Object.keys(parsed).length;
  const res = filled === 2 ? solve(parsed) : null;

  const set = (k: K, val: string) => setVals((s) => ({ ...s, [k]: val }));

  const fields: [K, string, string][] = [
    ["V", t.voltage, "V"],
    ["I", t.current, "A"],
    ["R", t.resistance, "Ω"],
    ["P", t.power, "W"],
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.hint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([k, label, unit]) => (
          <Field key={k} label={`${label} (${unit})`}>
            <TextInput
              mono
              inputMode="decimal"
              value={vals[k]}
              onChange={(e) => set(k, e.target.value)}
              placeholder="—"
            />
          </Field>
        ))}
      </div>
      {filled === 2 && !res && <ErrorText>{t.bad}</ErrorText>}
      {filled !== 2 && <p className="text-sm text-amber-500">{t.need2}</p>}
      {res && (
        <div className="grid gap-3 sm:grid-cols-4">
          {fields.map(([k, label, unit]) => (
            <Stat
              key={k}
              label={label}
              value={fmtNum(res[k], 4)}
              unit={unit}
              accent={parsed[k] === undefined}
            />
          ))}
        </div>
      )}
      {res && (
        <Field label={t.summary}>
          <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-700">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <tr>
                  <th className="px-3 py-1.5 font-medium">{t.quantity}</th>
                  <th className="px-3 py-1.5 font-medium">{t.valueCol}</th>
                  <th className="px-3 py-1.5 font-medium">{t.source}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {fields.map(([k, label, unit]) => (
                  <tr key={k}>
                    <td className="px-3 py-1.5 text-zinc-600 dark:text-zinc-400">{label}</td>
                    <td className="px-3 py-1.5 font-mono">
                      {fmtNum(res[k], 4)} {unit}
                    </td>
                    <td className="px-3 py-1.5">
                      {parsed[k] === undefined ? (
                        <span className="text-indigo-500">{t.computed}</span>
                      ) : (
                        <span className="text-zinc-500">{t.input}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Field>
      )}
    </div>
  );
}
