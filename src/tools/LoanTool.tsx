import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { LineChart, PALETTE, type Pt } from "../components/charts";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    won: "원",
    method: "상환 방식",
    equalPI: "원리금균등",
    equalP: "원금균등",
    bullet: "만기일시",
    loanPrincipal: "대출 원금",
    principalHint: "원",
    annualRate: "연이율",
    rateHint: "%",
    term: "기간",
    termHint: "년",
    monthlyPayment: "월 상환액",
    firstPayment: "첫 달 상환액",
    lastPayment: "마지막 달 상환액",
    totalInterest: "총 이자",
    totalPayment: "총 상환액",
    balanceTrend: "대출 잔액 추이",
    balance: "잔액",
    yearUnit: "년",
    balanceUnit: "잔액(원)",
    principal: "원금",
    interestRatio: "이자 비율",
    interestRatioUnit: "% (원금 대비)",
    note: "원리금균등: 매월 동일 납부. 원금균등: 원금 일정, 이자 감소(초기 부담↑). 만기일시: 매월 이자만, 만기에 원금 일시상환. 거치기간·중도상환 미반영.",
  },
  en: {
    won: "KRW",
    method: "Repayment method",
    equalPI: "Equal payment",
    equalP: "Equal principal",
    bullet: "Bullet",
    loanPrincipal: "Loan principal",
    principalHint: "KRW",
    annualRate: "Annual rate",
    rateHint: "%",
    term: "Term",
    termHint: "yr",
    monthlyPayment: "Monthly payment",
    firstPayment: "First month payment",
    lastPayment: "Last month payment",
    totalInterest: "Total interest",
    totalPayment: "Total repayment",
    balanceTrend: "Loan balance trend",
    balance: "Balance",
    yearUnit: "yr",
    balanceUnit: "Balance (KRW)",
    principal: "Principal",
    interestRatio: "Interest ratio",
    interestRatioUnit: "% (of principal)",
    note: "Equal payment: same amount each month. Equal principal: fixed principal, decreasing interest (higher early burden). Bullet: interest only each month, principal repaid at maturity. Grace period and prepayment not reflected.",
  },
  zh: {
    won: "元",
    method: "还款方式",
    equalPI: "等额本息",
    equalP: "等额本金",
    bullet: "到期一次性",
    loanPrincipal: "贷款本金",
    principalHint: "元",
    annualRate: "年利率",
    rateHint: "%",
    term: "期限",
    termHint: "年",
    monthlyPayment: "月还款额",
    firstPayment: "首月还款额",
    lastPayment: "末月还款额",
    totalInterest: "总利息",
    totalPayment: "总还款额",
    balanceTrend: "贷款余额走势",
    balance: "余额",
    yearUnit: "年",
    balanceUnit: "余额(元)",
    principal: "本金",
    interestRatio: "利息比例",
    interestRatioUnit: "% (相对本金)",
    note: "等额本息: 每月还款相同。等额本金: 本金固定, 利息递减(前期负担↑)。到期一次性: 每月仅付利息, 到期一次性偿还本金。未含宽限期·提前还款。",
  },
} as const;

const won = (n: number, suffix: string) =>
  Math.round(n).toLocaleString("ko-KR") + " " + suffix;

type Method = "equalPI" | "equalP" | "bullet";

export default function LoanTool() {
  const t = TEXT[useLang()];
  const w = (n: number) => won(n, t.won);
  const [principal, setPrincipal] = useToolState("principal", "100000000"); // 원금
  const [rate, setRate] = useToolState("rate", "4.5"); // 연이율 %
  const [years, setYears] = useToolState("years", "30"); // 기간(년)
  const [method, setMethod] = useToolState<Method>("method", "equalPI");

  const P = Number(principal);
  const r = Number(rate) / 100 / 12; // 월이율
  // 비정상 입력(1e308 등)으로 인한 무한 루프/메모리 폭발 방지 — 최대 1200개월(100년)
  const rawN = Math.round(Number(years) * 12);
  const n = Number.isFinite(rawN) ? Math.min(Math.max(0, rawN), 1200) : 0; // 개월수

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
      <Field label={t.method}>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["equalPI", t.equalPI],
              ["equalP", t.equalP],
              ["bullet", t.bullet],
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
        <Field label={t.loanPrincipal} hint={t.principalHint}>
          <TextInput
            mono
            inputMode="numeric"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </Field>
        <Field label={t.annualRate} hint={t.rateHint}>
          <TextInput mono value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label={t.term} hint={t.termHint}>
          <TextInput mono value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={method === "equalPI" ? t.monthlyPayment : t.firstPayment}
          value={w(firstPay)}
          accent
        />
        {method !== "equalPI" && (
          <Stat label={t.lastPayment} value={w(lastPay)} />
        )}
        <Stat label={t.totalInterest} value={w(totalInterest)} />
        <Stat label={t.totalPayment} value={w(totalPay)} accent />
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {t.balanceTrend}
        </div>
        <LineChart
          series={[{ points: balCurve, color: PALETTE.indigo, label: t.balance }]}
          xMin={0}
          xMax={Number(years)}
          yMin={0}
          xUnit={t.yearUnit}
          yUnit={t.balanceUnit}
          height={220}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label={t.principal} value={w(P)} />
        <Stat
          label={t.interestRatio}
          value={fmtNum((totalInterest / P) * 100, 1)}
          unit={t.interestRatioUnit}
        />
      </div>

      <p className="text-xs text-zinc-500">{t.note}</p>
    </div>
  );
}
