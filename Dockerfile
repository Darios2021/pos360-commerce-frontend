# =========================
# BUILD
# =========================
FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# =========================
# BUILD ARGS (CapRover)
# =========================
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_ENV
ARG API_BASE_URL
ARG PRERENDER_BRANCH_ID
ARG PRERENDER_LIMIT
ARG PRERENDER_MAX_PAGES
ARG PRERENDER_MAX_PRODUCTS
ARG CAPROVER_GIT_COMMIT_SHA

# =========================
# BUILD ENVS
# (✅ fallback a runtime ENV si ARG viene vacío)
# =========================
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_ENV=${VITE_ENV}
ENV API_BASE_URL=${API_BASE_URL}

ENV PRERENDER_BRANCH_ID=${PRERENDER_BRANCH_ID}
ENV PRERENDER_LIMIT=${PRERENDER_LIMIT}
ENV PRERENDER_MAX_PAGES=${PRERENDER_MAX_PAGES}
ENV PRERENDER_MAX_PRODUCTS=${PRERENDER_MAX_PRODUCTS}

ENV BUILD_SHA=${CAPROVER_GIT_COMMIT_SHA}

COPY package*.json ./
RUN npm ci

COPY . .

# ✅ Si no vinieron por ARG, usa lo que tengas en App Configs (ENV)
RUN node -e 'console.log("[build env] VITE_API_BASE_URL=",process.env.VITE_API_BASE_URL); console.log("[build env] API_BASE_URL=",process.env.API_BASE_URL); console.log("[build env] PRERENDER_BRANCH_ID=",process.env.PRERENDER_BRANCH_ID);'

RUN npm run build:prerender

# =========================
# RUNTIME
# =========================
FROM nginx:stable-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
