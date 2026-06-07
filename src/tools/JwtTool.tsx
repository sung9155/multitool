import { CopyButton, ErrorText, Field, TextArea } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    input: "JWT 토큰",
    header: "헤더 (Header)",
    payload: "페이로드 (Payload)",
    invalid: "유효한 JWT 형식이 아님 (점 2개로 구분된 3부분 필요)",
    decodeErr: "디코딩 실패 — Base64URL 파싱 오류",
    issued: "발급",
    expires: "만료",
    expired: "만료됨",
    valid: "유효",
    note: "클라이언트에서 디코딩만 — 서명 검증 안 함. 민감 토큰 주의.",
    segments: "토큰 구조",
    segSignature: "서명",
  },
  en: {
    input: "JWT Token",
    header: "Header",
    payload: "Payload",
    invalid: "Not a valid JWT (needs 3 dot-separated parts)",
    decodeErr: "Decode failed — Base64URL parse error",
    issued: "Issued",
    expires: "Expires",
    expired: "Expired",
    valid: "Valid",
    note: "Client-side decode only — signature NOT verified. Mind sensitive tokens.",
    segments: "Token structure",
    segSignature: "Signature",
  },
  zh: {
    input: "JWT 令牌",
    header: "头部 (Header)",
    payload: "载荷 (Payload)",
    invalid: "不是有效的 JWT（需 3 段，以点分隔）",
    decodeErr: "解码失败 — Base64URL 解析错误",
    issued: "签发",
    expires: "过期",
    expired: "已过期",
    valid: "有效",
    note: "仅客户端解码 — 不验证签名。注意敏感令牌。",
    segments: "令牌结构",
    segSignature: "签名",
  },
} as const;

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return decodeURIComponent(
    atob(b64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
}

const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkhvbmcgR2lsZG9uZyIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.signature";

export default function JwtTool() {
  const t = TEXT[useLang()];
  const [input, setInput] = useToolState("jwt", SAMPLE);

  let header = "";
  let payload = "";
  let error = "";
  let exp: number | null = null;
  let iat: number | null = null;

  const parts = input.trim().split(".");
  if (input.trim() === "") {
    error = "";
  } else if (parts.length < 2 || parts.length > 3) {
    error = t.invalid;
  } else {
    try {
      const h = JSON.parse(b64urlDecode(parts[0]));
      const p = JSON.parse(b64urlDecode(parts[1]));
      header = JSON.stringify(h, null, 2);
      payload = JSON.stringify(p, null, 2);
      exp = typeof p.exp === "number" ? p.exp : null;
      iat = typeof p.iat === "number" ? p.iat : null;
    } catch {
      error = t.decodeErr;
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const fmtTs = (ts: number) => new Date(ts * 1000).toLocaleString();

  const trimmed = input.trim();
  const segParts = trimmed === "" ? [] : trimmed.split(".");
  const segColors = [
    "text-rose-600 dark:text-rose-400",
    "text-indigo-600 dark:text-indigo-400",
    "text-sky-600 dark:text-sky-400",
  ];
  const segLegend = [
    { label: t.header, color: "bg-rose-500" },
    { label: t.payload, color: "bg-indigo-500" },
    { label: t.segSignature, color: "bg-sky-500" },
  ];

  return (
    <div className="space-y-4">
      <Field label={t.input}>
        <TextArea
          mono
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </Field>
      <ErrorText>{error}</ErrorText>

      {segParts.length > 0 && (
        <Field label={t.segments}>
          <div className="space-y-2">
            <code className="block break-all rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {segParts.map((seg, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-zinc-400">.</span>}
                  <span className={segColors[i] ?? "text-zinc-500"}>{seg}</span>
                </span>
              ))}
            </code>
            <div className="flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-400">
              {segLegend.map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${l.color}`} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </Field>
      )}

      {header && (
        <>
          <Field label={t.header}>
            <div className="space-y-2">
              <TextArea mono rows={4} value={header} readOnly />
              <CopyButton value={header} />
            </div>
          </Field>
          <Field label={t.payload}>
            <div className="space-y-2">
              <TextArea mono rows={8} value={payload} readOnly />
              <CopyButton value={payload} />
            </div>
          </Field>

          {(iat != null || exp != null) && (
            <div className="flex flex-wrap gap-3 text-sm">
              {iat != null && (
                <span className="rounded-md border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {t.issued}: {fmtTs(iat)}
                </span>
              )}
              {exp != null && (
                <span
                  className={`rounded-md px-3 py-1.5 font-medium ${
                    exp < now
                      ? "bg-red-500/15 text-red-500"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {t.expires}: {fmtTs(exp)} ({exp < now ? t.expired : t.valid})
                </span>
              )}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-zinc-500">{t.note}</p>
    </div>
  );
}
