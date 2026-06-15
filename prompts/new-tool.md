# 클로드 디자인용 프롬프트 — Multitool 새 도구 만들기

> 클로드(claude.ai / Artifacts·디자인)에 아래 블록을 통째로 붙여넣고,
> 맨 아래 **"만들 도구"** 칸만 원하는 도구로 바꿔서 사용하세요.
> 출력은 이 저장소의 `src/tools/` 에 바로 넣을 수 있는 단일 `.tsx` 컴포넌트입니다.

---

너는 "Multitool" 이라는 정적 웹앱에 들어갈 **유틸리티 도구 컴포넌트 하나**를 만든다.
스택은 **React 19 + Vite + Tailwind CSS v4 + TypeScript** 다. 아래 규칙을 *정확히* 지켜라.

## 프로젝트 성격
- 일상/개발/FA(자동화)용 계산·변환 도구를 한 화면에 하나씩 보여주는 SPA.
- 도구는 입력 → 즉시 계산 결과 표시 형태. 별도 "계산" 버튼 없이 입력하면 바로 반영된다.
- 다크 모드가 기본이며, 라이트/다크 모두에서 깨지지 않아야 한다.
- 한국어(ko)/영어(en)/중국어(zh) 3개 언어를 지원한다.

## 디자인 시스템 (반드시 이 토큰만 사용)
- 색상: **zinc** 회색 계열 + **indigo** 강조색. 임의 색상은 결과 강조(차트/분류)에만.
  - 텍스트: `text-zinc-900 dark:text-zinc-100`, 보조 텍스트 `text-zinc-500`
  - 테두리: `border-zinc-300 dark:border-zinc-700`
  - 강조 버튼/포커스: `indigo-600` / `focus:border-indigo-500`
- 모서리는 `rounded-md`, 간격은 `space-y-5` / `grid gap-3` 위주.
- 폰트: 숫자·코드 값은 `font-mono`.
- 반응형: 입력은 모바일 1열, `sm:` 이상 2열 → `grid gap-3 sm:grid-cols-2`.

## 반드시 재사용할 공용 컴포넌트 (직접 만들지 말 것)
`src/components/ui` 에서 import 한다:

```tsx
import { Field, TextInput, TextArea, Stat, Button, CopyButton, ErrorText, fmtNum } from "../components/ui";
```

- `<Field label hint>{children}</Field>` — 라벨+힌트 래퍼. 입력은 항상 Field로 감싼다.
- `<TextInput mono inputMode="decimal" value onChange />` — 한 줄 입력.
- `<TextArea mono value onChange />` — 여러 줄 입력.
- `<Stat label value unit accent />` — 계산 결과 카드. 핵심 결과엔 `accent`.
- `<Button variant="primary"|"ghost" onClick>` / `<CopyButton value={문자열} />`
- `<ErrorText>{메시지}</ErrorText>` — 입력 오류 표시.
- `fmtNum(n, digits=4)` — 천단위 콤마 + 자릿수 정리. 숫자 출력은 항상 이걸로.

차트가 필요하면 `src/components/charts` 의 `Gauge`, `PALETTE`(`indigo/emerald/amber/sky/rose` 등)를 쓴다. 없으면 생략.

## 상태 관리 규칙
- `useState` 대신 **`useToolState`** 를 쓴다. (localStorage 자동저장 + URL 공유)

```tsx
import { useToolState } from "../components/toolState";
const [height, setHeight] = useToolState("height", "172"); // 원시값(string/number/boolean)만, 기본값 필수
```

## 다국어(i18n) 규칙
- 컴포넌트 상단에 `TEXT` 객체로 ko/en/zh 문구를 모은다. UI에 들어가는 모든 문자열은 여기서 꺼낸다.

```tsx
import { useLang } from "../components/i18n";

const TEXT = {
  ko: { /* ... */ },
  en: { /* ... */ },
  zh: { /* ... */ },
} as const;

export default function MyTool() {
  const t = TEXT[useLang()];
  // ...
}
```

## 출력 형식 (엄수)
1. 파일은 **`export default function XxxTool()` 단일 컴포넌트** 하나. 외부 의존성 추가 금지(위에 명시된 공용 모듈과 React만 사용).
2. 최상위 래퍼는 `<div className="space-y-5"> … </div>`.
3. 계산 로직은 컴포넌트 안에서 파생값으로 처리(별도 버튼 없이 즉시 반영). 잘못된 입력은 `ErrorText`로 안내하고 결과는 `—` 처럼 안전하게.
4. 맨 아래에 `registry.ts` 에 추가할 메타데이터를 주석으로 함께 제시:

```ts
// registry.ts 추가용:
// import MyTool from "./MyTool";
// { slug: "my-tool", name: "도구이름", description: "한 줄 설명", category: "계산", component: MyTool },
// category 후보: "자동화" | "금융" | "계산" | "변환" | "건강" | "일상" | "인코딩" | "생성" | "텍스트"
```

5. 설명/잡담 없이 **코드 블록만** 출력한다.

## 참고 스타일 예시 (이 톤·구조를 따라라)
```tsx
export default function BmiTool() {
  const t = TEXT[useLang()];
  const [height, setHeight] = useToolState("height", "172");
  const [weight, setWeight] = useToolState("weight", "68");
  const h = Number(height) / 100;
  const bmi = h > 0 ? Number(weight) / (h * h) : 0;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.height} hint="cm">
          <TextInput mono inputMode="decimal" value={height}
            onChange={(e) => setHeight(e.target.value)} />
        </Field>
        <Field label={t.weight} hint="kg">
          <TextInput mono inputMode="decimal" value={weight}
            onChange={(e) => setWeight(e.target.value)} />
        </Field>
      </div>
      <Stat label={t.result} value={fmtNum(bmi, 1)} accent />
    </div>
  );
}
```

---

## 만들 도구
<!-- 아래 한 줄만 바꿔서 사용하세요 -->
**도구:** (예) 평수 ↔ 제곱미터 변환기 — 평/㎡ 상호 변환, 평당 가격 입력 시 총액 표시
