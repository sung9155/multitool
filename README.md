# 🧰 Multitool

일상 · 개발에 필요한 유틸리티를 한곳에 모은 정적 웹사이트.
React + Vite + Tailwind 로 빌드, Nginx 도커 이미지로 배포.

- 다국어(한/영/중) · 다크/라이트 테마 · PWA(오프라인) · 즐겨찾기 · 최근 사용
- **빠른 검색 팔레트**: 어디서든 `Ctrl/⌘ + K` 로 도구 검색·이동

## 포함 도구

**자동화 / FA** — 아날로그 스케일링, 볼스크류, 엔코더, 공압 실린더 추력,
PID 시뮬레이터, 3상 전력/전류, 택트타임, OEE, 압력 변환, 옴의 법칙,
저항 컬러코드, 모터 용량 선정, 기어비/감속기, 벨트·풀리, 배관 압력손실,
제어반 발열/냉각, CRC/체크섬(Modbus)

**금융** — 연봉 실수령액, 대출 상환, 적금·예금 이자, 할부 vs 일시불, 환율 계산기

**계산 / 변환 / 건강** — 퍼센트, 부가세, 공학용 계산기, 단위 변환,
진법 변환, 타임스탬프, 색상 변환, BMI

**일상** — 날짜 계산/D-Day, 나이/만나이, 타이머·뽀모도로, 더치페이, 세계 시간

**텍스트 / 인코딩 / 생성** — JSON 포맷터, 정규식 테스터, Cron 해석기,
텍스트 Diff, Markdown 미리보기, HTML→JSX, 글자수 세기,
Base64, URL 인코딩, JWT 디코더/서명, UUID, 해시, QR 코드

## 로컬 개발

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ 정적 산출물
```

## 새 도구 추가

1. `src/tools/MyTool.tsx` 컴포넌트 작성
2. `src/tools/registry.ts` 에 import 후 배열에 항목 추가

라우팅 · 사이드바 · 검색 자동 반영. 끝.

## 도커 배포 (미니PC / Ubuntu)

```bash
# 코드 미니PC로 복사 후
docker compose up -d --build
```

호스트 `8080` 포트에서 동작 → `http://<미니PC-IP>:8080`

### Nginx Proxy Manager 연결

1. NPM 관리화면 → **Proxy Hosts** → **Add Proxy Host**
2. Domain Names: `tools.<your-id>.duckdns.org`
3. Scheme: `http`
   - Forward Hostname/IP: 미니PC IP (또는 같은 도커 네트워크면 `multitool`)
   - Forward Port: `8080` (같은 네트워크면 `80`)
4. **SSL** 탭 → Request a new SSL Certificate (Let's Encrypt) → Force SSL

> 같은 도커 네트워크 사용 시 `docker-compose.yml` 의 `networks` 주석 해제하고
> `ports` 는 지워도 됨. NPM 이 컨테이너 이름으로 직접 접근.

### DuckDNS

- DuckDNS 도메인이 집 공인 IP 를 가리키도록 설정 (ddns 갱신 스크립트/컨테이너)
- 공유기에서 `80`, `443` 포트 → 미니PC(NPM) 로 포트포워딩
