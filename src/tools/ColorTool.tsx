import { useState } from "react";
import { CopyButton, Field, TextInput } from "../components/ui";

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
  const [hex, setHex] = useState("#4f46e5");
  const rgb = hexToRgb(hex);
  const rgbStr = rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : "—";
  const hslStr = rgb ? rgbToHsl(rgb[0], rgb[1], rgb[2]) : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <Field label="HEX">
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
          className="h-10 w-14 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900"
        />
        <div
          className="h-10 flex-1 rounded-md border border-zinc-700"
          style={{ background: rgb ? hex : "transparent" }}
        />
      </div>

      {[
        ["RGB", rgbStr],
        ["HSL", hslStr],
      ].map(([label, v]) => (
        <Field key={label} label={label}>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
              {v}
            </code>
            <CopyButton value={v} />
          </div>
        </Field>
      ))}
    </div>
  );
}
