/**
 * 엔진 시뮬레이터 — 순수 로직 (점화 패턴 · 변속기 · 차량 물리 · 배기 프리셋 · 오디오 워클릿 소스).
 * React 없음 → `npm run check:games` 로 node 에서 검사.
 */

export type Layout = "inline" | "vee" | "flat";
export type Crank = "cross" | "flat"; // V8 전용: 크로스플레인 / 플랫플레인
export type ExhaustKind = "stock" | "sport" | "straight";
export type TransKind = "mt" | "at" | "dct";

/** 점화 이벤트: 크랭크각 a (0~720°, 4행정 1사이클) · 배기 뱅크 b (0/1) */
export interface Fire {
  a: number;
  b: number;
}

/** V/수평대향은 짝수 기통만 — 홀수면 직렬로 강제 */
export function effectiveLayout(cyl: number, layout: Layout): Layout {
  return cyl % 2 === 1 ? "inline" : layout;
}

/**
 * 4행정 점화 패턴. 기본은 등간격 720/N, 뱅크는 V/수평대향에서 교대.
 * 예외 — V2 90°: 270/450 부등간격. V8 크로스플레인: 뱅크 순서 L R R L R L L R (버블 사운드의 원인).
 * 수평대향: 부등장 헤더 흉내로 2번 뱅크 배기 도달을 20° 늦춤 (스바루 럼블).
 */
export function firingPattern(cyl: number, layout: Layout, crank: Crank = "cross"): Fire[] {
  const n = Math.max(1, Math.min(12, Math.round(cyl)));
  const lay = effectiveLayout(n, layout);
  const step = 720 / n;
  if (lay === "inline") return Array.from({ length: n }, (_, i) => ({ a: i * step, b: 0 }));
  if (lay === "vee" && n === 2) return [{ a: 0, b: 0 }, { a: 270, b: 1 }];
  const banks =
    lay === "vee" && n === 8 && crank === "cross"
      ? [0, 1, 1, 0, 1, 0, 0, 1]
      : Array.from({ length: n }, (_, i) => i % 2);
  const lag = lay === "flat" ? 20 : 0;
  return banks.map((b, i) => ({ a: (i * step + b * lag) % 720, b }));
}

export function engineName(cyl: number, layout: Layout): string {
  const lay = effectiveLayout(cyl, layout);
  return `${lay === "inline" ? "I" : lay === "vee" ? "V" : "F"}${cyl}`;
}

// ── 변속기 ──────────────────────────────────────────────
export const TRANS: Record<
  TransKind,
  { gears: number; auto: boolean; shiftMs: number; cutOnShift: boolean }
> = {
  mt: { gears: 6, auto: false, shiftMs: 220, cutOnShift: true },
  at: { gears: 8, auto: true, shiftMs: 320, cutOnShift: false },
  dct: { gears: 7, auto: true, shiftMs: 70, cutOnShift: true },
};

/** 기어비: 1단 3.6 → 최종단 0.65 등비수열 */
export function gearRatios(n: number): number[] {
  if (n < 2) return [3.6];
  return Array.from({ length: n }, (_, i) => 3.6 * Math.pow(0.65 / 3.6, i / (n - 1)));
}

// ── 차량 상수 (ponytail: 1.3t 승용차 고정, 차종 선택은 필요해지면) ──
const MASS = 1300;
const WHEEL_R = 0.31;
const FINAL = 3.9;
const DRAG = 0.4; // 0.5·ρ·Cd·A
const ROLL = 0.012 * MASS * 9.81;
const BRAKE = 16 * MASS;
const EFF = 0.9;
export const STALL_RPM = 2500; // 정지 출발 시 컨버터/클러치 슬립 플레어 상한

export function wheelRpm(v: number, ratio: number): number {
  return (v / (2 * Math.PI * WHEEL_R)) * 60 * ratio * FINAL;
}
export function speedAt(rpm: number, ratio: number): number {
  return (rpm / 60 / ratio / FINAL) * 2 * Math.PI * WHEEL_R;
}
export function idleRpm(cyl: number): number {
  return cyl === 1 ? 1300 : cyl === 2 ? 1100 : 850;
}
/** 기통당 0.5L · 50Nm 가정 */
export function peakTorque(cyl: number): number {
  return 50 * cyl;
}
/** 정규화 토크 곡선: 아이들 0.55 → 레드라인 60% 에서 1.0 → 레드라인 0.8 */
export function torqueShape(x: number): number {
  const c = Math.max(0, Math.min(1.2, x));
  return c < 0.6 ? 0.55 + (0.45 * c) / 0.6 : 1 - (0.2 * (c - 0.6)) / 0.4;
}

