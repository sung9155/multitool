import { useState, type ReactNode, type TextareaHTMLAttributes } from "react";

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const styles =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-500"
      : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";
  return (
    <button type={type} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "복사됨 ✓" : "복사"}
    </Button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function TextArea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean },
) {
  const { mono, className, ...rest } = props;
  return (
    <textarea
      spellCheck={false}
      className={`w-full resize-y rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${
        mono ? "font-mono" : ""
      } ${className ?? ""}`}
      {...rest}
    />
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean },
) {
  const { mono, className, ...rest } = props;
  return (
    <input
      spellCheck={false}
      className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${
        mono ? "font-mono" : ""
      } ${className ?? ""}`}
      {...rest}
    />
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-red-400">{children}</p>;
}

/** 계산 결과 표시 카드 (라벨 + 값 + 단위) */
export function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        accent
          ? "border-indigo-500/40 bg-indigo-500/10 dark:bg-indigo-600/10"
          : "border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="font-mono text-lg text-zinc-900 dark:text-zinc-100">
        {value}
        {unit && <span className="ml-1 text-sm text-zinc-400">{unit}</span>}
      </div>
    </div>
  );
}

/** 숫자 포맷 (자릿수 자동, 천단위 콤마) */
export function fmtNum(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "—";
  const rounded = Number(n.toFixed(digits));
  return rounded.toLocaleString("ko-KR", { maximumFractionDigits: digits });
}
