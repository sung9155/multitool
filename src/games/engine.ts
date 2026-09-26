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

/** 수평대향 부등장 헤더 흉내: 2번 뱅크 배기 도달 20° 지연 (스바루 럼블) */
export const FLAT_LAG = 20;
/** 실린더 번호 → 뱅크 규칙. oddEven: 홀수 = 뱅크 0 (GM 식). halves: 1..n/2 = 뱅크 0 (Ford·포르쉐·알파 식) */
export const oddEven = (c: number): 0 | 1 => (c % 2 === 0 ? 1 : 0);
export const halvesOf =
  (n: number) =>
  (c: number): 0 | 1 =>
    c > n / 2 ? 1 : 0;

/** 점화순서(실린더 번호열) → 등간격 점화 이벤트. cycle: 4행정 720 / 2행정 360 */
export function firesFromOrder(order: number[], bankOf: (c: number) => 0 | 1, cycle = 720, lag = 0): Fire[] {
  const step = cycle / order.length;
  return order.map((c, i) => {
    const b = bankOf(c);
    return { a: (i * step + b * lag) % cycle, b };
  });
}

/** "1-8-4-3-6-5-7-2" → [1,8,…]. 1..n 순열이 아니면 null */
export function parseOrder(text: string, n: number): number[] | null {
  const nums = text.split(/[^0-9]+/).filter(Boolean).map(Number);
  if (nums.length !== n || new Set(nums).size !== n || nums.some((c) => c < 1 || c > n)) return null;
  return nums;
}

/**
 * 4행정 점화 패턴. 기본은 등간격 720/N, 뱅크는 V/수평대향에서 교대.
 * 예외 — V2 90°: 270/450 부등간격. V8 크로스플레인: 뱅크 순서 L R R L R L L R (버블 사운드의 원인).
 * order 를 주면 그 순서대로 점화하고 뱅크는 홀수/짝수 규칙 (직렬은 뱅크 하나라 무관).
 */
export function firingPattern(cyl: number, layout: Layout, crank: Crank = "cross", order?: number[]): Fire[] {
  const n = Math.max(1, Math.min(12, Math.round(cyl)));
  const lay = effectiveLayout(n, layout);
  const step = 720 / n;
  if (lay === "inline") return Array.from({ length: n }, (_, i) => ({ a: i * step, b: 0 }));
  const lag = lay === "flat" ? FLAT_LAG : 0;
  if (order && order.length === n) return firesFromOrder(order, oddEven, 720, lag);
  if (lay === "vee" && n === 2) return [{ a: 0, b: 0 }, { a: 270, b: 1 }];
  const banks =
    lay === "vee" && n === 8 && crank === "cross"
      ? [0, 1, 1, 0, 1, 0, 0, 1]
      : Array.from({ length: n }, (_, i) => i % 2);
  return banks.map((b, i) => ({ a: (i * step + b * lag) % 720, b }));
}

/** 기본 패턴과 같은 뱅크 순서를 내는 점화순서 표기 (홀수 = 뱅크 0). UI 초기값용 */
export function defaultOrder(cyl: number, layout: Layout, crank: Crank = "cross"): number[] {
  const banks = firingPattern(cyl, layout, crank).map((f) => f.b);
  const pool: number[][] = [[], []];
  for (let c = 1; c <= cyl; c++) pool[oddEven(c)].push(c);
  return banks.map((b) => pool[b].shift() ?? pool[1 - b].shift() ?? 1);
}

export function engineName(cyl: number, layout: Layout): string {
  const lay = effectiveLayout(cyl, layout);
  return `${lay === "inline" ? "I" : lay === "vee" ? "V" : "F"}${cyl}`;
}

// ── 변속기 ──────────────────────────────────────────────
/** sync: 변속 중 rpm 이 새 기어 회전수로 수렴하는 1차 지연 속도(1/s). 작을수록 부드럽게(AT 컨버터), 클수록 빠르게(DCT) */
export const TRANS: Record<
  TransKind,
  { gears: number; auto: boolean; shiftMs: number; cutOnShift: boolean; sync: number }
