import { useEffect, useMemo, useRef, useState } from "react";
import { Stat, fmtNum } from "../components/ui";
import { LineChart, PALETTE, type Pt } from "../components/charts";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    slowStable: "느린 안정",
    kpLabel: "Kp (비례)",
    kiLabel: "Ki (적분)",
    kdLabel: "Kd (미분)",
    spLabel: "목표값 (SP)",
    tauLabel: "플랜트 시정수 τ (s)",
    deadLabel: "데드타임 (s)",
    plant: "플랜트",
    order: "차",
    disturbance: "외란",
    distMag: "외란 크기",
    pause: "⏸ 정지",
    play: "▶ 재생",
    reset: "↺ 처음",
    spLegend: "목표 (SP)",
    pvLegend: "출력 (PV)",
    mvLegend: "제어량 (MV)",
    timeUnit: "시간(s)",
    overshoot: "오버슈트",
    settling: "정정시간 (±2%)",
    rise: "상승시간",
    ssErr: "정상편차",
    desc: "플랜트 = 1차 지연(τ·dPV/dt + PV = K·u). 슬라이더 움직이면 즉시 재시뮬. Kp↑ 빠르지만 진동, Ki↑ 정상편차 제거하나 오버슈트, Kd↑ 진동 억제. 안티와인드업 적용.",
  },
  en: {
    slowStable: "Slow stable",
    kpLabel: "Kp (proportional)",
    kiLabel: "Ki (integral)",
    kdLabel: "Kd (derivative)",
    spLabel: "Setpoint (SP)",
    tauLabel: "Plant time constant τ (s)",
    deadLabel: "Dead time (s)",
    plant: "Plant",
    order: "-order",
    disturbance: "Disturbance",
    distMag: "Disturbance magnitude",
    pause: "⏸ Pause",
    play: "▶ Play",
    reset: "↺ Reset",
    spLegend: "Setpoint (SP)",
    pvLegend: "Output (PV)",
    mvLegend: "Control (MV)",
    timeUnit: "Time(s)",
    overshoot: "Overshoot",
    settling: "Settling time (±2%)",
    rise: "Rise time",
    ssErr: "Steady-state error",
    desc: "Plant = 1st-order lag (τ·dPV/dt + PV = K·u). Moving a slider re-simulates instantly. Kp↑ faster but oscillates, Ki↑ removes steady-state error but overshoots, Kd↑ suppresses oscillation. Anti-windup applied.",
  },
  zh: {
    slowStable: "缓慢稳定",
    kpLabel: "Kp (比例)",
    kiLabel: "Ki (积分)",
    kdLabel: "Kd (微分)",
    spLabel: "目标值 (SP)",
    tauLabel: "被控对象时间常数 τ (s)",
    deadLabel: "死区时间 (s)",
    plant: "被控对象",
    order: "阶",
    disturbance: "扰动",
    distMag: "扰动幅值",
    pause: "⏸ 停止",
    play: "▶ 播放",
    reset: "↺ 重置",
    spLegend: "目标 (SP)",
    pvLegend: "输出 (PV)",
    mvLegend: "控制量 (MV)",
    timeUnit: "时间(s)",
    overshoot: "超调",
    settling: "稳定时间 (±2%)",
    rise: "上升时间",
    ssErr: "稳态误差",
    desc: "被控对象 = 一阶滞后(τ·dPV/dt + PV = K·u)。移动滑块即时重新仿真。Kp↑ 更快但振荡，Ki↑ 消除稳态误差但超调，Kd↑ 抑制振荡。已应用抗积分饱和。",
  },
} as const;

interface Sim {
  pv: Pt[];
  u: Pt[];
  metrics: {
    overshoot: number;
    settling: number;
    rise: number;
    ssErr: number;
  };
}

interface PlantOpts {
  K: number; // 게인
  tau: number; // 시정수 s
  deadSteps: number; // 데드타임 (샘플)
  order: 1 | 2; // 플랜트 차수
  distTime: number; // 외란 주입 시각 s (<0 = 없음)
  distMag: number; // 외란 크기 (플랜트 입력 외란)
}

