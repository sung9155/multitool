import { Field, TextInput, Stat } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    intro: "통신 디버깅용 체크섬. 입력 형식을 선택하세요.",
    input: "입력 데이터",
    format: "입력 형식",
    hex: "16진수 (예: 01 03 00 00)",
    ascii: "ASCII 문자열",
    crc16: "Modbus CRC16",
    crc16le: "CRC16 (LE 전송순서)",
    lrc: "LRC (Modbus ASCII)",
    sum8: "체크섬 8비트",
    xor8: "XOR 8비트",
    bytes: "바이트 수",
    invalid: "잘못된 16진수 입력",
    breakdown: "바이트 분해",
    idx: "#",
    hexCol: "16진수",
    decCol: "10진수",
  },
  en: {
    intro: "Checksums for comms debugging. Pick the input format.",
    input: "Input data",
    format: "Input format",
    hex: "Hex (e.g. 01 03 00 00)",
    ascii: "ASCII string",
    crc16: "Modbus CRC16",
    crc16le: "CRC16 (LE byte order)",
    lrc: "LRC (Modbus ASCII)",
    sum8: "Checksum 8-bit",
    xor8: "XOR 8-bit",
    bytes: "Byte count",
    invalid: "Invalid hex input",
    breakdown: "Byte breakdown",
    idx: "#",
    hexCol: "Hex",
    decCol: "Decimal",
  },
  zh: {
    intro: "用于通信调试的校验和。请选择输入格式。",
    input: "输入数据",
    format: "输入格式",
    hex: "十六进制 (如 01 03 00 00)",
    ascii: "ASCII 字符串",
    crc16: "Modbus CRC16",
    crc16le: "CRC16 (低字节序)",
    lrc: "LRC (Modbus ASCII)",
    sum8: "校验和 8位",
    xor8: "异或 8位",
    bytes: "字节数",
    invalid: "无效的十六进制输入",
    breakdown: "字节分解",
    idx: "#",
    hexCol: "十六进制",
    decCol: "十进制",
  },
} as const;

function parseHex(s: string): number[] | null {
  const clean = s.replace(/0x/gi, "").replace(/[\s,]+/g, "");
  if (clean === "") return [];
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) return null;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

function crc16modbus(bytes: number[]): number {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      if (crc & 1) crc = (crc >> 1) ^ 0xa001;
      else crc >>= 1;
    }
  }
  return crc & 0xffff;
}

const hex2 = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");
const hex4 = (n: number) => n.toString(16).toUpperCase().padStart(4, "0");

export default function CrcTool() {
  const t = TEXT[useLang()];
  const [input, setInput] = useToolState("in", "01 03 00 00 00 0A");
  const [fmt, setFmt] = useToolState<"hex" | "ascii">("fmt", "hex");

  let bytes: number[] | null;
  if (fmt === "hex") bytes = parseHex(input);
  else bytes = Array.from(new TextEncoder().encode(input));

  const valid = bytes !== null;
  const b = bytes ?? [];
  const crc = crc16modbus(b);
  const crcLE = ((crc & 0xff) << 8) | (crc >> 8);
  const lrc = (-b.reduce((a, x) => a + x, 0)) & 0xff;
  const sum = b.reduce((a, x) => a + x, 0) & 0xff;
  const xor = b.reduce((a, x) => a ^ x, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <Field label={t.format}>
        <div className="flex gap-2">
          {(
            [
              ["hex", t.hex],
              ["ascii", t.ascii],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setFmt(m)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                m === fmt
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>
      <Field label={t.input}>
        <TextInput mono value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      {!valid && <p className="text-sm text-red-400">{t.invalid}</p>}
      {valid && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label={t.crc16} value={`0x${hex4(crc)}`} accent />
          <Stat label={t.crc16le} value={`${hex2(crcLE >> 8)} ${hex2(crcLE & 0xff)}`} />
          <Stat label={t.lrc} value={`0x${hex2(lrc)}`} />
          <Stat label={t.sum8} value={`0x${hex2(sum)}`} />
          <Stat label={t.xor8} value={`0x${hex2(xor)}`} />
          <Stat label={t.bytes} value={b.length} />
        </div>
      )}
      {valid && b.length > 0 && (
        <Field label={t.breakdown}>
          <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-700">
            <table className="w-full border-collapse text-left font-mono text-sm">
              <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <tr>
                  <th className="px-3 py-1.5 font-medium">{t.idx}</th>
                  <th className="px-3 py-1.5 font-medium">{t.hexCol}</th>
                  <th className="px-3 py-1.5 font-medium">{t.decCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {b.map((byte, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 text-zinc-500">{i}</td>
                    <td className="px-3 py-1.5">0x{hex2(byte)}</td>
                    <td className="px-3 py-1.5">{byte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Field>
      )}
    </div>
  );
}
