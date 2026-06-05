import type { Tool } from "./types";
import JsonFormatTool from "./JsonFormatTool";
import Base64Tool from "./Base64Tool";
import UrlEncodeTool from "./UrlEncodeTool";
import TimestampTool from "./TimestampTool";
import UuidTool from "./UuidTool";
import HashTool from "./HashTool";
import VatTool from "./VatTool";
import ColorTool from "./ColorTool";
import AnalogScaleTool from "./AnalogScaleTool";
import BallscrewTool from "./BallscrewTool";
import CylinderForceTool from "./CylinderForceTool";
import ThreePhaseTool from "./ThreePhaseTool";
import TaktTool from "./TaktTool";
import OeeTool from "./OeeTool";
import PressureTool from "./PressureTool";
import EncoderTool from "./EncoderTool";
import PidTool from "./PidTool";

/**
 * 새 도구 추가 방법:
 *  1. src/tools/ 아래 컴포넌트 1개 작성
 *  2. 여기 import 후 아래 배열에 항목 추가
 * 끝. 라우팅/사이드바/검색 자동 반영.
 */
export const tools: Tool[] = [
  // ───── 자동화 / FA ─────
  {
    slug: "analog-scale",
    name: "아날로그 스케일링",
    description: "4-20mA / 0-10V 신호 ↔ 측정값 환산 (PLC 스케일링)",
    category: "자동화",
    component: AnalogScaleTool,
  },
  {
    slug: "ballscrew",
    name: "볼스크류 위치결정",
    description: "리드·감속비·PPR → 분해능, 모터 RPM, 펄스 주파수",
    category: "자동화",
    component: BallscrewTool,
  },
  {
    slug: "encoder",
    name: "엔코더 분해능",
    description: "PPR·체배 → 카운트, 각도/선형 분해능, 최대 회전수",
    category: "자동화",
    component: EncoderTool,
  },
  {
    slug: "cylinder-force",
    name: "공압 실린더 추력",
    description: "보어·로드·압력 → 전진/후진 추력 (N·kgf)",
    category: "자동화",
    component: CylinderForceTool,
  },
  {
    slug: "pid",
    name: "PID 시뮬레이터",
    description: "Kp·Ki·Kd 튜닝 → 스텝응답 그래프 + 오버슈트/정정시간",
    category: "자동화",
    component: PidTool,
  },
  {
    slug: "three-phase",
    name: "3상 전력/전류",
    description: "전압·전류·역률 ↔ kW·kVA·kVAR",
    category: "자동화",
    component: ThreePhaseTool,
  },
  {
    slug: "takt",
    name: "택트타임 / 생산량",
    description: "사이클타임·가동률 → UPH·일생산량·허용택트",
    category: "자동화",
    component: TaktTool,
  },
  {
    slug: "oee",
    name: "OEE 설비종합효율",
    description: "가동률 × 성능 × 양품률",
    category: "자동화",
    component: OeeTool,
  },
  {
    slug: "pressure",
    name: "압력 단위 변환",
    description: "MPa · bar · psi · kgf/cm² · mmHg",
    category: "자동화",
    component: PressureTool,
  },
  // ───── 일반 / 개발 ─────
  {
    slug: "json-format",
    name: "JSON 포맷터",
    description: "JSON 정렬, 압축, 유효성 검사",
    category: "텍스트",
    component: JsonFormatTool,
  },
  {
    slug: "base64",
    name: "Base64 변환",
    description: "Base64 인코딩 / 디코딩 (UTF-8)",
    category: "인코딩",
    component: Base64Tool,
  },
  {
    slug: "url-encode",
    name: "URL 인코딩",
    description: "URL 컴포넌트 인코딩 / 디코딩",
    category: "인코딩",
    component: UrlEncodeTool,
  },
  {
    slug: "timestamp",
    name: "타임스탬프 변환",
    description: "Unix 타임스탬프 ↔ 날짜/시간",
    category: "변환",
    component: TimestampTool,
  },
  {
    slug: "uuid",
    name: "UUID 생성기",
    description: "UUID v4 대량 생성",
    category: "생성",
    component: UuidTool,
  },
  {
    slug: "hash",
    name: "해시 생성기",
    description: "SHA-1/256/384/512 해시 계산",
    category: "생성",
    component: HashTool,
  },
  {
    slug: "vat",
    name: "부가세 계산기",
    description: "공급가액 · 부가세 · 합계 계산",
    category: "계산",
    component: VatTool,
  },
  {
    slug: "color",
    name: "색상 변환",
    description: "HEX ↔ RGB ↔ HSL 변환",
    category: "변환",
    component: ColorTool,
  },
];

export function findTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
