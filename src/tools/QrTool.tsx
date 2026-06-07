import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    input: "내용 (URL · 텍스트 · WiFi 등)",
    size: "크기",
    ecLevel: "오류복원 수준",
    download: "PNG 다운로드",
    empty: "내용을 입력하면 QR 생성",
    note: "오프라인 생성 — 데이터는 서버로 전송되지 않음.",
  },
  en: {
    input: "Content (URL · text · WiFi …)",
    size: "Size",
    ecLevel: "Error correction",
    download: "Download PNG",
    empty: "Enter content to generate QR",
    note: "Generated offline — data is never sent to a server.",
  },
  zh: {
    input: "内容 (URL · 文本 · WiFi 等)",
    size: "尺寸",
    ecLevel: "纠错级别",
    download: "下载 PNG",
    empty: "输入内容生成二维码",
    note: "离线生成 — 数据不会发送到服务器。",
  },
} as const;

const LEVELS = ["L", "M", "Q", "H"] as const;

export default function QrTool() {
  const t = TEXT[useLang()];
  const [text, setText] = useToolState("q", "https://github.com");
  const [size, setSize] = useToolState("size", 256);
  const [level, setLevel] = useToolState<(typeof LEVELS)[number]>("ec", "M");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!text) {
      setUrl("");
      return;
    }
    let alive = true;
    QRCode.toDataURL(text, {
      width: size,
      errorCorrectionLevel: level as (typeof LEVELS)[number],
      margin: 2,
    })
      .then((d) => {
        if (alive) setUrl(d);
      })
      .catch(() => {
        if (alive) setUrl("");
      });
    return () => {
      alive = false;
    };
  }, [text, size, level]);

  return (
    <div className="space-y-4">
      <Field label={t.input}>
        <TextArea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>

      <div className="flex flex-wrap items-end gap-4">
        <Field label={t.ecLevel}>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  l === level
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>
        <Field label={`${t.size}: ${size}px`}>
          <input
            type="range"
            min={128}
            max={512}
            step={32}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-40 accent-indigo-600"
          />
        </Field>
      </div>

      <div className="flex flex-col items-center gap-3">
        {url ? (
          <>
            <img
              src={url}
              alt="QR"
              width={size}
              height={size}
              className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700"
            />
            <a
              href={url}
              download="qrcode.png"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              ↓ {t.download}
            </a>
          </>
        ) : (
          <p className="py-10 text-sm text-zinc-500">{t.empty}</p>
        )}
      </div>

      <p className="text-xs text-zinc-500">{t.note}</p>
    </div>
  );
}
