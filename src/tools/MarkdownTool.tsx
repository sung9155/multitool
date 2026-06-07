import { useMemo, useState } from "react";
import { Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: { intro: "Markdown 입력 → 실시간 미리보기. (오프라인, 의존성 없음)", input: "Markdown", preview: "미리보기" },
  en: { intro: "Markdown input → live preview. (offline, no deps)", input: "Markdown", preview: "Preview" },
  zh: { intro: "Markdown 输入 → 实时预览。(离线，无依赖)", input: "Markdown", preview: "预览" },
} as const;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function render(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inCode = false;
  let listType: "ul" | "ol" | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      flushPara();
      closeList();
      if (!inCode) html.push("<pre><code>");
      else html.push("</code></pre>");
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      html.push(esc(line));
      continue;
    }
    if (/^\s*$/.test(line)) {
      flushPara();
      closeList();
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      closeList();
      const lvl = h[1].length;
      html.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }
    if (/^\s*([-*+])\s+/.test(line)) {
      flushPara();
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inline(line.replace(/^\s*[-*+]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`);
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      flushPara();
      closeList();
      html.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ""))}</blockquote>`);
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushPara();
      closeList();
      html.push("<hr/>");
      continue;
    }
    para.push(line);
  }
  flushPara();
  closeList();
  if (inCode) html.push("</code></pre>");
  return html.join("\n");
}

const SAMPLE = `# 제목\n\n**굵게** 와 *기울임*, \`코드\`.\n\n- 항목 1\n- 항목 2\n\n> 인용문\n\n[링크](https://example.com)`;

export default function MarkdownTool() {
  const t = TEXT[useLang()];
  const [md, setMd] = useState(SAMPLE);
  const html = useMemo(() => render(md), [md]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <Field label={t.input}>
          <TextArea mono rows={16} value={md} onChange={(e) => setMd(e.target.value)} />
        </Field>
        <Field label={t.preview}>
          <div
            className="prose-sm h-full min-h-[16rem] overflow-auto rounded-md border border-zinc-200 bg-white p-4 text-sm leading-7 [&_a]:text-indigo-500 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-500 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-semibold [&_hr]:my-3 [&_hr]:border-zinc-300 [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:my-2 [&_pre]:overflow-auto [&_pre]:rounded [&_pre]:bg-zinc-100 [&_pre]:p-3 dark:border-zinc-700 dark:bg-zinc-900 dark:[&_code]:bg-zinc-800 dark:[&_pre]:bg-zinc-800"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Field>
      </div>
    </div>
  );
}
