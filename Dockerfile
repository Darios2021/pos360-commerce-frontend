# =========================
# BUILD
# =========================
FROM node:22-alpine AS build

WORKDIR /app

# ✅ deps necesarias para puppeteer/chromium (prerender)
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

# ✅ evita que puppeteer intente descargar su chrome
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Variables build (CapRover)
ARG PRERENDER_CATALOG_URL
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_ENV
ARG CAPROVER_GIT_COMMIT_SHA

ENV PRERENDER_CATALOG_URL=${PRERENDER_CATALOG_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_ENV=${VITE_ENV}
ENV BUILD_SHA=${CAPROVER_GIT_COMMIT_SHA}

COPY package*.json ./
RUN npm ci

COPY . .

# ✅ build (incluye prerender:routes + vite build)
RUN npm run build

# =========================
# RUNTIME
# =========================
FROM nginx:stable-alpine AS runtime

# ✅ tu nginx.conf “anti-loop”
COPY nginx.conf /etc/nginx/conf.d/default.conf

# dist
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