// ── 시뮬레이션 ──────────────────────────────────────────
export interface Sim {
  rpm: number;
  v: number; // m/s
  gear: number; // 0 = N
  cut: boolean; // 리미터 점화 컷 중
  cutT: number; // 컷 남은 시간
  fireT: number; // 컷 해제 후 최소 점화 유지 시간
  shiftT: number; // 변속 중 남은 시간
  lc: boolean; // 런치컨트롤 활성
}
export interface Input {
  thr: number; // 0~1
  brake: boolean;
}
export interface Setup {
  cyl: number;
  redline: number;
  trans: TransKind;
  lcOn: boolean;
  lcRpm: number;
}

export function newSim(): Sim {
  return { rpm: 0, v: 0, gear: 0, cut: false, cutT: 0, fireT: 0, shiftT: 0, lc: false };
}

/** 변속. 오버레브(레드라인+300 초과)가 될 다운시프트는 거부 → false */
export function shift(s: Sim, dir: 1 | -1, set: Setup): boolean {
  const tr = TRANS[set.trans];
  const g = s.gear + dir;
  if (g < 0 || g > tr.gears || s.shiftT > 0) return false;
  if (g >= 1 && wheelRpm(s.v, gearRatios(tr.gears)[g - 1]) > set.redline + 300) return false;
  s.gear = g;
  s.shiftT = tr.shiftMs / 1000;
  return true;
}

/**
 * 한 스텝 (dt 초). 중립은 rpm/s 단위 간단 관성, 기어 물림 시 rpm 은 차속에서 역산(저속은 슬립 플레어).
 * 리미터는 50ms 컷 / 30ms 점화 반복 → 바운스. 런치컨트롤 = 브레이크+엑셀 정지 상태에서 리미터를 lcRpm 으로.
 */
export function stepSim(s: Sim, inp: Input, set: Setup, dt: number): void {
  const tr = TRANS[set.trans];
  const ratios = gearRatios(tr.gears);
  const idle = idleRpm(set.cyl);
  const Tpk = peakTorque(set.cyl);

  s.lc = set.lcOn && inp.brake && s.v < 0.3 && inp.thr > 0.5;
  const limit = s.lc ? set.lcRpm : set.redline;

  if (s.cut) {
    s.cutT -= dt;
    if (s.cutT <= 0) {
      s.cut = false;
      s.fireT = 0.03;
    }
  } else {
    s.fireT -= dt;
    if (s.rpm >= limit && s.fireT <= 0) {
      s.cut = true;
      s.cutT = 0.05;
    }
  }
  if (s.shiftT > 0) s.shiftT -= dt;
  const shifting = s.shiftT > 0;

  const x = s.rpm / set.redline;
  const load = s.cut ? 0 : shifting ? (tr.cutOnShift ? 0 : 0.3) : 1;
  const Teng = Tpk * torqueShape(x) * inp.thr * load;

  if (s.gear === 0) {
    const rise = 16000 / (1 + set.cyl / 12); // 큰 엔진일수록 느리게 회전 상승
    const drpm = rise * (Teng / Tpk - 0.45 * Math.max(0.15, x));
    s.rpm = Math.min(limit + 150, Math.max(idle, s.rpm + drpm * dt));
    s.v = Math.max(0, s.v - ((DRAG * s.v * s.v + ROLL + (inp.brake ? BRAKE : 0)) / MASS) * dt);
  } else {
    const ratio = ratios[s.gear - 1];
    const k = (ratio * FINAL * EFF) / WHEEL_R; // Nm → N
    const engineBrake = inp.thr < 0.1 && !shifting ? 0.15 * Tpk * x : 0;
    const F = (Teng - engineBrake) * k - DRAG * s.v * s.v - ROLL - (inp.brake ? BRAKE : 0);
    s.v = Math.max(0, s.v + (F / MASS) * dt);
    if (inp.brake && s.v < 1) s.v = 0; // 브레이크 홀드
    s.v = Math.min(s.v, speedAt(limit + 150, ratio)); // 리미터 이상 못 넘음

    const wr = wheelRpm(s.v, ratio);
    const flareTop = s.lc ? set.lcRpm + 150 : STALL_RPM;
    const target = Math.max(wr, idle + inp.thr * (flareTop - idle) * Math.max(0, 1 - wr / flareTop));
    const maxD = 15000 * dt;
    s.rpm += Math.max(-maxD, Math.min(maxD, target - s.rpm));
    s.rpm = Math.min(s.rpm, limit + 150);

    if (tr.auto && !shifting && !s.lc) {
      if (s.gear < tr.gears && x > (inp.thr > 0.5 ? 0.93 : 0.5)) shift(s, 1, set);
      else if (s.gear > 1 && (x < 0.18 || (inp.thr > 0.9 && x < 0.45))) shift(s, -1, set);
    }
  }
  if (inp.brake && s.v < 1) s.v = 0;
}

