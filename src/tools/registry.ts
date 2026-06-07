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
import OhmsLawTool from "./OhmsLawTool";
import ResistorTool from "./ResistorTool";
import MotorSizingTool from "./MotorSizingTool";
import GearRatioTool from "./GearRatioTool";
import BeltPulleyTool from "./BeltPulleyTool";
import FlowPipeTool from "./FlowPipeTool";
import PanelCoolingTool from "./PanelCoolingTool";
import CrcTool from "./CrcTool";
import BaseConvertTool from "./BaseConvertTool";
import CronTool from "./CronTool";
import DiffTool from "./DiffTool";
import MarkdownTool from "./MarkdownTool";
import HtmlJsxTool from "./HtmlJsxTool";
import JwtSignTool from "./JwtSignTool";
import AgeTool from "./AgeTool";
import CalculatorTool from "./CalculatorTool";
import SavingsTool from "./SavingsTool";
import InstallmentTool from "./InstallmentTool";
import CurrencyTool from "./CurrencyTool";
import TimerTool from "./TimerTool";

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
  {
    slug: "ohms-law",
    name: "옴의 법칙 계산기",
    description: "V·I·R·P 중 2개 입력 → 나머지 자동 계산",
    category: "자동화",
    component: OhmsLawTool,
  },
  {
    slug: "resistor",
    name: "저항 컬러코드",
    description: "4/5밴드 색띠 ↔ 저항값·허용오차·범위",
    category: "자동화",
    component: ResistorTool,
  },
  {
    slug: "motor-sizing",
    name: "모터 용량 선정",
    description: "부하·관성·가감속 → 필요 토크·출력·정격",
    category: "자동화",
    component: MotorSizingTool,
  },
  {
    slug: "gear-ratio",
    name: "기어비 / 감속기",
    description: "감속비·효율 → 출력 회전수·토크·동력",
    category: "자동화",
    component: GearRatioTool,
  },
  {
    slug: "belt-pulley",
    name: "벨트 · 풀리",
    description: "풀리경·축간거리 → 벨트 길이·속도비·벨트속도",
    category: "자동화",
    component: BeltPulleyTool,
  },
  {
    slug: "flow-pipe",
    name: "배관 유속 / 압력손실",
    description: "유량·관경 → 유속·레이놀즈수·압력손실",
    category: "자동화",
    component: FlowPipeTool,
  },
  {
    slug: "panel-cooling",
    name: "제어반 발열 / 냉각",
    description: "발열·표면적 → 필요 냉각용량·팬 풍량",
    category: "자동화",
    component: PanelCoolingTool,
  },
  {
    slug: "crc",
    name: "CRC / 체크섬",
    description: "Modbus CRC16·LRC·XOR·SUM (통신 디버깅)",
    category: "자동화",
    component: CrcTool,
  },
  // ───── 금융 / 실무 ─────
  {
    slug: "savings",
    name: "적금 · 예금 이자",
    description: "적금/예금 만기 원리금·이자 (세금 옵션)",
    category: "금융",
    component: SavingsTool,
  },
  {
    slug: "installment",
    name: "할부 vs 일시불",
    description: "할부 수수료 vs 일시불 기회비용 비교",
    category: "금융",
    component: InstallmentTool,
  },
  {
    slug: "currency",
    name: "환율 계산기",
    description: "환율 직접 입력 → 통화 변환 (오프라인)",
    category: "금융",
    component: CurrencyTool,
  },
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
    slug: "calculator",
    name: "공학용 계산기",
    description: "수식·함수(sin·log·sqrt)·거듭제곱 계산",
    category: "계산",
    component: CalculatorTool,
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
    slug: "age",
    name: "나이 / 만나이 계산기",
    description: "생년월일 → 만 나이·연 나이·살아온 일수",
    category: "일상",
    component: AgeTool,
  },
  {
    slug: "timer",
    name: "타이머 · 뽀모도로",
    description: "스톱워치·카운트다운·뽀모도로 (정확한 시간)",
    category: "일상",
    component: TimerTool,
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
    slug: "jwt-sign",
    name: "JWT 서명 생성기",
    description: "HS256/384/512 서명 JWT 생성 (오프라인)",
    category: "인코딩",
    component: JwtSignTool,
  },
  {
    slug: "base-convert",
    name: "진법 변환",
    description: "2·8·10·16진수 변환 + 비트 시프트",
    category: "변환",
    component: BaseConvertTool,
  },
  {
    slug: "regex",
    name: "정규식 테스터",
    description: "패턴 매치 하이라이트 + 그룹 표",
    category: "텍스트",
    component: RegexTool,
  },
  {
    slug: "cron",
    name: "Cron 표현식 해석기",
    description: "cron 필드 해석 + 다음 실행 시각 미리보기",
    category: "텍스트",
    component: CronTool,
  },
  {
    slug: "diff",
    name: "텍스트 Diff 비교",
    description: "두 텍스트 줄 단위 비교 + 추가/삭제 하이라이트",
    category: "텍스트",
    component: DiffTool,
  },
  {
    slug: "markdown",
    name: "Markdown 미리보기",
    description: "Markdown → 실시간 미리보기 (오프라인)",
    category: "텍스트",
    component: MarkdownTool,
  },
  {
    slug: "html-jsx",
    name: "HTML → JSX 변환",
    description: "class→className 등 JSX 규칙으로 변환",
    category: "텍스트",
    component: HtmlJsxTool,
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
