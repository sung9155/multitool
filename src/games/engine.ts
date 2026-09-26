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

// ── 차량 클래스 ────────────────────────────────────────
export interface Vehicle {
  id: string;
  name: string; // 한국어
  en: string;
  mass: number; // kg (탑승자 포함)
  drive: "fwd" | "rwd" | "awd";
  share: number; // 정적 구동축 하중 비율
  transfer: number; // 가속도(m/s²)당 구동축 하중 이동 비율 ≈ h/L (FWD 는 음수: 가속하면 앞이 뜬다)
  cda: number; // Cd·A m²
  wheel: number; // 구동륜 반경 m
  first: number; // 1단 종합 감속비 (기어 × 종감속)
  top: number; // 최종단 종합 감속비
  mu: number; // 타이어 최대 마찰계수 (미끄러지기 시작하면 80%)
  df: number; // 다운포스 계수 N/(m/s)²
}
export const VEHICLES: Record<string, Vehicle> = {
  kart: { id: "kart", name: "카트", en: "Kart", mass: 150, drive: "rwd", share: 0.6, transfer: 0.1, cda: 0.6, wheel: 0.14, first: 9, top: 6, mu: 1.0, df: 0 },
  bike: { id: "bike", name: "모터사이클", en: "Motorcycle", mass: 230, drive: "rwd", share: 0.5, transfer: 0.35, cda: 0.45, wheel: 0.31, first: 15, top: 5.5, mu: 1.2, df: 0 },
  hatch: { id: "hatch", name: "컴팩트 FWD", en: "Compact FWD", mass: 1150, drive: "fwd", share: 0.62, transfer: -0.12, cda: 0.65, wheel: 0.3, first: 13, top: 3.0, mu: 1.0, df: 0 },
  sedan: { id: "sedan", name: "스포츠 세단 RWD", en: "Sports sedan RWD", mass: 1550, drive: "rwd", share: 0.48, transfer: 0.18, cda: 0.68, wheel: 0.33, first: 12.5, top: 2.7, mu: 1.05, df: 0 },
  muscle: { id: "muscle", name: "머슬/GT RWD", en: "Muscle/GT RWD", mass: 1750, drive: "rwd", share: 0.47, transfer: 0.18, cda: 0.75, wheel: 0.34, first: 11.5, top: 2.3, mu: 1.1, df: 0 },
  awd: { id: "awd", name: "AWD 스포츠", en: "AWD sports", mass: 1550, drive: "awd", share: 1.0, transfer: 0, cda: 0.62, wheel: 0.34, first: 12, top: 2.6, mu: 1.1, df: 0.3 },
  truck: { id: "truck", name: "픽업/트럭", en: "Pickup/truck", mass: 2600, drive: "rwd", share: 0.45, transfer: 0.15, cda: 1.2, wheel: 0.4, first: 16, top: 2.9, mu: 0.85, df: 0 },
  f1: { id: "f1", name: "F1 (슬릭 · 다운포스)", en: "F1 (slicks · downforce)", mass: 800, drive: "rwd", share: 0.55, transfer: 0.1, cda: 1.3, wheel: 0.33, first: 15, top: 6.5, mu: 1.7, df: 3.0 },
};
export const DEFAULT_VEHICLE = VEHICLES.sedan;

/** 종합 감속비: 1단 first → 최종단 top 등비수열 */
export function gearRatios(n: number, veh: Vehicle = DEFAULT_VEHICLE): number[] {
  if (n < 2) return [veh.first];
  return Array.from({ length: n }, (_, i) => veh.first * Math.pow(veh.top / veh.first, i / (n - 1)));
}

const EFF = 0.9; // 구동계 효율
export const STALL_RPM = 2500; // 정지 출발 시 컨버터/클러치 슬립 플레어 상한

