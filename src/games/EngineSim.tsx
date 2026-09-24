import { useEffect, useRef, useState } from "react";
import { useLang, type Lang } from "../components/i18n";
import { useToolState } from "../components/toolState";
import {
  EXHAUST,
  TRANS,
  WORKLET_SRC,
  effectiveLayout,
  engineName,
  firingPattern,
  idleRpm,
  newSim,
  peakTorque,
  shift,
  stepSim,
  type Crank,
  type ExhaustKind,
  type Layout,
  type Setup,
  type TransKind,
} from "./engine";

const L10N: Record<Lang, Record<string, string>> = {
  ko: {
    start: "🔑 시동",
    stop: "⏻ 시동 끄기",
    cranking: "크랭킹…",
    cyl: "기통수",
    layout: "배치",
    inline: "직렬",
    vee: "V형",
    flat: "수평대향",
    oddNote: "홀수 기통은 직렬만 가능",
    crank: "V8 크랭크",
    cross: "크로스플레인",
    flatplane: "플랫플레인",
    exhaust: "배기",
    stock: "순정",
    sport: "스포츠",
    straight: "직배기",
    trans: "미션",
    mt: "수동 6단",
    at: "자동 8단",
    dct: "DCT 7단",
    ecu: "ECU 맵핑",
    redline: "레드라인 (연료컷 리미터)",
    pop: "팝앤뱅 (오버런 후연소)",
    lc: "런치컨트롤 (2-step)",
    lcRpm: "런치 RPM",
    vol: "볼륨",
    gas: "⛽ 엑셀",
    brake: "🛑 브레이크",
    keys: "엑셀 패드는 위쪽을 누를수록 개도 큼(드래그 조절) · 키보드: Space/↑ 엑셀 · ↓ 브레이크 · ← − · → +",
    lcHint: "런치: 브레이크 + 엑셀 동시에 → 런치 RPM 유지, 브레이크 떼면 출발",
    noAudio: "이 브라우저는 AudioWorklet 을 지원하지 않아 소리 없이 시뮬레이션합니다",
    mapTitle: "맵핑 패턴 참고",
    map1: "하드컷 리미터 — 레드라인 도달 시 연료/점화 컷 반복(바운스), '밥밥밥' 소리",
    map2: "팝앤뱅 — 엑셀 오프(오버런) 시 점화 지각 + 연료 분사 → 배기관 후연소, 직배기일수록 크게",
    map3: "런치컨트롤 — 정차·브레이크·풀스로틀에서 리미터를 낮춰 회전수 고정, 출발 시 해제",
    map4: "변속 점화컷 — 수동(플랫시프트)·DCT 는 변속 순간 점화를 끊어 토크 단절, 자동은 부드럽게",
    limit: "LIMIT",
    launch: "LAUNCH",
    shifting: "SHIFT",
    torque: "Nm",
  },
  en: {
    start: "🔑 Start",
    stop: "⏻ Stop",
    cranking: "Cranking…",
    cyl: "Cylinders",
    layout: "Layout",
    inline: "Inline",
    vee: "V",
    flat: "Flat / Boxer",
    oddNote: "Odd cylinder counts are inline only",
    crank: "V8 crank",
    cross: "Cross-plane",
    flatplane: "Flat-plane",
    exhaust: "Exhaust",
    stock: "Stock",
    sport: "Sport",
    straight: "Straight pipe",
    trans: "Gearbox",
    mt: "Manual 6",
    at: "Auto 8",
    dct: "DCT 7",
    ecu: "ECU map",
    redline: "Redline (fuel-cut limiter)",
    pop: "Pops & bangs (overrun)",
    lc: "Launch control (2-step)",
    lcRpm: "Launch RPM",
    vol: "Volume",
    gas: "⛽ Throttle",
    brake: "🛑 Brake",
    keys: "Throttle pad: press higher for more opening (drag to adjust) · Keys: Space/↑ throttle · ↓ brake · ← − · → +",
    lcHint: "Launch: hold brake + throttle → holds launch RPM, release brake to go",
    noAudio: "AudioWorklet unsupported here — simulating without sound",
    mapTitle: "Common mapping patterns",
    map1: "Hard-cut limiter — fuel/spark cut cycles at redline (bounce), the 'bap-bap-bap'",
    map2: "Pops & bangs — on overrun, retard spark + inject fuel → afterburn in the exhaust, louder with straight pipes",
    map3: "Launch control — with brake + full throttle at standstill, a lower limiter holds RPM, released on launch",
    map4: "Shift cut — manual (flat shift) & DCT cut spark during the shift; auto blends torque instead",
    limit: "LIMIT",
    launch: "LAUNCH",
    shifting: "SHIFT",
    torque: "Nm",
  },
  zh: {
    start: "🔑 点火",
    stop: "⏻ 熄火",
    cranking: "启动中…",
    cyl: "气缸数",
    layout: "布局",
    inline: "直列",
    vee: "V型",
    flat: "水平对置",
    oddNote: "奇数缸只能直列",
    crank: "V8 曲轴",
    cross: "十字曲轴",
    flatplane: "平面曲轴",
    exhaust: "排气",
    stock: "原厂",
    sport: "运动",
    straight: "直排",
    trans: "变速箱",
    mt: "手动 6 挡",
    at: "自动 8 挡",
    dct: "DCT 7 挡",
    ecu: "ECU 调校",
    redline: "红线 (断油限转)",
    pop: "回火爆响 (收油)",
    lc: "弹射起步 (2-step)",
    lcRpm: "弹射转速",
    vol: "音量",
    gas: "⛽ 油门",
    brake: "🛑 刹车",
    keys: "油门板按得越靠上开度越大(可拖动) · 键盘: Space/↑ 油门 · ↓ 刹车 · ← − · → +",
    lcHint: "弹射: 刹车 + 油门同时按 → 保持弹射转速，松刹车起步",
    noAudio: "此浏览器不支持 AudioWorklet，无声模拟",
    mapTitle: "常见调校模式",
    map1: "硬断油限转 — 到红线反复断油/断火(弹跳)，'啪啪啪' 声",
    map2: "回火爆响 — 收油时推迟点火 + 喷油 → 排气管内后燃，直排更响",
    map3: "弹射起步 — 静止·刹车·全油门时降低限转固定转速，起步解除",
    map4: "换挡断火 — 手动(平踩换挡)与 DCT 换挡瞬间断火，自动则平顺过渡",
    limit: "LIMIT",
    launch: "LAUNCH",
    shifting: "SHIFT",
    torque: "Nm",
  },
};

