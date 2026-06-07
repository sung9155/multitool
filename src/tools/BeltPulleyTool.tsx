import { Field, TextInput, Stat, fmtNum } from "../components/ui";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";
import { ChartCard } from "../components/charts";

const TEXT = {
  ko: {
    intro: "구동/종동 풀리경과 축간거리로 벨트 길이·속도비·벨트속도를 계산합니다.",
    d1: "구동 풀리경 D1 (mm)",
    d2: "종동 풀리경 D2 (mm)",
    center: "축간거리 C (mm)",
    rpm: "구동 회전수 (rpm)",
    beltLen: "벨트 길이",
    ratio: "속도비",
    drivenRpm: "종동 회전수",
    beltSpeed: "벨트 속도",
    wrap: "접촉각(구동)",
    layout: "풀리 배치도",
  },
  en: {
    intro: "Compute belt length, speed ratio & belt speed from pulley diameters and center distance.",
    d1: "Driver pulley D1 (mm)",
    d2: "Driven pulley D2 (mm)",
    center: "Center distance C (mm)",
    rpm: "Driver speed (rpm)",
    beltLen: "Belt length",
    ratio: "Speed ratio",
    drivenRpm: "Driven speed",
    beltSpeed: "Belt speed",
    wrap: "Wrap angle (driver)",
    layout: "Pulley layout",
  },
  zh: {
    intro: "根据主/从动轮直径和中心距计算皮带长度、速比和皮带速度。",
    d1: "主动轮 D1 (mm)",
    d2: "从动轮 D2 (mm)",
    center: "中心距 C (mm)",
    rpm: "主动转速 (rpm)",
    beltLen: "皮带长度",
    ratio: "速比",
    drivenRpm: "从动转速",
    beltSpeed: "皮带速度",
    wrap: "包角(主动)",
    layout: "皮带轮布置图",
  },
} as const;

export default function BeltPulleyTool() {
  const t = TEXT[useLang()];
  const [d1, setD1] = useToolState("d1", "100");
  const [d2, setD2] = useToolState("d2", "200");
  const [c, setC] = useToolState("c", "400");
  const [rpm, setRpm] = useToolState("rpm", "1450");

  const D1 = Number(d1), D2 = Number(d2), C = Number(c);
  const beltLen = 2 * C + (Math.PI / 2) * (D1 + D2) + ((D2 - D1) ** 2) / (4 * C);
  const ratio = D1 !== 0 ? D2 / D1 : 0;
  const drivenRpm = ratio !== 0 ? Number(rpm) / ratio : 0;
  const beltSpeed = (Math.PI * D1 * Number(rpm)) / 60000; // m/s (D mm)
  const wrap = 180 - 2 * (Math.asin((D2 - D1) / (2 * C)) * 180) / Math.PI;

  // 풀리 배치도(SVG) 좌표 — 실제 비율 유지하여 화면에 맞게 스케일
  const r1 = D1 / 2, r2 = D2 / 2;
  const VW = 360, VH = 200, MARGIN = 24;
  const span = C + r1 + r2; // 전체 가로 길이 (mm)
  const scale = span > 0 ? (VW - 2 * MARGIN) / span : 1;
  const cy = VH / 2;
  const cx1 = MARGIN + r1 * scale;
  const cx2 = cx1 + C * scale;
  const sr1 = r1 * scale, sr2 = r2 * scale;
  // 외접 벨트 접선각 (두 원 공통 외접선)
  const dx = cx2 - cx1;
  const phi = Math.asin(Math.max(-1, Math.min(1, (sr2 - sr1) / (dx || 1))));
  const a = Math.PI / 2 - phi; // 접점 각도(수평 기준)
  const t1u = { x: cx1 - sr1 * Math.cos(a), y: cy - sr1 * Math.sin(a) };
  const t2u = { x: cx2 - sr2 * Math.cos(a), y: cy - sr2 * Math.sin(a) };
  const t1d = { x: cx1 - sr1 * Math.cos(a), y: cy + sr1 * Math.sin(a) };
  const t2d = { x: cx2 - sr2 * Math.cos(a), y: cy + sr2 * Math.sin(a) };
  // 잘못된 입력(빈값/음수)일 때 SVG 좌표가 NaN/음수가 되어 깨지는 것 방지
  const diagramOk =
    sr1 > 0 &&
    sr2 > 0 &&
    [cx1, cx2, cy, sr1, sr2, t1u.x, t1u.y, t2u.x, t2u.y, t1d.x, t1d.y, t2d.x, t2d.y].every(
      Number.isFinite,
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.d1}>
          <TextInput mono inputMode="decimal" value={d1} onChange={(e) => setD1(e.target.value)} />
        </Field>
        <Field label={t.d2}>
          <TextInput mono inputMode="decimal" value={d2} onChange={(e) => setD2(e.target.value)} />
        </Field>
        <Field label={t.center}>
          <TextInput mono inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} />
        </Field>
        <Field label={t.rpm}>
          <TextInput mono inputMode="decimal" value={rpm} onChange={(e) => setRpm(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label={t.beltLen} value={fmtNum(beltLen, 1)} unit="mm" accent />
        <Stat label={t.ratio} value={`${fmtNum(ratio, 3)} : 1`} />
        <Stat label={t.drivenRpm} value={fmtNum(drivenRpm, 1)} unit="rpm" accent />
        <Stat label={t.beltSpeed} value={fmtNum(beltSpeed, 2)} unit="m/s" />
        <Stat label={t.wrap} value={fmtNum(wrap, 1)} unit="°" />
      </div>
      <ChartCard title={t.layout}>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          {diagramOk ? (
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height={190}>
            {/* 벨트 (외접 접선) */}
            <line
              x1={t1u.x}
              y1={t1u.y}
              x2={t2u.x}
              y2={t2u.y}
              className="stroke-zinc-400 dark:stroke-zinc-500"
              strokeWidth={2}
            />
            <line
              x1={t1d.x}
              y1={t1d.y}
              x2={t2d.x}
              y2={t2d.y}
              className="stroke-zinc-400 dark:stroke-zinc-500"
              strokeWidth={2}
            />
            {/* 풀리 */}
            <circle
              cx={cx1}
              cy={cy}
              r={sr1}
              fill="#6366f1"
              fillOpacity={0.15}
              stroke="#6366f1"
              strokeWidth={2}
            />
            <circle
              cx={cx2}
              cy={cy}
              r={sr2}
              fill="#10b981"
              fillOpacity={0.15}
              stroke="#10b981"
              strokeWidth={2}
            />
            <circle cx={cx1} cy={cy} r={2.5} className="fill-zinc-500" />
            <circle cx={cx2} cy={cy} r={2.5} className="fill-zinc-500" />
            <text x={cx1} y={cy + sr1 + 14} textAnchor="middle" fill="#6366f1" className="text-[11px] font-medium">
              D1 {fmtNum(D1, 0)}
            </text>
            <text x={cx2} y={cy + sr2 + 14} textAnchor="middle" fill="#10b981" className="text-[11px] font-medium">
              D2 {fmtNum(D2, 0)}
            </text>
          </svg>
          ) : (
            <div className="py-12 text-center text-sm text-zinc-400">—</div>
          )}
        </div>
      </ChartCard>
    </div>
  );
}