export function wheelRpm(v: number, ratio: number, wheel = DEFAULT_VEHICLE.wheel): number {
  return (v / (2 * Math.PI * wheel)) * 60 * ratio;
}
export function speedAt(rpm: number, ratio: number, wheel = DEFAULT_VEHICLE.wheel): number {
  return (rpm / 60 / ratio) * 2 * Math.PI * wheel;
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
/** 엔진+플라이휠+클러치 관성 kg·m² — 배기량에 비례, 디젤은 무겁다 */
export function engineInertia(liters: number, diesel = false): number {
  return (0.02 + 0.06 * liters) * (diesel ? 1.5 : 1); // 250cc 단기통 0.035 · 2.0L 0.14 · 5.0L V8 0.32
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
  slip: boolean; // 휠스핀 중 (구동륜이 차체보다 빠르게 돎)
  vw: number; // 구동륜 접지면 속도 m/s (물려 있으면 v 와 같음)
  a: number; // 차체 가속도 m/s² (하중이동 계산용)
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
  inertia?: number;
  diesel?: boolean;
  veh?: Vehicle;
}

export function newSim(): Sim {
  return { rpm: 0, v: 0, gear: 0, cut: false, cutT: 0, fireT: 0, shiftT: 0, blipT: 0, autoT: 0, manualT: 0, prevThr: 0, lc: false, slip: false, vw: 0, a: 0 };
}

/**
 * 변속. 오버레브(레드라인+300 초과)가 될 다운시프트는 거부 → false.
 * manual: 사용자 패들 조작. 자동 미션에서 주행 기어 간 패들 조작이면 8초간 수동 유지(자동은 보호 변속만).
 */
export function shift(s: Sim, dir: 1 | -1, set: Setup, manual = false): boolean {
  const tr = TRANS[set.trans];
  const veh = set.veh ?? DEFAULT_VEHICLE;
  const g = s.gear + dir;
  if (g < 0 || g > tr.gears || s.shiftT > 0) return false;
  if (g >= 1 && wheelRpm(s.v, gearRatios(tr.gears, veh)[g - 1], veh.wheel) > set.redline + 300) return false;
  if (manual && tr.auto && s.gear >= 1 && g >= 1) s.manualT = 8;
  // 주행 중 다운시프트: 수동/DCT 는 레브매칭 블립 (AT 는 컨버터가 부드럽게 올림)
  if (dir === -1 && g >= 1 && s.v > 2 && tr.cutOnShift) s.blipT = 0.18;
  s.gear = g;
  s.shiftT = tr.shiftMs / 1000;
  return true;
}

/**
 * 한 스텝 (dt 초).
 * 중립: 엔진 관성(Je)만. 기어 물림: 차체(M)와 구동륜 쪽(구동륜 + 엔진 반영 관성 mw)의 두 질량.
 *  - 물림 상태: 구동력이 타이어 정지 마찰 한계(μ·Fz) 이하면 한 덩어리로 가속, rpm 은 차속에서 역산
 *  - 휠스핀: 한계를 넘으면 타이어는 미끄럼 마찰(75%)만 전달하고 남은 토크가 구동륜(+엔진)을 가속 → rpm 이 차속과 분리돼 치솟음.
 *    구동륜이 차속까지 내려오면 다시 물림. Fz 는 정적 배분 + 가속 하중이동 + 다운포스.
 * 리미터는 50ms 컷 / 30ms 점화 반복 → 바운스. 런치컨트롤 = 브레이크+엑셀 정지 상태에서 리미터를 lcRpm 으로.
 */
export function stepSim(s: Sim, inp: Input, set: Setup, dt: number): void {
  const tr = TRANS[set.trans];
  const veh = set.veh ?? DEFAULT_VEHICLE;
  const ratios = gearRatios(tr.gears, veh);
  const idle = set.idle ?? idleRpm(set.cyl);
  const Tpk = set.torque ?? peakTorque(set.cyl);
  const liters = set.liters ?? set.cyl * 0.5;
  const curve = set.curve ?? CUSTOM_CURVE;
  const Je = set.inertia ?? engineInertia(liters, set.diesel);
  const M = veh.mass;
  const G = 9.81;

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

  const drag = 0.6 * veh.cda * s.v * s.v; // 0.5·ρ(1.2)·CdA·v²
  const roll = 0.012 * M * G;
  const brakeF = inp.brake ? 6 * M : 0; // 0.6g 제동 (정차 홀드는 별도)

  if (s.gear === 0) {
    s.slip = false;
    // 엔진 단독: 마찰은 최대토크의 45% 를 회전수 비례로
    const drpm = ((Teng - 0.45 * Tpk * Math.max(0.15, x)) / Je) * 9.549;
    s.rpm = Math.min(limit + 150, Math.max(idle, s.rpm + drpm * dt));
    s.a = -(drag + roll + brakeF) / M;
    s.v = Math.max(0, s.v + s.a * dt);
    s.vw = s.v;
  } else {
    const ratio = ratios[s.gear - 1];
    const kf = (ratio * EFF) / veh.wheel; // Nm → N (타이어 접지면)
    const mw = 0.02 * M + Je * (ratio / veh.wheel) ** 2; // 구동륜 쪽 등가 질량 (엔진 반영 관성 포함, 1단에서 크다)
    const engineBrake = inp.thr < 0.1 && !shifting ? 0.15 * Tpk * x : 0;
    const Fdrive = (Teng - engineBrake) * kf;
    const Fz = Math.max(0, M * G * veh.share + M * veh.transfer * s.a + veh.df * s.v * s.v * veh.share);
    const Fpeak = veh.mu * Fz;
    const Fslide = 0.8 * Fpeak; // 미끄럼 마찰 ≈ 최대의 80% (스핀하면 접지 손해)
    if (!s.slip && Fdrive > Fpeak) s.slip = true; // 정지 마찰 돌파 → 휠스핀 시작
    if (!s.slip) {
      s.a = (Fdrive - drag - roll - brakeF) / (M + mw);
      s.v = Math.max(0, s.v + s.a * dt);
      s.vw = s.v;
    } else {
      s.a = (Fslide - drag - roll - brakeF) / M;
      s.v = Math.max(0, s.v + s.a * dt);
      s.vw += ((Fdrive - Fslide) / mw) * dt; // 남은 토크가 구동륜+엔진을 돌린다
      if (s.vw <= s.v) {
        s.vw = s.v;
        s.slip = false; // 다시 물림
      }
    }
    if (inp.brake && s.v < 1) {
      s.v = 0;
      s.vw = 0;
      s.slip = false; // 브레이크 홀드 (바퀴도 잡힘)
    }
    s.vw = Math.min(s.vw, speedAt(limit + 150, ratio, veh.wheel)); // 리미터 — 휠스핀 중엔 구동륜이 리미터에 걸린다
    s.v = Math.min(s.v, s.vw);

    const wr = wheelRpm(s.vw, ratio, veh.wheel); // 구동륜 회전수 — 휠스핀이면 차속보다 높다
    const flareTop = s.lc ? set.lcRpm + 150 : Math.max(STALL_RPM, 0.35 * set.redline); // 고회전 엔진은 출발 슬립 rpm 도 높다 (2행정·F1)
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
}

// ── 배기 프리셋 (필터 체인 + 워클릿 펄스 성격) ───────────
export const EXHAUST: Record<
  ExhaustKind,
  {
    lp: number;
    f1: number;
    g1: number; // f1 피킹 dB (100~300Hz 봉우리 — 실측 공통)
    g2: number; // f1×2.7 피킹 dB
    drive: number;
    tau: number;
    noise: number;
    popMul: number;
    popLp: number;
    vol: number;
    pipe: number; // 배기관 왕복 지연(s) — 도파관 공진 (순정은 긴 배기관+머플러)
    fb: number; // 공진 피드백 (머플러가 많이 죽인다)
    fbLp: number; // 피드백 경로 로우패스
    shelf: number; // 테일파이프 방사 효율: shelfHz 아래 로우셸프 dB (작은 관은 저음을 잘 못 내보낸다)
    shelfHz: number;
    pres: number; // 500Hz 프레즌스 dB (머플러/관 공진 — 실측 V8 에서 400~630Hz 봉우리)
    hs: number; // 600Hz 위 하이셸프 dB (고역 꼬리 기울기)
    flow: number; // 연속 배기 유동 노이즈 (배음 사이 바닥, 개도에 비례)
  }
> = {
  // 실측(freesound CC0: 오픈헤더 V8 · 머플러 V8 레브 · WRX 터보백 · 시빅 순정)에 맞춘 값.
  // 공통: 100~300Hz 가 지배적, 100Hz 아래는 15~40%. 차이는 300Hz 위 꼬리 — 순정은 500Hz 에서 -25dB, 오픈헤더는 8kHz 까지 -15~-25dB 로 평평.
  // tau: 배기 펄스 감쇠 (실제 블로다운 1~3ms). 8ms 였을 땐 200Hz 위가 사라져 먹먹했다.
  // 펄스 자체(tau 3~4ms, 100Hz 위 -6dB/oct)는 배기 종류와 무관하게 비슷하고, 머플러는 주로 고역 노이즈 바닥(flow)과 로우패스를 결정한다.
  stock: { lp: 550, f1: 100, g1: 4, g2: 2, drive: 1.3, tau: 0.004, noise: 0.3, popMul: 0.4, popLp: 1500, vol: 0.6, pipe: 0.005, fb: 0.25, fbLp: 500, shelf: -4, shelfHz: 100, pres: 0, hs: -6, flow: 0.08 },
  sport: { lp: 1800, f1: 130, g1: 3, g2: 1.5, drive: 2.2, tau: 0.003, noise: 0.45, popMul: 1, popLp: 3500, vol: 0.85, pipe: 0.004, fb: 0.3, fbLp: 1200, shelf: -10, shelfHz: 160, pres: 3, hs: -4, flow: 0.12 },
  straight: { lp: 5000, f1: 150, g1: 8, g2: -3, drive: 3, tau: 0.003, noise: 0.65, popMul: 1.4, popLp: 7000, vol: 1, pipe: 0.004, fb: 0.25, fbLp: 3000, shelf: -18, shelfHz: 250, pres: -3, hs: -12, flow: 0.25 },
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
    this.envS = [0, 0]; // 어택 0.8ms 로 부드럽게 (계단식 펄스의 거친 고역 제거)
    this.att = 1 - Math.exp(-1 / (0.0008 * sampleRate));
    this.flow = 0.12; // 연속 유동 노이즈 세기 (배기 종류별)
    this.fn = [0, 0]; // 유동 노이즈 저역 상태 (뱅크별, 스테레오 비상관)
    this.fnCoef = 1 - Math.exp((-2 * Math.PI * 1800) / sampleRate);
    this.ienv = [0, 0]; // 흡기 맥동 (출력 2: 엔진 앞쪽 소리)
    this.tick = 0; // 밸브트레인 틱
    this.iDec = Math.exp(-1 / (0.005 * sampleRate));
    this.tDec = Math.exp(-1 / (0.0004 * sampleRate));
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
      if (d.flow !== undefined) this.flow = d.flow;
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
    const out2 = outputs[2];
    const IL = out2 && out2[0], IR = out2 && (out2[1] || out2[0]);
    const envS = this.envS, att = this.att, ienv = this.ienv, iDec = this.iDec, tDec = this.tDec;
    for (let i = 0; i < L.length; i++) {
      if (dA > 0) {
        const a0 = this.ang, a1 = a0 + dA;
        for (let k = 0; k < n; k++) {
          const f = fires[k];
          let a = f.a;
          if (a <= a0) a += cycle;
          if (a <= a1) {
            if (!cut) env[f.b] += amp * bank[f.b] * (1 + jit * (Math.random() * 2 - 1));
            ienv[f.b] += amp * 0.6 * (0.15 + 0.85 * thr); // 흡기는 컷 중에도 (공기는 계속 흐른다), 개도에 강하게 비례
            this.tick += 0.05;
          }
        }
        this.ang = a1 >= cycle ? a1 - cycle : a1;
      }
      envS[0] += (env[0] - envS[0]) * att; envS[1] += (env[1] - envS[1]) * att;
      const m0 = Math.random() * 2 - 1, m1 = Math.random() * 2 - 1;
      // 연속 유동 노이즈: 실측에서 배음 사이 바닥이 봉우리보다 5~15dB 아래 — 개도·회전수에 비례
      const fn = this.fn; fn[0] += (m0 - fn[0]) * this.fnCoef; fn[1] += (m1 - fn[1]) * this.fnCoef;
      const flowA = rpm < 150 ? 0 : this.flow * (0.7 + 0.3 * thr) * Math.min(1, 0.5 + rpm / 8000) * amp * 3; // 실측: 고역 바닥은 회전수·개도에 크게 안 변함
      let s0 = envS[0] * (1 + noise * m0) + flowA * fn[0];
      let s1 = envS[1] * (1 + noise * m1) + flowA * fn[1];
      env[0] *= dec; env[1] *= dec;
      if (IL) {
        const wi = Math.random() * 2 - 1;
        const iv = (ienv[0] + ienv[1]) * (0.3 + 0.7 * wi) + this.tick * wi;
        IL[i] = iv; IR[i] = iv;
      }
      ienv[0] *= iDec; ienv[1] *= iDec; this.tick *= tDec;
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
