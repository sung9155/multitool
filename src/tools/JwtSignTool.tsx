import { useEffect, useState } from "react";
import { Field, TextArea, TextInput, CopyButton, ErrorText } from "../components/ui";
import { useLang } from "../components/i18n";

const TEXT = {
  ko: {
    intro: "HMAC(HS256/384/512) 서명 JWT를 생성합니다. 모두 브라우저에서 처리(오프라인).",
    alg: "알고리즘",
    payload: "Payload (JSON)",
    secret: "Secret",
    token: "생성된 JWT",
    badJson: "Payload JSON 형식 오류",
  },
  en: {
    intro: "Generate an HMAC(HS256/384/512)-signed JWT. All in-browser (offline).",
    alg: "Algorithm",
    payload: "Payload (JSON)",
    secret: "Secret",
    token: "Generated JWT",
    badJson: "Invalid payload JSON",
  },
  zh: {
    intro: "生成 HMAC(HS256/384/512) 签名的 JWT。全部在浏览器处理（离线）。",
    alg: "算法",
    payload: "Payload (JSON)",
    secret: "Secret",
    token: "生成的 JWT",
    badJson: "Payload JSON 格式错误",
  },
} as const;

const HASH: Record<string, string> = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" };

function b64url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const b64urlStr = (s: string) => b64url(new TextEncoder().encode(s));

export default function JwtSignTool() {
  const t = TEXT[useLang()];
  const [alg, setAlg] = useState("HS256");
  const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const obj = JSON.parse(payload);
        setErr("");
        const header = { alg, typ: "JWT" };
        const headerB64 = b64urlStr(JSON.stringify(header));
        const payloadB64 = b64urlStr(JSON.stringify(obj));
        const data = `${headerB64}.${payloadB64}`;
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(secret),
          { name: "HMAC", hash: HASH[alg] },
          false,
          ["sign"],
        );
        const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
        if (cancelled) return;
        setToken(`${data}.${b64url(new Uint8Array(sig))}`);
      } catch {
        if (!cancelled) {
          setErr(t.badJson);
          setToken("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [alg, payload, secret, t.badJson]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <Field label={t.alg}>
        <div className="flex gap-2">
          {Object.keys(HASH).map((a) => (
            <button
              key={a}
              onClick={() => setAlg(a)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                a === alg
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>
      <Field label={t.payload}>
        <TextArea mono rows={7} value={payload} onChange={(e) => setPayload(e.target.value)} />
      </Field>
      <Field label={t.secret}>
        <TextInput mono value={secret} onChange={(e) => setSecret(e.target.value)} />
      </Field>
      <ErrorText>{err}</ErrorText>
      {token && (
        <Field label={t.token}>
          <div className="space-y-2">
            <code className="block break-all rounded-md border border-zinc-200 bg-zinc-100 p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {token}
            </code>
            <CopyButton value={token} />
          </div>
        </Field>
      )}
    </div>
  );
}