function simulate(
  Kp: number,
  Ki: number,
  Kd: number,
  sp: number,
  pl: PlantOpts,
): Sim {
  const dt = 0.02;
  const T = 12;
  const N = Math.round(T / dt);
  const uMax = 10;
  // 2차는 시정수를 절반씩 2단 직렬 → 동일 정착 스케일 유지
  const tauStage = pl.order === 2 ? pl.tau / 2 : pl.tau;

  let pv = 0;
  let x1 = 0; // 2차 1단 상태
  let integral = 0;
  let prevPv = 0;
  let dFilt = 0; // 미분 저역필터 상태
  const Tf = 8 * dt;
  const uHist: number[] = [];
  const pvPts: Pt[] = [];
  const uPts: Pt[] = [];

  let riseStart = -1;
  let riseEnd = -1;
  let maxPv = 0;
  let settling = T;

  for (let i = 0; i <= N; i++) {
    const t = i * dt;
    const err = sp - pv;

    // 미분: 측정값(PV) 기준 + 저역필터 → 미분킥/채터링 방지
    const dRaw = (pv - prevPv) / dt;
    dFilt += (dt / (Tf + dt)) * (dRaw - dFilt);

    let u = Kp * err + Ki * integral - Kd * dFilt;
    const uRaw = u;
    if (u > uMax) u = uMax;
    if (u < -uMax) u = -uMax;
    if (Math.abs(uRaw) < uMax) integral += err * dt;
    prevPv = pv;

    uHist.push(u);
    const uDelayed = uHist[Math.max(0, i - pl.deadSteps)];

    // 플랜트 입력 외란 (지정 시각 이후 계단 추가)
    const dist = pl.distTime >= 0 && t >= pl.distTime ? pl.distMag : 0;
    const plantIn = pl.K * (uDelayed + dist);

    if (pl.order === 2) {
      x1 += (dt / tauStage) * (plantIn - x1);
      pv += (dt / tauStage) * (x1 - pv);
    } else {
      pv += (dt / tauStage) * (plantIn - pv);
    }

    pvPts.push({ x: t, y: pv });
    uPts.push({ x: t, y: u });

    // 지표는 외란 전(추종) 구간 기준
    const trackWindow = pl.distTime < 0 || t < pl.distTime;
    if (sp > 0 && trackWindow) {
      if (riseStart < 0 && pv >= 0.1 * sp) riseStart = t;
      if (riseEnd < 0 && pv >= 0.9 * sp) riseEnd = t;
      if (pv > maxPv) maxPv = pv;
      if (Math.abs(pv - sp) > 0.02 * Math.abs(sp)) settling = t;
    }
  }

  const overshoot = sp > 0 ? Math.max(0, ((maxPv - sp) / sp) * 100) : 0;
  const ssErr = sp - pv;
  const rise = riseStart >= 0 && riseEnd >= 0 ? riseEnd - riseStart : 0;

  return { pv: pvPts, u: uPts, metrics: { overshoot, settling, rise, ssErr } };
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </label>
  );
}

const PRESETS: Record<string, [number, number, number]> = {
  "P only": [2, 0, 0],
  PI: [1.5, 1.2, 0],
  PID: [2.5, 1.5, 0.4],
  "느린 안정": [1, 0.4, 0.1],
};