interface Audio {
  ctx: AudioContext;
  node: AudioWorkletNode;
  pk1: BiquadFilterNode;
  pk2: BiquadFilterNode;
  lp: BiquadFilterNode;
  shaper: WaveShaperNode;
  gain: GainNode;
  p: Record<"rpm" | "thr" | "cut" | "pop", AudioParam>;
}

function shaperCurve(drive: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(drive * x) / Math.tanh(drive);
  }
  return c;
}

/** 워클릿 → HP → 공진 2단 → LP → 새추레이션 → 컴프 → 볼륨 */
async function buildAudio(): Promise<Audio> {
  const ctx = new AudioContext();
  if (!ctx.audioWorklet) throw new Error("no worklet");
  const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" }));
  try {
    await ctx.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
  await ctx.resume();
  const node = new AudioWorkletNode(ctx, "engine", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });
  const hp = new BiquadFilterNode(ctx, { type: "highpass", frequency: 35 });
  const pk1 = new BiquadFilterNode(ctx, { type: "peaking", frequency: 120, Q: 2, gain: 8 });
  const pk2 = new BiquadFilterNode(ctx, { type: "peaking", frequency: 320, Q: 3, gain: 4 });
  const lp = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 800, Q: 0.7 });
  const shaper = new WaveShaperNode(ctx, { curve: shaperCurve(2), oversample: "2x" });
  const comp = new DynamicsCompressorNode(ctx, { threshold: -12, ratio: 4, attack: 0.003, release: 0.12 });
  const gain = new GainNode(ctx, { gain: 0.3 });
  node.connect(hp).connect(pk1).connect(pk2).connect(lp).connect(shaper).connect(comp).connect(gain).connect(ctx.destination);
  const P = (k: string) => node.parameters.get(k)!;
  return { ctx, node, pk1, pk2, lp, shaper, gain, p: { rpm: P("rpm"), thr: P("thr"), cut: P("cut"), pop: P("pop") } };
}

