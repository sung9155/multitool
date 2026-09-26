/**
 * 실제 엔진 스펙 기반 프리셋 (realenginesimulator.com 로스터를 참고한 구성).
 * 점화 패턴은 점화순서 + 실린더→뱅크 규칙에서 나온다: 크로스플레인 V8 의 버블, 스바루 수평대향 4기통의 R R L L 럼블 등.
 * 토크 곡선은 카탈로그의 최대토크·최고출력 점을 지나도록 맞춘다 (curveOf).
 */
import {
  FLAT_LAG,
  firesFromOrder,
  firingPattern,
  halvesOf,
  oddEven,
  torqueShape,
  type Crank,
  type Curve,
  type Fire,
  type Layout,
} from "./engine.ts"; // 확장자 명시: node 검사 스크립트에서도 로드

export interface EnginePreset {
  id: string;
  name: string; // 한국어 표시명
  real: string; // 실제 엔진 (모든 언어 공통)
  cyl: number;
  layout: Layout;
  bank?: number; // V/수평대향 뱅크각(°) — 표시용
  crank?: Crank;
  order?: number[]; // 실제 점화순서
  bankMap?: "oddEven" | "halves"; // 실린더 번호 → 뱅크 규칙 (기본 oddEven)
  fires?: Fire[]; // 부등간격 등 명시 패턴 (order 보다 우선)
  liters: number;
  torque: number; // 최대토크 Nm
  torqueRpm: number;
  hp: number; // 최고출력 hp
  hpRpm: number;
  idle: number;
  redline: number;
  fuel: "gas" | "diesel";
  strokes: 2 | 4;
  turbo?: boolean;
}

export const PRESETS: EnginePreset[] = [
  { id: "gx160", name: "단기통 163cc 범용", real: "Honda GX160", cyl: 1, layout: "inline", liters: 0.163, torque: 10.3, torqueRpm: 2500, hp: 4.8, hpRpm: 3600, idle: 1400, redline: 4000, fuel: "gas", strokes: 4 },
  { id: "bullet", name: "단기통 500 썸퍼", real: "Royal Enfield Bullet 500", cyl: 1, layout: "inline", liters: 0.499, torque: 41, torqueRpm: 4000, hp: 27, hpRpm: 5250, idle: 1000, redline: 5500, fuel: "gas", strokes: 4 },
  { id: "yz250", name: "2행정 250 모토크로스", real: "Yamaha YZ250", cyl: 1, layout: "inline", liters: 0.249, torque: 40, torqueRpm: 8000, hp: 48, hpRpm: 8500, idle: 1700, redline: 9500, fuel: "gas", strokes: 2 },
  { id: "evo1340", name: "V트윈 45° 1340", real: "Harley-Davidson Evolution 1340", cyl: 2, layout: "vee", bank: 45, fires: [{ a: 0, b: 0 }, { a: 315, b: 1 }], liters: 1.34, torque: 100, torqueRpm: 3500, hp: 58, hpRpm: 5000, idle: 950, redline: 5500, fuel: "gas", strokes: 4 },
  { id: "cp2", name: "병렬 2기통 270° 크랭크", real: "Yamaha MT-07 CP2", cyl: 2, layout: "inline", fires: [{ a: 0, b: 0 }, { a: 270, b: 0 }], liters: 0.689, torque: 67, torqueRpm: 6500, hp: 73, hpRpm: 9000, idle: 1200, redline: 10000, fuel: "gas", strokes: 4 },
  { id: "1kr", name: "직렬 3기통 1.0", real: "Toyota 1KR-FE", cyl: 3, layout: "inline", liters: 1.0, torque: 93, torqueRpm: 3600, hp: 68, hpRpm: 6000, idle: 800, redline: 6500, fuel: "gas", strokes: 4 },
  { id: "k20a", name: "직렬 4기통 2.0 고회전", real: "Honda K20A (Type R)", cyl: 4, layout: "inline", liters: 2.0, torque: 215, torqueRpm: 6100, hp: 222, hpRpm: 8000, idle: 800, redline: 8400, fuel: "gas", strokes: 4 },
  { id: "ej20", name: "수평대향 4기통 2.0 터보", real: "Subaru EJ20 (WRX STI)", cyl: 4, layout: "flat", bank: 180, order: [1, 3, 2, 4], liters: 2.0, torque: 392, torqueRpm: 4400, hp: 280, hpRpm: 6400, idle: 800, redline: 7500, fuel: "gas", strokes: 4, turbo: true },
  { id: "tfsi25", name: "직렬 5기통 2.5 터보", real: "Audi 2.5 TFSI (RS3)", cyl: 5, layout: "inline", liters: 2.5, torque: 480, torqueRpm: 2500, hp: 400, hpRpm: 5850, idle: 750, redline: 7000, fuel: "gas", strokes: 4, turbo: true },
  { id: "2jz", name: "직렬 6기통 3.0 트윈터보", real: "Toyota 2JZ-GTE", cyl: 6, layout: "inline", liters: 3.0, torque: 440, torqueRpm: 3600, hp: 320, hpRpm: 5600, idle: 700, redline: 7000, fuel: "gas", strokes: 4, turbo: true },
  { id: "m64", name: "수평대향 6기통 3.6", real: "Porsche 911 (993) M64", cyl: 6, layout: "flat", bank: 180, order: [1, 6, 2, 4, 3, 5], bankMap: "halves", liters: 3.6, torque: 330, torqueRpm: 5000, hp: 272, hpRpm: 6100, idle: 800, redline: 6800, fuel: "gas", strokes: 4 },
  { id: "busso", name: "V6 60° 3.0", real: "Alfa Romeo Busso V6 24V", cyl: 6, layout: "vee", bank: 60, order: [1, 4, 2, 5, 3, 6], bankMap: "halves", liters: 3.0, torque: 270, torqueRpm: 5000, hp: 220, hpRpm: 6300, idle: 800, redline: 7000, fuel: "gas", strokes: 4 },
  { id: "coyote", name: "V8 90° 크로스플레인 5.0", real: "Ford Coyote 5.0 (Gen 3)", cyl: 8, layout: "vee", bank: 90, crank: "cross", order: [1, 5, 4, 8, 6, 3, 7, 2], bankMap: "halves", liters: 5.0, torque: 570, torqueRpm: 4600, hp: 460, hpRpm: 7000, idle: 750, redline: 7500, fuel: "gas", strokes: 4 },
  { id: "f136", name: "V8 90° 플랫플레인 4.5", real: "Ferrari F136 (458 Italia)", cyl: 8, layout: "vee", bank: 90, crank: "flat", liters: 4.5, torque: 540, torqueRpm: 6000, hp: 570, hpRpm: 9000, idle: 900, redline: 9000, fuel: "gas", strokes: 4 },
  { id: "ca2006", name: "F1 V8 2.4", real: "Cosworth CA2006", cyl: 8, layout: "vee", bank: 90, crank: "flat", liters: 2.4, torque: 290, torqueRpm: 17000, hp: 755, hpRpm: 19000, idle: 4000, redline: 19000, fuel: "gas", strokes: 4 },
  { id: "s85", name: "V10 90° 5.0", real: "BMW S85 (M5 E60)", cyl: 10, layout: "vee", bank: 90, liters: 5.0, torque: 520, torqueRpm: 6100, hp: 507, hpRpm: 7750, idle: 700, redline: 8250, fuel: "gas", strokes: 4 },
  { id: "viper", name: "V10 90° 8.4", real: "Dodge Viper 8.4", cyl: 10, layout: "vee", bank: 90, liters: 8.4, torque: 814, torqueRpm: 5000, hp: 640, hpRpm: 6200, idle: 750, redline: 6400, fuel: "gas", strokes: 4 },
  { id: "l539", name: "V12 60° 6.5", real: "Lamborghini L539 (Aventador)", cyl: 12, layout: "vee", bank: 60, liters: 6.5, torque: 690, torqueRpm: 5500, hp: 700, hpRpm: 8250, idle: 900, redline: 8500, fuel: "gas", strokes: 4 },
  { id: "6bt", name: "디젤 직렬 6기통 5.9 터보", real: "Cummins 6BT 12v", cyl: 6, layout: "inline", liters: 5.9, torque: 570, torqueRpm: 1600, hp: 215, hpRpm: 2500, idle: 750, redline: 3200, fuel: "diesel", strokes: 4, turbo: true },
  { id: "tdi20", name: "디젤 직렬 4기통 2.0", real: "VW 2.0 TDI (EA189)", cyl: 4, layout: "inline", liters: 2.0, torque: 320, torqueRpm: 1750, hp: 140, hpRpm: 4000, idle: 800, redline: 4500, fuel: "diesel", strokes: 4, turbo: true },
];