export default function PidTool() {
  const t = TEXT[useLang()];
  const [kp, setKp] = useToolState("kp", 2.5);
  const [ki, setKi] = useToolState("ki", 1.5);
  const [kd, setKd] = useToolState("kd", 0.4);
  const [sp, setSp] = useToolState("sp", 1);
  const [tau, setTau] = useToolState("tau", 1);
  const [dead, setDead] = useToolState("dead", 0); // 데드타임 (초)
  const [order, setOrder] = useToolState<1 | 2>("order", 1); // 플랜트 차수
  const [distOn, setDistOn] = useToolState("distOn", false); // 외란 주입
  const [distMag, setDistMag] = useToolState("distMag", 0.5); // 외란 크기
  const DIST_TIME = 7; // 외란 주입 시각 (s)

  const sim = useMemo(
    () =>
      simulate(kp, ki, kd, sp, {
        K: 1,
        tau,
        deadSteps: Math.round(dead / 0.02),
        order: order as 1 | 2,
        distTime: distOn ? DIST_TIME : -1,
        distMag,
      }),
    [kp, ki, kd, sp, tau, dead, order, distOn, distMag],
  );

  // 애니메이션 마커 (스텝응답 재생)
  const [playing, setPlaying] = useState(true);
  const [marker, setMarker] = useState<number | null>(0);
  const raf = useRef(0);
  const last = useRef(0);
  useEffect(() => {
    if (!playing) return;
    last.current = 0;
    const tick = (ts: number) => {
      if (!last.current) last.current = ts;
      const dt = (ts - last.current) / 1000;
      last.current = ts;
      setMarker((m) => {
        const nv = (m ?? 0) + dt * 1.5; // 1.5x 속도
        return nv > 12 ? 0 : nv;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const m = sim.metrics;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([name, [p, i, d]]) => (
          <button
            key={name}
            onClick={() => {
              setKp(p);
              setKi(i);
              setKd(d);
            }}
            className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {name === "느린 안정" ? t.slowStable : name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label={t.kpLabel} value={kp} min={0} max={8} step={0.1} onChange={setKp} />
        <Slider label={t.kiLabel} value={ki} min={0} max={5} step={0.1} onChange={setKi} />
        <Slider label={t.kdLabel} value={kd} min={0} max={3} step={0.05} onChange={setKd} />
        <Slider label={t.spLabel} value={sp} min={0.2} max={3} step={0.1} onChange={setSp} />
        <Slider label={t.tauLabel} value={tau} min={0.2} max={4} step={0.1} onChange={setTau} />
        <Slider label={t.deadLabel} value={dead} min={0} max={1} step={0.05} onChange={setDead} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {/* 플랜트 차수 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{t.plant}</span>
          {([1, 2] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrder(o)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                o === order
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {o}{t.order}
            </button>
          ))}
        </div>

        {/* 외란 주입 */}
        <button
          onClick={() => setDistOn((d) => !d)}
          className={`rounded-md px-3 py-1.5 text-sm ${
            distOn
              ? "bg-amber-500 text-white hover:bg-amber-400"
              : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {t.disturbance} {distOn ? "ON" : "OFF"} (7s)
        </button>
        {distOn && (
          <div className="w-40">
            <Slider
              label={t.distMag}
              value={distMag}
              min={-1}
              max={1}
              step={0.1}
              onChange={setDistMag}
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {playing ? t.pause : t.play}
          </button>
          <button
            onClick={() => setMarker(0)}
            className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {t.reset}
          </button>
        </div>
      </div>

      <LineChart
        series={[
          {
            points: [
              { x: 0, y: sp },
              { x: 12, y: sp },
            ],
            color: PALETTE.rose,
            label: t.spLegend,
            dashed: true,
          },
          { points: sim.pv, color: PALETTE.indigo, label: t.pvLegend },
          { points: sim.u, color: PALETTE.emerald, label: t.mvLegend },
        ]}
        xMin={0}
        xMax={12}
        markerX={marker}
        refLines={
          distOn ? [{ x: DIST_TIME, color: PALETTE.amber, label: t.disturbance }] : undefined
        }
        xUnit={t.timeUnit}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat
          label={t.overshoot}
          value={fmtNum(m.overshoot, 1)}
          unit="%"
          accent={m.overshoot > 20}
        />
        <Stat label={t.settling} value={fmtNum(m.settling, 2)} unit="s" />
        <Stat label={t.rise} value={fmtNum(m.rise, 2)} unit="s" />
        <Stat
          label={t.ssErr}
          value={fmtNum(m.ssErr, 3)}
          accent={Math.abs(m.ssErr) > 0.05}
        />
      </div>

      <p className="text-xs text-zinc-500">{t.desc}</p>
    </div>
  );
}
