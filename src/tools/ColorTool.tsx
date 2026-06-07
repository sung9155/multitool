import { CopyButton, Field, TextInput } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    hex: "HEX",
    rgb: "RGB",
    hsl: "HSL",
    preview: "미리보기",
    valuesTable: "색상 값",
    format: "형식",
    value: "값",
  },
  en: {
    hex: "HEX",
    rgb: "RGB",
    hsl: "HSL",
    preview: "Preview",
    valuesTable: "Color values",
    format: "Format",
    value: "Value",
  },
  zh: {
    hex: "HEX",
    rgb: "RGB",
    hsl: "HSL",
    preview: "预览",
    valuesTable: "颜色值",
    format: "格式",
    value: "值",
  },
} as const;

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export default function ColorTool() {
  const t = TEXT[useLang()];
  const [hex, setHex] = useToolState("hex", "#4f46e5");
  const rgb = hexToRgb(hex);
  const hexStr = rgb ? `#${hex.trim().replace(/^#/, "").toLowerCase()}` : "—";
  const rgbStr = rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : "—";
  const hslStr = rgb ? rgbToHsl(rgb[0], rgb[1], rgb[2]) : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <Field label={t.hex}>
          <TextInput
            mono
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="w-40"
          />
        </Field>
        <input
          type="color"
          value={rgb ? hex : "#000000"}
          onChange={(e) => setHex(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-md border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {/* 큰 색상 미리보기 */}
      <Field label={t.preview}>
        <div
          className="flex h-40 w-full items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700"
          style={{ background: rgb ? hex : "transparent" }}
        >
          {!rgb && <span className="text-sm text-zinc-400">—</span>}
        </div>
      </Field>

      {[
        ["RGB", rgbStr],
        ["HSL", hslStr],
      ].map(([label, v]) => (
        <Field key={label} label={label}>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              {v}
            </code>
            <CopyButton value={v} />
          </div>
        </Field>
      ))}

      {/* 값 요약 테이블 */}
      <Field label={t.valuesTable}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700">
              <th className="py-1.5 pr-3 font-medium">{t.format}</th>
              <th className="py-1.5 font-medium">{t.value}</th>
            </tr>
          </thead>
          <tbody className="font-mono text-zinc-800 dark:text-zinc-200">
            {(
              [
                [t.hex, hexStr],
                [t.rgb, rgbStr],
                [t.hsl, hslStr],
              ] as const
            ).map(([label, v]) => (
              <tr
                key={label}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="py-1.5 pr-3 font-sans text-zinc-500">{label}</td>
                <td className="py-1.5">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Field>
    </div>
  );
}
