import { useMemo } from "react";
import { Field, TextInput, Stat } from "../components/ui";
import { useToolState } from "../components/toolState";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "수식 입력 → 계산. sin cos tan log ln sqrt abs, ^ 거듭제곱, pi e 지원.",
    expr: "수식",
    result: "결과",
    deg: "각도(도)",
    rad: "라디안",
    error: "수식 오류",
    ref: "함수 · 상수 참조",
    colName: "이름",
    colDesc: "설명",
    desc: {
      sin: "사인", cos: "코사인", tan: "탄젠트",
      asin: "역사인 (아크사인)", acos: "역코사인 (아크코사인)", atan: "역탄젠트 (아크탄젠트)",
      log: "상용로그 (밑 10)", ln: "자연로그 (밑 e)", sqrt: "제곱근", abs: "절댓값",
      exp: "e의 거듭제곱", round: "반올림", floor: "내림", ceil: "올림",
      pow: "거듭제곱", pi: "원주율 π ≈ 3.14159", e: "자연상수 e ≈ 2.71828",
    },
  },
  en: {
    intro: "Type an expression. Supports sin cos tan log ln sqrt abs, ^ power, pi e.",
    expr: "Expression",
    result: "Result",
    deg: "Degrees",
    rad: "Radians",
    error: "Expression error",
    ref: "Function · constant reference",
    colName: "Name",
    colDesc: "Description",
    desc: {
      sin: "Sine", cos: "Cosine", tan: "Tangent",
      asin: "Arcsine (inverse sine)", acos: "Arccosine (inverse cosine)", atan: "Arctangent (inverse tangent)",
      log: "Base-10 logarithm", ln: "Natural logarithm (base e)", sqrt: "Square root", abs: "Absolute value",
      exp: "e to the power", round: "Round to nearest", floor: "Round down", ceil: "Round up",
      pow: "Power", pi: "Pi π ≈ 3.14159", e: "Euler's number e ≈ 2.71828",
    },
  },
  zh: {
    intro: "输入表达式 → 计算。支持 sin cos tan log ln sqrt abs、^ 幂、pi e。",
    expr: "表达式",
    result: "结果",
    deg: "角度(度)",
    rad: "弧度",
    error: "表达式错误",
    ref: "函数 · 常量参考",
    colName: "名称",
    colDesc: "说明",
    desc: {
      sin: "正弦", cos: "余弦", tan: "正切",
      asin: "反正弦", acos: "反余弦", atan: "反正切",
      log: "常用对数 (底 10)", ln: "自然对数 (底 e)", sqrt: "平方根", abs: "绝对值",
      exp: "e 的幂", round: "四舍五入", floor: "向下取整", ceil: "向上取整",
      pow: "幂", pi: "圆周率 π ≈ 3.14159", e: "自然常数 e ≈ 2.71828",
    },
  },
} as const;

