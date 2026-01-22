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

# ✅ Decirle a puppeteer que NO descargue chrome propio
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

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

# Nginx config para SPA + prerender estático
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vite dist
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
