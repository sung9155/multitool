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
import NetSalaryTool from "./NetSalaryTool";
import LoanTool from "./LoanTool";
import PercentTool from "./PercentTool";
import UnitConvertTool from "./UnitConvertTool";
import BmiTool from "./BmiTool";
import DateCalcTool from "./DateCalcTool";
import SplitBillTool from "./SplitBillTool";
import CharCountTool from "./CharCountTool";
import WorldClockTool from "./WorldClockTool";
import JwtTool from "./JwtTool";
import RegexTool from "./RegexTool";
import QrTool from "./QrTool";

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
  // ───── 금융 / 실무 ─────
  {
    slug: "net-salary",
    name: "연봉 실수령액",
    description: "4대보험·소득세 공제 → 월 실수령 (공제 표)",
    category: "금융",
    component: NetSalaryTool,
  },
  {
    slug: "loan",
    name: "대출 상환 계산기",
    description: "원리금균등·원금균등·만기일시 → 월 상환액·총이자 + 잔액 곡선",
    category: "금융",
    component: LoanTool,
  },
  {
    slug: "percent",
    name: "퍼센트 계산기",
    description: "비율·증감율·할인 등 % 계산",
    category: "계산",
    component: PercentTool,
  },
  {
    slug: "unit-convert",
    name: "단위 변환기",
    description: "길이·무게·온도·넓이·부피 동시 환산표",
    category: "변환",
    component: UnitConvertTool,
  },
  {
    slug: "bmi",
    name: "BMI 계산기",
    description: "체질량지수 + 분류 게이지 (아시아 기준)",
    category: "건강",
    component: BmiTool,
  },
  {
    slug: "date-calc",
    name: "날짜 계산기 / D-Day",
    description: "두 날짜 차이, N일 후·전 날짜",
    category: "일상",
    component: DateCalcTool,
  },
  {
    slug: "split-bill",
    name: "팁 · 더치페이",
    description: "총액·인원·팁 → 1인당 금액",
    category: "일상",
    component: SplitBillTool,
  },
  {
    slug: "world-clock",
    name: "세계 시간",
    description: "주요 도시 현재 시각 · 시차 (실시간)",
    category: "일상",
    component: WorldClockTool,
  },
  {
    slug: "char-count",
    name: "글자수 세기",
    description: "글자·단어·줄·바이트 수 (문자/SNS 제한 확인)",
    category: "텍스트",
    component: CharCountTool,
  },
  // ───── 일반 / 개발 ─────
  {
    slug: "jwt",
    name: "JWT 디코더",
    description: "JWT 헤더·페이로드 디코딩 + 만료 확인",
    category: "인코딩",
    component: JwtTool,
  },
  {
    slug: "regex",
    name: "정규식 테스터",
    description: "패턴 매치 하이라이트 + 그룹 표",
    category: "텍스트",
    component: RegexTool,
  },
  {
    slug: "qr",
    name: "QR 코드 생성기",
    description: "URL·텍스트 → QR (오프라인, PNG 다운로드)",
    category: "생성",
    component: QrTool,
  },
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
