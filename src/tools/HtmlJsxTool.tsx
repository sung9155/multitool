import { useMemo, useState } from "react";
import { Field, TextArea, CopyButton } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: { intro: "HTML 속성을 JSX 규칙에 맞게 변환합니다 (class→className 등).", input: "HTML", output: "JSX" },
  en: { intro: "Convert HTML attributes to JSX rules (class→className, etc.).", input: "HTML", output: "JSX" },
  zh: { intro: "将 HTML 属性转换为 JSX 规则（class→className 等）。", input: "HTML", output: "JSX" },
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

export default function HtmlJsxTool() {
  const t = TEXT[useLang()];
  const [html, setHtml] = useState(SAMPLE);
  const jsx = useMemo(() => convert(html), [html]);

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
    </div>
  );
}