// ── 배기 프리셋 (필터 체인 + 워클릿 펄스 성격) ───────────
export const EXHAUST: Record<
  ExhaustKind,
  { lp: number; f1: number; g1: number; drive: number; tau: number; noise: number; popMul: number; vol: number }
> = {
  stock: { lp: 700, f1: 110, g1: 8, drive: 1.5, tau: 0.012, noise: 0.25, popMul: 0.4, vol: 0.6 },
  sport: { lp: 1800, f1: 140, g1: 6, drive: 2.5, tau: 0.008, noise: 0.4, popMul: 1, vol: 0.85 },
  straight: { lp: 4500, f1: 170, g1: 4, drive: 5, tau: 0.005, noise: 0.6, popMul: 1.4, vol: 1 },
};

/**
 * AudioWorklet 프로세서 소스. Blob URL 로 로드 (별도 파일/번들 설정 없음).
 * 원리: 크랭크각을 샘플 단위로 진행, 점화각 통과 시 뱅크별 배기 펄스(한쪽 방향 지수감쇠 + 노이즈) 발생.
 * 펄스열이 밖의 공진/로우패스/새추레이션 체인을 지나며 배기음이 된다. 파라미터: rpm · thr(부하) · cut(점화컷) · pop(후연소 확률).
 */
export const WORKLET_SRC = `
class EngineProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "rpm", defaultValue: 0, minValue: 0, maxValue: 20000, automationRate: "k-rate" },
      { name: "thr", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "cut", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "pop", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
    ];
  }
  constructor() {
    super();
    this.ang = 0;
    this.fires = [{ a: 0, b: 0 }];
    this.env = [0, 0];
    this.penv = [0, 0];
    this.tau = 0.008;
    this.decay = Math.exp(-1 / (this.tau * sampleRate));
    this.pdecay = Math.exp(-1 / (0.03 * sampleRate));
    this.noise = 0.4;
    this.jit = 0.15;
    this.width = 0;
    this.bank = [1, 0.85];
    this.port.onmessage = (e) => {
      const d = e.data;
      if (d.fires) this.fires = d.fires;
      if (d.tau) { this.tau = d.tau; this.decay = Math.exp(-1 / (d.tau * sampleRate)); }
      if (d.noise !== undefined) this.noise = d.noise;
      if (d.jit !== undefined) this.jit = d.jit;
      if (d.width !== undefined) this.width = d.width;
      if (d.bank) this.bank = d.bank;
    };
  }
  process(inputs, outputs, p) {
    const out = outputs[0];
    const L = out[0];
    const R = out[1] || L;
    const rpm = p.rpm[0], thr = p.thr[0], cut = p.cut[0] > 0.5, pop = p.pop[0];
    const dA = (rpm * 6) / sampleRate; // deg/sample
    const fires = this.fires, n = fires.length, env = this.env, penv = this.penv;
    const dec = this.decay, pdec = this.pdecay, noise = this.noise, jit = this.jit, width = this.width, bank = this.bank;
    const fps = Math.max(1, (n * rpm) / 120); // 초당 점화 수
    const amp = (0.3 + 0.7 * thr) / Math.sqrt(Math.max(1, fps * this.tau)); // 펄스 겹침 정규화
    const pp = pop * Math.min(1, 30 / fps); // 팝은 초당 수십 회 이내
    for (let i = 0; i < L.length; i++) {
      if (dA > 0) {
        const a0 = this.ang, a1 = a0 + dA;
        for (let k = 0; k < n; k++) {
          const f = fires[k];
          let a = f.a;
          if (a <= a0) a += 720;
          if (a <= a1) {
            if (cut) {
              if (pp > 0 && Math.random() < pp) penv[f.b] += 2 + 2 * Math.random();
            } else {
              env[f.b] += amp * bank[f.b] * (1 + jit * (Math.random() * 2 - 1));
              if (pp > 0 && Math.random() < pp) penv[f.b] += 1.5 + 2 * Math.random();
            }
            if (penv[f.b] > 8) penv[f.b] = 8;
          }
        }
        this.ang = a1 >= 720 ? a1 - 720 : a1;
      }
      const w0 = Math.random() * 2 - 1, w1 = Math.random() * 2 - 1;
      const s0 = env[0] * (1 + noise * w0) + penv[0] * (0.4 + 1.5 * w0);
      const s1 = env[1] * (1 + noise * w1) + penv[1] * (0.4 + 1.5 * w1);
      env[0] *= dec; env[1] *= dec; penv[0] *= pdec; penv[1] *= pdec;
      const m = (s0 + s1) * 0.6, d = (s0 - s1) * width;
      L[i] = m + d;
      R[i] = m - d;
    }
    return true;
  }
}
registerProcessor("engine", EngineProcessor);
`;
