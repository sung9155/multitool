# ---------- 빌드 단계 ----------
FROM node:24-alpine AS build
WORKDIR /app

# 의존성 먼저 복사 → 레이어 캐시 활용
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- 실행 단계 ----------
FROM nginx:1.27-alpine AS runtime

# SPA 라우팅 + gzip 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 정적 빌드 산출물 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
