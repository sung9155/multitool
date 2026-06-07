import { useMemo } from "react";
import { Field, TextArea, CopyButton } from "../components/ui";
import { useToolState } from "../components/toolState";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "HTML 속성을 JSX 규칙에 맞게 변환합니다 (class→className 등).",
    input: "HTML",
    output: "JSX",
    rules: "적용된 변환 규칙",
    colRule: "규칙",
    colJsx: "JSX",
    colApplied: "입력에 적용됨",
    yes: "예",
    no: "아니오",
  },
  en: {
    intro: "Convert HTML attributes to JSX rules (class→className, etc.).",
    input: "HTML",
    output: "JSX",
    rules: "Conversion rules",
    colRule: "Rule",
    colJsx: "JSX",
    colApplied: "Applied to input",
    yes: "Yes",
    no: "No",
  },
  zh: {
    intro: "将 HTML 属性转换为 JSX 规则（class→className 等）。",
    input: "HTML",
    output: "JSX",
    rules: "应用的转换规则",
    colRule: "规则",
    colJsx: "JSX",
    colApplied: "已应用于输入",
    yes: "是",
    no: "否",
  },
} as const;

const ATTR_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  colspan: "colSpan",
  rowspan: "rowSpan",
  contenteditable: "contentEditable",
  crossorigin: "crossOrigin",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  enctype: "encType",
  novalidate: "noValidate",
  srcset: "srcSet",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
};

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

function styleToJsx(style: string): string {
  const obj = style
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const idx = d.indexOf(":");
      if (idx < 0) return null;
      const key = d.slice(0, idx).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const val = d.slice(idx + 1).trim();
      return `${key}: '${val}'`;
    })
    .filter(Boolean)
    .join(", ");
  return `{{ ${obj} }}`;
}

function convert(html: string): string {
  // 주석 변환
  let out = html.replace(/<!--([\s\S]*?)-->/g, (_, c) => `{/*${c}*/}`);

  // 태그별 속성 처리
  out = out.replace(/<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)\s*(\/?)>/g, (m, tag, attrs, selfClose) => {
    if (m.startsWith("</")) return m;
    let a = attrs as string;
    // style 변환
    a = a.replace(/\sstyle\s*=\s*"([^"]*)"/g, (_: string, s: string) => ` style=${styleToJsx(s)}`);
    // 속성명 매핑 + on* 이벤트 camelCase
    a = a.replace(/([a-zA-Z-]+)(\s*=\s*"[^"]*"|\s*=\s*'[^']*')?/g, (full: string, name: string, val: string) => {
      const lower = name.toLowerCase();
      let newName = ATTR_MAP[lower] ?? name;
      if (/^on[a-z]/.test(lower) && val) {
        newName = "on" + lower.charAt(2).toUpperCase() + lower.slice(3);
      }
      if (val === undefined) return newName; // boolean attr 그대로
      if (full.startsWith("style=")) return full; // 이미 처리됨
      return `${newName}${val}`;
    });
    const needsClose = VOID.has((tag as string).toLowerCase()) && selfClose !== "/";
    return `<${tag}${a}${needsClose ? " /" : selfClose ? " /" : ""}>`;
  });

  return out;
}

const SAMPLE = `<div class="card" style="color: red; font-size: 14px;">
  <label for="name">이름</label>
  <input type="text" id="name" readonly>
  <!-- 주석 -->
  <br>
</div>`;

// 입력에 각 규칙이 실제로 나타났는지 감지
const RULES: { rule: string; jsx: string; test: (h: string) => boolean }[] = [
  { rule: "class=", jsx: "className=", test: (h) => /\sclass\s*=/.test(h) },
  { rule: "for=", jsx: "htmlFor=", test: (h) => /\sfor\s*=/.test(h) },
  { rule: 'style="..."', jsx: "style={{ ... }}", test: (h) => /\sstyle\s*=/.test(h) },
  { rule: "on*= (onclick 등)", jsx: "onCamel (onClick 등)", test: (h) => /\son[a-z]+\s*=/.test(h) },
  {
    rule: "void 태그 (<br>, <img> 등)",
    jsx: "self-closed (<br />)",
    test: (h) =>
      [...VOID].some((v) => new RegExp(`<${v}(\\s[^>]*)?>`, "i").test(h)),
  },
  { rule: "<!-- ... -->", jsx: "{/* ... */}", test: (h) => /<!--[\s\S]*?-->/.test(h) },
];

export default function HtmlJsxTool() {
  const t = TEXT[useLang()];
  const [html, setHtml] = useToolState("html", SAMPLE);
  const jsx = useMemo(() => convert(html), [html]);
  const rules = useMemo(
    () => RULES.map((r) => ({ ...r, applied: r.test(html) })),
    [html],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <Field label={t.input}>
        <TextArea mono rows={8} value={html} onChange={(e) => setHtml(e.target.value)} />
      </Field>
      <Field label={t.output}>
        <div className="space-y-2">
          <TextArea mono rows={8} value={jsx} readOnly />
          <CopyButton value={jsx} />
        </div>
      </Field>
      <Field label={t.rules}>
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <tr>
                <th className="px-3 py-2 font-medium">{t.colRule}</th>
                <th className="px-3 py-2 font-medium">{t.colJsx}</th>
                <th className="px-3 py-2 font-medium">{t.colApplied}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {rules.map((r) => (
                <tr key={r.rule}>
                  <td className="px-3 py-1.5 font-mono text-zinc-700 dark:text-zinc-300">{r.rule}</td>
                  <td className="px-3 py-1.5 font-mono text-zinc-700 dark:text-zinc-300">{r.jsx}</td>
                  <td className="px-3 py-1.5">
                    <span
                      className={
                        r.applied
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-400 dark:text-zinc-500"
                      }
                    >
                      {r.applied ? t.yes : t.no}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Field>
    </div>
  );
}