const SEG_ON = "bg-violet-600 text-white";
const SEG_OFF = "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

function Seg<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: (v: T) => boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          disabled={disabled?.(o.v)}
          onClick={() => onChange(o.v)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${value === o.v ? SEG_ON : SEG_OFF}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 270° 스윕 타코미터. 레드존 + 바늘 + 중앙 기어/속도 */
function Tach({
  rpm,
  redline,
  gear,
  kmh,
  flags,
}: {
  rpm: number;
  redline: number;
  gear: number;
  kmh: number;
  flags: { text: string; on: boolean; color: string }[];
}) {
  const max = Math.ceil((redline + 500) / 1000) * 1000;
  const ang = (r: number) => -135 + 270 * Math.min(1, Math.max(0, r / max));
  const pt = (deg: number, rad: number): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [100 + rad * Math.sin(a), 100 - rad * Math.cos(a)];
  };
  const arc = (a0: number, a1: number, rad: number) => {
    const [x0, y0] = pt(a0, rad);
    const [x1, y1] = pt(a1, rad);
    return `M${x0},${y0} A${rad},${rad} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`;
  };
  const ticks = Array.from({ length: max / 500 + 1 }, (_, i) => i * 500);
  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-64 w-64 sm:h-72 sm:w-72">
      <circle cx="100" cy="100" r="96" fill="#09090b" stroke="#3f3f46" strokeWidth="2" />
      <path d={arc(-135, 135, 84)} fill="none" stroke="#27272a" strokeWidth="8" />
      <path d={arc(ang(redline), 135, 84)} fill="none" stroke="#dc2626" strokeWidth="8" />
      {ticks.map((r) => {
        const major = r % 1000 === 0;
        const [x0, y0] = pt(ang(r), major ? 70 : 74);
        const [x1, y1] = pt(ang(r), 79);
        const [lx, ly] = pt(ang(r), 58);
        return (
          <g key={r}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={r >= redline ? "#f87171" : "#e4e4e7"} strokeWidth={major ? 2 : 1} />
            {major && (
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={r >= redline ? "#f87171" : "#e4e4e7"} fontSize="11" fontWeight="700">
                {r / 1000}
              </text>
            )}
          </g>
        );
      })}
      <text x="100" y="150" textAnchor="middle" fill="#71717a" fontSize="7" fontWeight="600">
        ×1000 rpm
      </text>
      <text x="100" y="96" textAnchor="middle" fill="#fafafa" fontSize="34" fontWeight="800" fontFamily="ui-monospace, monospace">
        {gear === 0 ? "N" : gear}
      </text>
      <text x="100" y="118" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="ui-monospace, monospace">
        {Math.round(kmh)} km/h
      </text>
      <text x="100" y="134" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="ui-monospace, monospace">
        {Math.round(rpm)} rpm
      </text>
      <g transform={`rotate(${ang(rpm)} 100 100)`}>
        <line x1="100" y1="112" x2="100" y2="24" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="100" r="5" fill="#f97316" />
      {flags.map((f, i) => (
        <g key={f.text} transform={`translate(${100 + (i - (flags.length - 1) / 2) * 42} 172)`} opacity={f.on ? 1 : 0.15}>
          <rect x="-19" y="-7" width="38" height="14" rx="3" fill={f.color} />
          <text textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="8" fontWeight="800">
            {f.text}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function EngineSim() {
  const lang = useLang();
  const s = (k: string) => L10N[lang][k] ?? L10N.ko[k] ?? k;

  // 설정 (자동저장 + URL 공유)
  const [cyl, setCyl] = useToolState("cyl", 4);
  const [layoutRaw, setLayout] = useToolState<Layout>("layout", "inline");
  const [crankRaw, setCrank] = useToolState<Crank>("crank", "cross");
  const [exhaustRaw, setExhaust] = useToolState<ExhaustKind>("ex", "sport");
  const [transRaw, setTrans] = useToolState<TransKind>("tr", "mt");
  const [redline, setRedline] = useToolState("rl", 7500);
  const [popOn, setPopOn] = useToolState("pop", true);
  const [lcOn, setLcOn] = useToolState("lc", false);
  const [lcRpm, setLcRpm] = useToolState("lcrpm", 4000);
  const [vol, setVol] = useToolState("vol", 70);
  const layout = layoutRaw as Layout;
  const crank = crankRaw as Crank;
  const exhaust = exhaustRaw as ExhaustKind;
  const trans = transRaw as TransKind;
  const lay = effectiveLayout(cyl, layout);

  const [running, setRunning] = useState(false);
  const [noAudio, setNoAudio] = useState(false);
  const [view, setView] = useState({ rpm: 0, kmh: 0, gear: 0, cut: false, lc: false, shifting: false, cranking: false });
  const [pressed, setPressed] = useState({ gas: 0, brake: false });

  const simRef = useRef(newSim());
  const inputRef = useRef({ gas: 0, brake: false, thr: 0 }); // gas: 목표 개도 0~1
  const audioRef = useRef<Audio | null>(null);
  const setupRef = useRef<Setup & { exhaust: ExhaustKind; pop: boolean }>({ cyl, redline, trans, lcOn, lcRpm, exhaust, pop: popOn });
  setupRef.current = { cyl, redline, trans, lcOn, lcRpm, exhaust, pop: popOn };

  // 엔진 구성 → 워클릿
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.node.port.postMessage({
      fires: firingPattern(cyl, layout, crank),
      width: lay === "inline" ? 0 : 0.35,
      jit: 0.08 + 0.25 / cyl,
      bank: lay === "flat" ? [1, 0.7] : [1, 0.85],
    });
  }, [cyl, layout, crank, lay, running]);

  // 배기 → 필터 체인
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const e = EXHAUST[exhaust];
    a.node.port.postMessage({ tau: e.tau, noise: e.noise });
    a.pk1.frequency.value = e.f1;
    a.pk1.gain.value = e.g1;
    a.pk2.frequency.value = e.f1 * 2.7;
    a.pk2.gain.value = e.g1 / 2;
    a.shaper.curve = shaperCurve(e.drive);
  }, [exhaust, running]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.gain.gain.value = (vol / 100) * EXHAUST[exhaust].vol * 0.5;
  }, [vol, exhaust, running]);

  // 미션 바뀌면 중립
  useEffect(() => {
    simRef.current.gear = 0;
    simRef.current.shiftT = 0;
  }, [trans]);

  const doShift = (dir: 1 | -1) => {
    if (!running) return;
    shift(simRef.current, dir, setupRef.current);
  };

  const start = async () => {
    Object.assign(simRef.current, newSim());
    inputRef.current.thr = 0;
    setRunning(true);
    try {
      const a = await buildAudio();
      audioRef.current = a;
      setNoAudio(false);
    } catch {
      audioRef.current = null;
      setNoAudio(true);
    }
  };
  const stop = () => {
    setRunning(false);
    audioRef.current?.ctx.close();
    audioRef.current = null;
    setView({ rpm: 0, kmh: 0, gear: 0, cut: false, lc: false, shifting: false, cranking: false });
  };
  useEffect(() => () => void audioRef.current?.ctx.close(), []);

  // 물리 + 오디오 루프
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const startAt = last + 500; // 크랭킹
    const sim = simRef.current;
    let liftAt = -1e9; // 엑셀 뗀 시각 — 직후 0.7초는 팝이 잦다 (미연소 연료 배출)
    let prevThr = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const set = setupRef.current;
      const inp = inputRef.current;
      const tr = TRANS[set.trans];
      const cranking = now < startAt;
      if (!cranking) {
        if (sim.rpm === 0) sim.rpm = idleRpm(set.cyl) + 700; // 시동 플레어
        inp.thr += Math.max(-dt * 10, Math.min(dt * 6, inp.gas - inp.thr));
        stepSim(sim, { thr: inp.thr, brake: inp.brake }, set, dt);
      }
      if (prevThr > 0.4 && inp.thr < 0.1) liftAt = now;
      prevThr = inp.thr;
      const loaded = inp.thr > 0.2;
      // 변속컷은 부하 걸린 채 변속(플랫시프트)할 때만 — N→1 같은 무부하 변속엔 컷/팝 없음
      const cut = !cranking && (sim.cut || (sim.shiftT > 0 && tr.cutOnShift && loaded));
      const overrun =
        inp.thr < 0.1 && sim.rpm > 2500
          ? (0.25 + 0.55 * Math.min(1, (sim.rpm - 2500) / 3000)) * (now - liftAt < 700 ? 1.6 : 1)
          : 0;
      const pop = set.pop && !cranking ? EXHAUST[set.exhaust].popMul * (cut ? (loaded ? 0.7 : 0) : overrun) : 0;
      const thrA = sim.blipT > 0 ? Math.max(inp.thr, 0.7) : inp.thr; // 다운시프트 레브매칭 블립
      const a = audioRef.current;
      if (a) {
        const t = a.ctx.currentTime;
        a.p.rpm.setTargetAtTime(cranking ? 250 : sim.rpm, t, 0.02);
        a.p.thr.setTargetAtTime(thrA, t, 0.03);
        a.p.cut.setValueAtTime(cut ? 1 : 0, t);
        a.p.pop.setValueAtTime(Math.min(1, pop), t);
        a.lp.frequency.setTargetAtTime(EXHAUST[set.exhaust].lp * (0.55 + 0.45 * thrA), t, 0.05);
      }
      setView({
        rpm: cranking ? 250 : sim.rpm,
        kmh: sim.v * 3.6,
        gear: sim.gear,
        cut: sim.cut,
        lc: sim.lc,
        shifting: sim.shiftT > 0,
        cranking,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // 키보드
  useEffect(() => {
    if (!running) return;
    const setKey = (e: KeyboardEvent, down: boolean) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      let hit = true;
      switch (e.code) {
        case "Space":
        case "ArrowUp":
        case "KeyW":
          inputRef.current.gas = down ? 1 : 0;
          break;
        case "ArrowDown":
        case "KeyS":
        case "KeyB":
          inputRef.current.brake = down;
          break;
        case "ArrowRight":
        case "KeyE":
          if (down && !e.repeat) doShift(1);
          break;
        case "ArrowLeft":
        case "KeyQ":
          if (down && !e.repeat) doShift(-1);
          break;
        default:
          hit = false;
      }
      if (hit) {
        e.preventDefault();
        setPressed({ gas: inputRef.current.gas, brake: inputRef.current.brake });
      }
    };
    const kd = (e: KeyboardEvent) => setKey(e, true);
    const ku = (e: KeyboardEvent) => setKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const syncPressed = () => setPressed({ gas: inputRef.current.gas, brake: inputRef.current.brake });
  // 포인터 캡처: 누른 채 손가락이 버튼 밖으로 나가도 유지, 놓으면 해제. 멀티터치는 포인터별이라 엑셀 누른 채 변속 가능
  const capture = (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 무시 */
    }
  };
  /** 엑셀 패드: 누른 세로 위치가 개도 — 위쪽 100%, 아래쪽 10%. 누른 채 드래그로 조절 */
  const gasFrom = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - r.top) / Math.max(1, r.height);
    inputRef.current.gas = Math.max(0.1, Math.min(1, 1.08 - y));
    syncPressed();
  };
  const gasRelease = () => {
    inputRef.current.gas = 0;
    syncPressed();
  };
  const gasProps = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      capture(e);
      gasFrom(e);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) gasFrom(e);
    },
    onPointerUp: gasRelease,
    onPointerCancel: gasRelease,
    onLostPointerCapture: gasRelease,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
  const brakeSet = (down: boolean) => {
    inputRef.current.brake = down;
    syncPressed();
  };
  const brakeProps = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      capture(e);
      brakeSet(true);
    },
    onPointerUp: () => brakeSet(false),
    onPointerCancel: () => brakeSet(false),
    onLostPointerCapture: () => brakeSet(false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
  const shiftBtn = (dir: 1 | -1) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault();
      doShift(dir);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const gears = TRANS[trans].gears;
  const name = `${engineName(cyl, layout)}${lay === "vee" && cyl === 8 ? ` ${s(crank === "cross" ? "cross" : "flatplane")}` : ""} · ${(cyl * 0.5).toFixed(1)} L · ${peakTorque(cyl)} ${s("torque")}`;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* 대시보드 */}
      <div className="select-none rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-white shadow-xl">
        <div className="mb-1 text-center font-mono text-xs tracking-widest text-zinc-400">{name}</div>
        <Tach
          rpm={view.rpm}
          redline={redline}
          gear={view.gear}
          kmh={view.kmh}
          flags={[
            { text: s("limit"), on: view.cut && !view.lc, color: "#dc2626" },
            { text: s("launch"), on: view.lc, color: "#2563eb" },
            { text: s("shifting"), on: view.shifting, color: "#d97706" },
          ]}
        />

        {/* 왼쪽: 변속 패들 + 브레이크 (왼손) · 오른쪽: 세로 엑셀 패드 (오른손, 누른 높이 = 개도) */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="grid grid-rows-[auto_1fr] gap-2">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
              <button
                type="button"
                disabled={!running}
                className="h-16 touch-none rounded-2xl bg-zinc-800 text-3xl font-bold text-zinc-200 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-30"
                {...shiftBtn(-1)}
              >
                −
              </button>
              <div className="flex w-14 flex-col items-center justify-center rounded-2xl border border-zinc-700 font-mono">
                <div className="text-3xl font-bold">{view.gear === 0 ? "N" : view.gear}</div>
                <div className="text-[10px] text-zinc-500">/ {gears}</div>
              </div>
              <button
                type="button"
                disabled={!running}
                className="h-16 touch-none rounded-2xl bg-zinc-800 text-3xl font-bold text-zinc-200 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-30"
                {...shiftBtn(1)}
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={!running}
              className={`flex min-h-24 touch-none items-center justify-center rounded-2xl text-lg font-bold transition-colors disabled:opacity-30 ${
                pressed.brake ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              }`}
              {...brakeProps}
            >
              {s("brake")}
            </button>
          </div>
          <button
            type="button"
            disabled={!running}
            className="relative min-h-44 touch-none overflow-hidden rounded-2xl bg-zinc-800 text-lg font-bold text-zinc-200 disabled:opacity-30 sm:min-h-52"
            {...gasProps}
          >
            <div
              className="absolute inset-x-0 bottom-0 bg-emerald-500/80"
              style={{ height: `${Math.round(pressed.gas * 100)}%` }}
            />
            {[25, 50, 75].map((p) => (
              <div key={p} className="absolute inset-x-3 border-t border-dashed border-white/15" style={{ bottom: `${p}%` }} />
            ))}
            <div className="relative flex flex-col items-center">
              <span>{s("gas")}</span>
              <span className="font-mono text-sm">{Math.round(pressed.gas * 100)}%</span>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={running ? stop : start}
          className={`mt-3 w-full rounded-xl py-3 text-base font-bold transition-colors ${
            running ? "bg-zinc-700 hover:bg-zinc-600" : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {view.cranking ? s("cranking") : running ? s("stop") : s("start")}
        </button>
        <p className="mt-2 text-center text-[11px] text-zinc-500">{s("keys")}</p>
        {noAudio && <p className="mt-1 text-center text-xs text-amber-400">{s("noAudio")}</p>}
      </div>

      {/* 설정 */}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <div className="mb-1 flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span>{s("cyl")}</span>
            <span className="font-mono">{cyl}</span>
          </div>
          <input type="range" min={1} max={12} step={1} value={cyl} onChange={(e) => setCyl(Number(e.target.value))} className="w-full accent-violet-600" />
        </label>
        <div>
          <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {s("layout")}
            {cyl % 2 === 1 && <span className="ml-2 text-xs text-zinc-500">{s("oddNote")}</span>}
          </div>
          <Seg
            value={lay}
            options={[
              { v: "inline", label: s("inline") },
              { v: "vee", label: s("vee") },
              { v: "flat", label: s("flat") },
            ]}
            onChange={setLayout}
            disabled={(v) => v !== "inline" && cyl % 2 === 1}
          />
          {lay === "vee" && cyl === 8 && (
            <div className="mt-2">
              <div className="mb-1 text-xs text-zinc-500">{s("crank")}</div>
              <Seg
                value={crank}
                options={[
                  { v: "cross", label: s("cross") },
                  { v: "flat", label: s("flatplane") },
                ]}
                onChange={setCrank}
              />
            </div>
          )}
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">{s("exhaust")}</div>
          <Seg
            value={exhaust}
            options={[
              { v: "stock", label: s("stock") },
              { v: "sport", label: s("sport") },
              { v: "straight", label: s("straight") },
            ]}
            onChange={setExhaust}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">{s("trans")}</div>
          <Seg
            value={trans}
            options={[
              { v: "mt", label: s("mt") },
              { v: "at", label: s("at") },
              { v: "dct", label: s("dct") },
            ]}
            onChange={setTrans}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700 sm:col-span-2">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{s("ecu")}</div>
          <label className="block">
            <div className="mb-1 flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
              <span>{s("redline")}</span>
              <span className="font-mono">{redline}</span>
            </div>
            <input type="range" min={5000} max={10000} step={250} value={redline} onChange={(e) => setRedline(Number(e.target.value))} className="w-full accent-red-600" />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={popOn} onChange={(e) => setPopOn(e.target.checked)} className="accent-violet-600" />
            {s("pop")}
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={lcOn} onChange={(e) => setLcOn(e.target.checked)} className="accent-violet-600" />
            {s("lc")}
          </label>
          {lcOn && (
            <label className="block pl-6">
              <div className="mb-1 flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
                <span>{s("lcRpm")}</span>
                <span className="font-mono">{lcRpm}</span>
              </div>
              <input type="range" min={2500} max={6500} step={250} value={lcRpm} onChange={(e) => setLcRpm(Number(e.target.value))} className="w-full accent-blue-600" />
              <p className="mt-1 text-xs text-zinc-500">{s("lcHint")}</p>
            </label>
          )}
          <label className="block">
            <div className="mb-1 flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
              <span>{s("vol")}</span>
              <span className="font-mono">{vol}%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={vol} onChange={(e) => setVol(Number(e.target.value))} className="w-full accent-violet-600" />
          </label>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-100 p-4 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        <div className="mb-1 font-semibold text-zinc-800 dark:text-zinc-200">{s("mapTitle")}</div>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>{s("map1")}</li>
          <li>{s("map2")}</li>
          <li>{s("map3")}</li>
          <li>{s("map4")}</li>
        </ul>
      </div>
    </div>
  );
}