> = {
  mt: { gears: 6, auto: false, shiftMs: 220, cutOnShift: true, sync: 7 },
  at: { gears: 8, auto: true, shiftMs: 320, cutOnShift: false, sync: 4 },
  dct: { gears: 7, auto: true, shiftMs: 70, cutOnShift: true, sync: 10 },
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
const BRAKE = 6 * MASS; // 0.6g 제동 (정차 홀드는 별도라 런치컨트롤엔 영향 없음)
const TRACTION_G = 0.65; // 구동 접지 한계 — 스트리트 타이어 후륜 하중 이동 포함 (ponytail: 휠스핀 rpm 분리는 없음, 힘만 캡)
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
/** 정규화 토크 곡선 형태: 0 rpm 에서 floor → 레드라인×peakAt 에서 1.0 → 레드라인에서 end (선형 두 구간) */
export interface Curve {
  floor: number;
  peakAt: number;
  end: number;
}
export const CUSTOM_CURVE: Curve = { floor: 0.55, peakAt: 0.6, end: 0.8 };
export function torqueShape(x: number, c: Curve = CUSTOM_CURVE): number {
  const v = Math.max(0, Math.min(1.2, x));
  return v < c.peakAt ? c.floor + (1 - c.floor) * (v / c.peakAt) : 1 - (1 - c.end) * ((v - c.peakAt) / (1 - c.peakAt));
}
/** 중립 회전 상승률(rpm/s): 토크/배기량 비와 레드라인이 높으면 빠르고, 배기량이 크면(관성) 느리다 */
export function revRate(torque: number, liters: number, redline: number): number {
  const r = (12000 * Math.sqrt(torque / (liters * 90)) * Math.sqrt(redline / 7500)) / (1 + liters / 8);
  return Math.max(4000, Math.min(24000, r));
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
  blipT: number; // 다운시프트 레브매칭 블립 남은 시간 (소리용)
  autoT: number; // 자동변속 쿨다운 (변속 직후 · 엑셀 뗀 직후 기어 유지)
  manualT: number; // 자동 미션에서 패들 개입 후 수동 유지 시간 (보호 변속만)
  prevThr: number;
  lc: boolean; // 런치컨트롤 활성
  slip: boolean; // 구동력이 접지 한계를 넘음 (표시용)
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
  /** 프리셋 엔진이면 지정, 없으면 기통수에서 추정 */
  torque?: number;
  idle?: number;
  liters?: number;
  curve?: Curve;
}

export function newSim(): Sim {
  return { rpm: 0, v: 0, gear: 0, cut: false, cutT: 0, fireT: 0, shiftT: 0, blipT: 0, autoT: 0, manualT: 0, prevThr: 0, lc: false, slip: false };
}

/**
 * 변속. 오버레브(레드라인+300 초과)가 될 다운시프트는 거부 → false.
 * manual: 사용자 패들 조작. 자동 미션에서 주행 기어 간 패들 조작이면 8초간 수동 유지(자동은 보호 변속만).
 */
export function shift(s: Sim, dir: 1 | -1, set: Setup, manual = false): boolean {
  const tr = TRANS[set.trans];
  const g = s.gear + dir;
  if (g < 0 || g > tr.gears || s.shiftT > 0) return false;
  if (g >= 1 && wheelRpm(s.v, gearRatios(tr.gears)[g - 1]) > set.redline + 300) return false;
  if (manual && tr.auto && s.gear >= 1 && g >= 1) s.manualT = 8;
  // 주행 중 다운시프트: 수동/DCT 는 레브매칭 블립 (AT 는 컨버터가 부드럽게 올림)
  if (dir === -1 && g >= 1 && s.v > 2 && tr.cutOnShift) s.blipT = 0.18;
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
  const idle = set.idle ?? idleRpm(set.cyl);
  const Tpk = set.torque ?? peakTorque(set.cyl);
  const liters = set.liters ?? set.cyl * 0.5;
  const curve = set.curve ?? CUSTOM_CURVE;

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
  if (s.blipT > 0) s.blipT -= dt;
  if (s.autoT > 0) s.autoT -= dt;
  if (s.manualT > 0) s.manualT -= dt;
  if (s.prevThr > 0.4 && inp.thr < 0.1) s.autoT = Math.max(s.autoT, 1.2); // 엑셀 뗀 직후엔 기어 유지 (실차 AT 의 리프트 홀드)
  s.prevThr = inp.thr;
  const shifting = s.shiftT > 0;

  const x = s.rpm / set.redline;
  const load = s.cut ? 0 : shifting ? (tr.cutOnShift ? 0 : 0.3) : 1;
  const Teng = Tpk * torqueShape(x, curve) * inp.thr * load;

  if (s.gear === 0) {
    s.slip = false;
    const rise = revRate(Tpk, liters, set.redline);
    const drpm = rise * (Teng / Tpk - 0.45 * Math.max(0.15, x));
    s.rpm = Math.min(limit + 150, Math.max(idle, s.rpm + drpm * dt));
    s.v = Math.max(0, s.v - ((DRAG * s.v * s.v + ROLL + (inp.brake ? BRAKE : 0)) / MASS) * dt);
  } else {
    const ratio = ratios[s.gear - 1];
    const k = (ratio * FINAL * EFF) / WHEEL_R; // Nm → N
    const engineBrake = inp.thr < 0.1 && !shifting ? 0.15 * Tpk * x : 0;
    const Fmax = TRACTION_G * MASS * 9.81;
    let Fdrive = (Teng - engineBrake) * k;
    s.slip = Fdrive > Fmax;
    if (s.slip) Fdrive = Fmax;
    const F = Fdrive - DRAG * s.v * s.v - ROLL - (inp.brake ? BRAKE : 0);
    s.v = Math.max(0, s.v + (F / MASS) * dt);
    if (inp.brake && s.v < 1) s.v = 0; // 브레이크 홀드
    s.v = Math.min(s.v, speedAt(limit + 150, ratio)); // 리미터 이상 못 넘음

    const wr = wheelRpm(s.v, ratio);
    const flareTop = s.lc ? set.lcRpm + 150 : STALL_RPM;
    const target = Math.max(wr, idle + inp.thr * (flareTop - idle) * Math.max(0, 1 - wr / flareTop));
    // 1차 지연으로 수렴 — 변속 중엔 미션별 속도로 천천히 (급변 방지)
    s.rpm += (target - s.rpm) * Math.min(1, (shifting ? tr.sync : 14) * dt);
    s.rpm = Math.min(s.rpm, limit + 150);

    // 자동변속 — 한 번에 한 단, 쿨다운 후 재판단. 업시프트 점은 개도에 비례(코스팅 0.3 → 풀스로틀 0.93),
    // 브레이크 중엔 올리지 않고 내리기만. 패들 개입 중(manualT)엔 리미터/스톨 보호 변속만.
    if (tr.auto && !shifting && !s.lc && s.autoT <= 0) {
      const manual = s.manualT > 0;
      const upAt = manual ? 0.98 : Math.min(0.93, 0.3 + 0.65 * inp.thr);
      const downAt = manual ? 0.14 : inp.brake ? 0.28 : 0.18;
      if (s.gear < tr.gears && x > upAt && !inp.brake) {
        if (shift(s, 1, set)) s.autoT = inp.thr < 0.1 ? 1.5 : 0.5;
      } else if (s.gear > 1 && (x < downAt || (!manual && inp.thr > 0.9 && x < 0.45))) {
        if (shift(s, -1, set)) s.autoT = 0.5;
      }
    }
  }
  if (inp.brake && s.v < 1) s.v = 0;
}

// ── 배기 프리셋 (필터 체인 + 워클릿 펄스 성격) ───────────
export const EXHAUST: Record<
  ExhaustKind,
  { lp: number; f1: number; g1: number; drive: number; tau: number; noise: number; popMul: number; popLp: number; vol: number }
> = {
  stock: { lp: 700, f1: 110, g1: 8, drive: 1.5, tau: 0.012, noise: 0.25, popMul: 0.4, popLp: 1500, vol: 0.6 },
  sport: { lp: 1800, f1: 140, g1: 6, drive: 2.5, tau: 0.008, noise: 0.4, popMul: 1, popLp: 3500, vol: 0.85 },
  straight: { lp: 4500, f1: 170, g1: 4, drive: 5, tau: 0.005, noise: 0.6, popMul: 1.4, popLp: 7000, vol: 1 },
};

/**
 * AudioWorklet 프로세서 소스. Blob URL 로 로드 (별도 파일/번들 설정 없음).
 * 원리: 크랭크각을 샘플 단위로 진행, 점화각 통과 시 뱅크별 배기 펄스(한쪽 방향 지수감쇠 + 노이즈) 발생.
 * 펄스열이 밖의 공진/로우패스/새추레이션 체인을 지나며 배기음이 된다. 파라미터: rpm · thr(부하) · cut(점화컷) · pop(후연소 빈도 0~1).
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
    this.cycle = 720; // 4행정 720° / 2행정 360°
    this.fires = [{ a: 0, b: 0 }];
    this.env = [0, 0];
    this.tau = 0.008;
    this.decay = Math.exp(-1 / (this.tau * sampleRate));
    this.noise = 0.4;
    this.jit = 0.15;
    this.width = 0;
    this.bank = [1, 0.85];
    // 팝앤뱅 (음정 없음): 임펄스 스냅(1.5ms) · 크랙(미분 노이즈, 팝 8ms / 뱅 25ms) · 뱅만 브라운 꼬리(40ms) · 크래클 버스트
    this.pimp = [0, 0]; this.pcr = [0, 0]; this.pcrDec = [0, 0]; this.ptl = [0, 0];
    this.lastW = [0, 0]; this.bn = [0, 0]; this.burst = [0, 0];
    this.impDec = Math.exp(-1 / (0.0015 * sampleRate));
    this.crDecPop = Math.exp(-1 / (0.008 * sampleRate));
    this.crDecBang = Math.exp(-1 / (0.025 * sampleRate));
    this.tlDec = Math.exp(-1 / (0.04 * sampleRate));
    this.port.onmessage = (e) => {
      const d = e.data;
      if (d.fires) this.fires = d.fires;
      if (d.cycle) { this.cycle = d.cycle; this.ang = 0; }
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
    const fires = this.fires, n = fires.length, env = this.env;
    const dec = this.decay, noise = this.noise, jit = this.jit, width = this.width, bank = this.bank;
    const cycle = this.cycle;
    const fps = Math.max(1, (n * rpm * 6) / cycle); // 초당 점화 수 (4행정: n·rpm/120)
    // 오버런(엑셀 오프 · 고회전) 은 연료컷 → 정규 펄스 약화, 팝이 도드라진다
    const c01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
    const ov = 1 - 0.6 * c01((rpm - 2000) / 1000) * (1 - c01(thr / 0.1));
    const amp = ((0.3 + 0.7 * thr) * ov) / Math.sqrt(Math.max(1, fps * this.tau)); // 펄스 겹침 정규화
    const popRate = (pop * 5) / sampleRate; // 뱅크당 초당 5회 @ pop=1 (푸아송)
    const pimp = this.pimp, pcr = this.pcr, pcrDec = this.pcrDec, ptl = this.ptl, lastW = this.lastW, bn = this.bn, burst = this.burst;
    const impDec = this.impDec, tlDec = this.tlDec;
    // 출력 1 이 연결돼 있으면 팝은 그쪽(밝은 별도 필터 경로)으로, 아니면 엔진 출력에 섞는다
    const out1 = outputs[1];
    const PL = out1 && out1[0], PR = out1 && (out1[1] || out1[0]);
    for (let i = 0; i < L.length; i++) {
      if (dA > 0) {
        const a0 = this.ang, a1 = a0 + dA;
        for (let k = 0; k < n; k++) {
          const f = fires[k];
          let a = f.a;
          if (a <= a0) a += cycle;
          if (a <= a1 && !cut) env[f.b] += amp * bank[f.b] * (1 + jit * (Math.random() * 2 - 1));
        }
        this.ang = a1 >= cycle ? a1 - cycle : a1;
      }
      const m0 = Math.random() * 2 - 1, m1 = Math.random() * 2 - 1;
      let s0 = env[0] * (1 + noise * m0);
      let s1 = env[1] * (1 + noise * m1);
      env[0] *= dec; env[1] *= dec;
      // 팝앤뱅: 가끔 큰 뱅(임펄스 + 긴 크랙 + 브라운 꼬리) 뒤에 잔 크래클 버스트. 음정 성분 없음 — 저음은 배기관 공진 몫
      let p0 = 0, p1 = 0;
      for (let b = 0; b < 2; b++) {
        const r = popRate * (burst[b] > 0 ? 6 : 1);
        if (r > 0 && Math.random() < r) {
          const big = burst[b] <= 0 && Math.random() < 0.3;
          const A = big ? 3 + 2 * Math.random() : 0.6 + 0.8 * Math.random();
          pimp[b] = A;
          pcr[b] = A * 0.5; pcrDec[b] = big ? this.crDecBang : this.crDecPop;
          ptl[b] = big ? A * 0.25 : 0;
          if (big) burst[b] = (0.1 + 0.15 * Math.random()) * sampleRate;
        }
        if (burst[b] > 0) burst[b]--;
        const w = Math.random() * 2 - 1;
        let pb = pimp[b] * w; pimp[b] *= impDec; // 스냅
        pb += pcr[b] * (w - lastW[b]) * 0.7; lastW[b] = w; pcr[b] *= pcrDec[b]; // 크랙 (고역 강조 노이즈)
        bn[b] += 0.06 * (w - bn[b]); pb += ptl[b] * bn[b] * 4; ptl[b] *= tlDec; // 뱅 꼬리
        if (b === 0) p0 = pb; else p1 = pb;
      }
      if (PL) {
        const pm = (p0 + p1) * 0.6, pd = (p0 - p1) * width;
        PL[i] = pm + pd;
        PR[i] = pm - pd;
      } else {
        s0 += p0; s1 += p1;
      }
      const m = (s0 + s1) * 0.6, d = (s0 - s1) * width;
      L[i] = m + d;
      R[i] = m - d;
    }
    return true;
  }
}
registerProcessor("engine", EngineProcessor);
`;
