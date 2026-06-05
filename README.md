# 🧰 Multitool

일상 · 개발에 필요한 유틸리티를 한곳에 모은 정적 웹사이트.
React + Vite + Tailwind 로 빌드, Nginx 도커 이미지로 배포.

## 포함 도구

| 도구 | 설명 |
| --- | --- |
| JSON 포맷터 | 정렬 / 압축 / 유효성 검사 |
| Base64 변환 | 인코딩 / 디코딩 (UTF-8) |
| URL 인코딩 | 인코딩 / 디코딩 |
| 타임스탬프 변환 | Unix ↔ 날짜/시간 |
| UUID 생성기 | v4 대량 생성 |
| 해시 생성기 | SHA-1/256/384/512 |
| 부가세 계산기 | 공급가액 · 부가세 · 합계 |
| 색상 변환 | HEX ↔ RGB ↔ HSL |

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