// 재귀 하강 파서 (eval 미사용)
function evaluate(input: string, deg: boolean): number {
  let i = 0;
  const s = input.replace(/\s+/g, "");
  const tr = (x: number) => (deg ? (x * Math.PI) / 180 : x);
  const funcs: Record<string, (x: number) => number> = {
    sin: (x) => Math.sin(tr(x)),
    cos: (x) => Math.cos(tr(x)),
    tan: (x) => Math.tan(tr(x)),
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    log: Math.log10, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs,
    exp: Math.exp, round: Math.round, floor: Math.floor, ceil: Math.ceil,
  };

  function peek() { return s[i]; }
  function parseExpr(): number {
    let v = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function parseTerm(): number {
    let v = parseFactor();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = s[i++];
      const r = parseFactor();
      v = op === "*" ? v * r : op === "/" ? v / r : v % r;
    }
    return v;
  }
  function parseFactor(): number {
    let v = parseUnary();
    if (peek() === "^") {
      i++;
      v = Math.pow(v, parseFactor());
    }
    return v;
  }
  function parseUnary(): number {
    if (peek() === "-") { i++; return -parseUnary(); }
    if (peek() === "+") { i++; return parseUnary(); }
    return parsePrimary();
  }
  function parsePrimary(): number {
    if (peek() === "(") {
      i++;
      const v = parseExpr();
      if (peek() !== ")") throw new Error("paren");
      i++;
      return v;
    }
    // 이름 (함수/상수)
    const nameMatch = s.slice(i).match(/^[a-zA-Z]+/);
    if (nameMatch) {
      const name = nameMatch[0];
      i += name.length;
      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;
      if (funcs[name]) {
        if (peek() !== "(") throw new Error("func");
        i++;
        const arg = parseExpr();
        if (peek() !== ")") throw new Error("paren");
        i++;
        return funcs[name](arg);
      }
      throw new Error("name:" + name);
    }
    // 숫자
    const numMatch = s.slice(i).match(/^\d*\.?\d+(e[+-]?\d+)?/i);
    if (numMatch) {
      i += numMatch[0].length;
      return parseFloat(numMatch[0]);
    }
    throw new Error("token");
  }

  const result = parseExpr();
  if (i !== s.length) throw new Error("trailing");
  return result;
}

export default function CalculatorTool() {
  const t = TEXT[useLang()];
  const [expr, setExpr] = useToolState("expr", "2 * (3 + 4) ^ 2 - sqrt(16)");
  const [deg, setDeg] = useToolState("deg", true);

  const refRows: { name: string; desc: string }[] = [
    { name: "sin(x)", desc: t.desc.sin },
    { name: "cos(x)", desc: t.desc.cos },
    { name: "tan(x)", desc: t.desc.tan },
    { name: "asin(x)", desc: t.desc.asin },
    { name: "acos(x)", desc: t.desc.acos },
    { name: "atan(x)", desc: t.desc.atan },
    { name: "log(x)", desc: t.desc.log },
    { name: "ln(x)", desc: t.desc.ln },
    { name: "sqrt(x)", desc: t.desc.sqrt },
    { name: "abs(x)", desc: t.desc.abs },
    { name: "exp(x)", desc: t.desc.exp },
    { name: "round(x)", desc: t.desc.round },
    { name: "floor(x)", desc: t.desc.floor },
    { name: "ceil(x)", desc: t.desc.ceil },
    { name: "^", desc: t.desc.pow },
    { name: "pi", desc: t.desc.pi },
    { name: "e", desc: t.desc.e },
  ];

  const { value, error } = useMemo(() => {
    if (expr.trim() === "") return { value: null as number | null, error: false };
    try {
      const v = evaluate(expr, deg);
      return { value: Number.isFinite(v) ? v : NaN, error: false };
    } catch {
      return { value: null, error: true };
    }
  }, [expr, deg]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <Field label={t.expr}>
        <TextInput mono value={expr} onChange={(e) => setExpr(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        {(
          [
            [true, t.deg],
            [false, t.rad],
          ] as const
        ).map(([d, label]) => (
          <button
            key={String(d)}
            onClick={() => setDeg(d)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              d === deg
                ? "bg-indigo-600 text-white"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="text-sm text-red-400">{t.error}</p>
      ) : value !== null ? (
        <Stat
          label={t.result}
          value={Number.isFinite(value) ? value.toLocaleString("ko-KR", { maximumFractionDigits: 10 }) : "—"}
          accent
        />
      ) : null}
      <Field label={t.ref}>
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <tr>
                <th className="px-3 py-2 font-medium">{t.colName}</th>
                <th className="px-3 py-2 font-medium">{t.colDesc}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {refRows.map((r) => (
                <tr key={r.name}>
                  <td className="px-3 py-1.5 font-mono text-zinc-700 dark:text-zinc-300">{r.name}</td>
                  <td className="px-3 py-1.5 text-zinc-600 dark:text-zinc-400">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Field>
    </div>
  );
}
