# ==========================
# BUILD (Debian / glibc) ✅
# ==========================
FROM node:22-bookworm-slim AS build
WORKDIR /app

# ✅ Chromium + deps para puppeteer/prerender
RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# ✅ Puppeteer usa chromium del sistema (no descarga)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ✅ CONSUMIR build args de CapRover (para que NO diga "not consumed")
ARG PRERENDER_CATALOG_URL
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_ENV
ARG CAPROVER_GIT_COMMIT_SHA

# ✅ Exportarlas como env para el build (node scripts + vite build)
ENV PRERENDER_CATALOG_URL=${PRERENDER_CATALOG_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_ENV=${VITE_ENV}

# ✅ Cache-bust opcional (si cambia el commit, cambia esta layer)
ENV BUILD_SHA=${CAPROVER_GIT_COMMIT_SHA}

# deps
COPY package*.json ./
RUN npm ci

# app
COPY . .

# ✅ build (incluye prerender:routes -> vite build -> prerender)
RUN npm run build

# ==========================
# RUNTIME (Nginx) ✅
# ==========================
FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
