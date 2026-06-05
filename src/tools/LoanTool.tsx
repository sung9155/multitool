import { useState } from "react";
import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { LineChart, PALETTE, type Pt } from "../components/charts";

const won = (n: number) => Math.round(n).toLocaleString("ko-KR") + " 원";

type Method = "equalPI" | "equalP" | "bullet";

export default function LoanTool() {
  const [principal, setPrincipal] = useState("100000000"); // 원금
  const [rate, setRate] = useState("4.5"); // 연이율 %
  const [years, setYears] = useState("30"); // 기간(년)
  const [method, setMethod] = useState<Method>("equalPI");

  const P = Number(principal);
  const r = Number(rate) / 100 / 12; // 월이율
  const n = Math.round(Number(years) * 12); // 개월수

  // 상환 스케줄 시뮬레이션
  const balCurve: Pt[] = [{ x: 0, y: P }];
  let totalInterest = 0;
  let firstPay = 0;
  let lastPay = 0;
  let bal = P;

  const equalPayment =
    r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n)); // 원리금균등 월납

  for (let m = 1; m <= n; m++) {
    const interest = bal * r;
    let principalPaid: number;
    let pay: number;
    if (method === "equalPI") {
      pay = equalPayment;
      principalPaid = pay - interest;
    } else if (method === "equalP") {
      principalPaid = P / n; // 원금균등
      pay = principalPaid + interest;
    } else {
      // 만기일시: 매월 이자만, 마지막에 원금
      principalPaid = m === n ? P : 0;
      pay = interest + principalPaid;
    }
    totalInterest += interest;
    bal -= principalPaid;
    if (m === 1) firstPay = pay;
    if (m === n) lastPay = pay;
    if (m % Math.max(1, Math.floor(n / 60)) === 0 || m === n)
      balCurve.push({ x: m / 12, y: Math.max(0, bal) });
  }

  const totalPay = P + totalInterest;

  return (
    <div className="space-y-5">
      <Field label="상환 방식">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["equalPI", "원리금균등"],
              ["equalP", "원금균등"],
              ["bullet", "만기일시"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                m === method
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
        <Field label="대출 원금" hint="원">
          <TextInput
            mono
            inputMode="numeric"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </Field>
        <Field label="연이율" hint="%">
          <TextInput mono value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label="기간" hint="년">
          <TextInput mono value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={method === "equalPI" ? "월 상환액" : "첫 달 상환액"}
          value={won(firstPay)}
          accent
        />
        {method !== "equalPI" && (
          <Stat label="마지막 달 상환액" value={won(lastPay)} />
        )}
        <Stat label="총 이자" value={won(totalInterest)} />
        <Stat label="총 상환액" value={won(totalPay)} accent />
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          대출 잔액 추이
        </div>
        <LineChart
          series={[{ points: balCurve, color: PALETTE.indigo, label: "잔액" }]}
          xMin={0}
          xMax={Number(years)}
          yMin={0}
          xUnit="년"
          yUnit="잔액(원)"
          height={220}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="원금" value={won(P)} />
        <Stat
          label="이자 비율"
          value={fmtNum((totalInterest / P) * 100, 1)}
          unit="% (원금 대비)"
        />
      </div>

      <p className="text-xs text-zinc-500">
        원리금균등: 매월 동일 납부. 원금균등: 원금 일정, 이자 감소(초기 부담↑).
        만기일시: 매월 이자만, 만기에 원금 일시상환. 거치기간·중도상환 미반영.
      </p>
    </div>
  );
}
