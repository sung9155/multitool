import type { ComponentType } from "react";

export type ToolCategory =
  | "자동화"
  | "금융"
  | "계산"
  | "변환"
  | "건강"
  | "일상"
  | "인코딩"
  | "생성"
  | "텍스트";

export interface Tool {
  /** URL 경로 (/t/<slug>) 와 고유 키로 사용 */
  slug: string;
  /** 사이드바/카드에 표시되는 이름 */
  name: string;
  /** 한 줄 설명 (검색 대상) */
  description: string;
  category: ToolCategory;
  /** 도구 본문 컴포넌트 */
  component: ComponentType;
}