export const findPreset = (id: string) => PRESETS.find((p) => p.id === id);

export const cycleOf = (p: EnginePreset) => (p.strokes === 2 ? 360 : 720);

export const bankOfPreset = (p: EnginePreset) => (p.bankMap === "halves" ? halvesOf(p.cyl) : oddEven);

/** 프리셋 점화 패턴. order 를 주면 그걸로(사용자가 고쳐 쓴 순서), 아니면 프리셋 순서/명시 패턴/기본 규칙 */
export function presetFires(p: EnginePreset, order?: number[]): Fire[] {
  const lag = p.layout === "flat" ? FLAT_LAG : 0;
  const o = order ?? p.order;
  if (o && o.length === p.cyl) return firesFromOrder(o, bankOfPreset(p), cycleOf(p), lag);
  if (p.fires) return p.fires;
  return firingPattern(p.cyl, p.layout, p.crank);
}

/** 카탈로그의 최대토크점(peakAt)과 최고출력점을 지나는 두 구간 선형 곡선 */
export function curveOf(p: EnginePreset): Curve {
  const peakAt = Math.max(0.2, Math.min(0.9, p.torqueRpm / p.redline));
  const floor = p.fuel === "diesel" || p.turbo ? 0.8 : 0.6;
  const xhp = Math.min(1, p.hpRpm / p.redline);
  const Thp = (p.hp * 7127) / p.hpRpm / p.torque; // 최고출력점의 토크 비
  let end = xhp > peakAt + 0.05 ? 1 - (1 - Thp) * ((1 - peakAt) / (xhp - peakAt)) : Thp;
  end = Math.max(0.3, Math.min(1, end));
  return { floor, peakAt, end };
}

/** rpm 에서의 토크(Nm)·출력(hp) */
export function torqueAt(p: EnginePreset, rpm: number): number {
  return p.torque * torqueShape(rpm / p.redline, curveOf(p));
}
export const hpAt = (p: EnginePreset, rpm: number) => (torqueAt(p, rpm) * rpm) / 7127;

/** 다이노 곡선: 아이들 → 레드라인 (표시용). 프리셋/커스텀 공통 */
export function dyno(torque: number, idle: number, redline: number, curve: Curve, n = 40): { rpm: number; nm: number; hp: number }[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const rpm = idle + ((redline - idle) * i) / n;
    const nm = torque * torqueShape(rpm / redline, curve);
    return { rpm, nm, hp: (nm * rpm) / 7127 };
  });
}
