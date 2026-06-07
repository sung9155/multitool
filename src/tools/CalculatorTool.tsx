import { useMemo, useState } from "react";
import { Field, TextInput, Stat } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "수식 입력 → 계산. sin cos tan log ln sqrt abs, ^ 거듭제곱, pi e 지원.",
    expr: "수식",
    result: "결과",
    deg: "각도(도)",
    rad: "라디안",
    error: "수식 오류",
  },
  en: {
    intro: "Type an expression. Supports sin cos tan log ln sqrt abs, ^ power, pi e.",
    expr: "Expression",
    result: "Result",
    deg: "Degrees",
    rad: "Radians",
    error: "Expression error",
  },
  zh: {
    intro: "输入表达式 → 计算。支持 sin cos tan log ln sqrt abs、^ 幂、pi e。",
    expr: "表达式",
    result: "结果",
    deg: "角度(度)",
    rad: "弧度",
    error: "表达式错误",
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
  const [expr, setExpr] = useState("2 * (3 + 4) ^ 2 - sqrt(16)");
  const [deg, setDeg] = useState(true);

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
    </div>
  );
}
